import { isAskRequest, MAX_HISTORY_TURNS, planSchema, sanitizePlan, type AskError, type AskResponse } from '../../src/ai/contract';
import { systemPrompt } from '../../src/ai/prompt';

const MAX_BODY_BYTES = 16_384;
// Gemini returns 503 UNAVAILABLE under load and calls those spikes temporary, so a
// retry usually turns one into an answer. But waiting is itself a cost: past the total
// budget, telling the reader to try again beats making them watch a spinner.
const TOTAL_BUDGET_MS = 25_000;
const UPSTREAM_TIMEOUT_MS = 15_000;
const RETRYABLE_STATUS = new Set([500, 502, 503, 504]);
const MAX_ATTEMPTS = 2;
const BACKOFF_MS = [600];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function corsHeaders(origin: string | null, allowed: Set<string>): HeadersInit {
  const granted = origin && allowed.has(origin) ? origin : '';
  return {
    'Access-Control-Allow-Origin': granted,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(body: AskResponse, status: number, headers: HeadersInit, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, ...extra, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function fail(code: AskError['error'], message: string, status: number, headers: HeadersInit, retryAfter?: number) {
  const body: AskError = retryAfter ? { error: code, message, retryAfter } : { error: code, message };
  return json(body, status, headers, retryAfter ? { 'Retry-After': String(retryAfter) } : {});
}

function todayKey() {
  return `ask:${new Date().toISOString().slice(0, 10)}`;
}

function secondsUntilUtcMidnight() {
  const now = Date.now();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  return Math.max(60, Math.ceil((midnight.getTime() - now) / 1000));
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number; totalTokenCount?: number };
  error?: { message?: string; status?: string };
}

/**
 * Gemini 2.5+ reasons before answering, which costs seconds this task does not need:
 * the atlas is in the prompt and the output is a fixed schema. THINKING_BUDGET is a
 * var so the shape can change without a code edit — "0" disables it, "" omits the field.
 */
function thinkingConfig(budget: string | undefined) {
  if (budget === undefined || budget === '') return {};
  return { thinkingConfig: { thinkingBudget: Number(budget) } };
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const allowed = new Set(env.ALLOWED_ORIGINS.split(',').map((item) => item.trim()).filter(Boolean));
    const headers = corsHeaders(request.headers.get('Origin'), allowed);
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (url.pathname !== '/ask') return fail('bad_request', 'Not found.', 404, headers);
    if (request.method !== 'POST') return fail('bad_request', 'Use POST.', 405, headers);

    const origin = request.headers.get('Origin');
    if (!origin || !allowed.has(origin)) return fail('bad_request', 'Origin not allowed.', 403, headers);

    const declared = Number(request.headers.get('Content-Length') ?? '0');
    if (declared > MAX_BODY_BYTES) return fail('bad_request', 'Request too large.', 413, headers);

    let body: unknown;
    try {
      const text = await request.text();
      if (text.length > MAX_BODY_BYTES) return fail('bad_request', 'Request too large.', 413, headers);
      body = JSON.parse(text);
    } catch {
      return fail('bad_request', 'Body must be JSON.', 400, headers);
    }
    if (!isAskRequest(body)) return fail('bad_request', 'Malformed request.', 400, headers);

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const { success } = await env.ASK_RATE_LIMIT.limit({ key: ip });
    if (!success) return fail('rate_limited', 'Too many questions in a row. Wait a moment.', 429, headers, 30);

    const cap = Number(env.DAILY_CAP) || 0;
    const counterKey = todayKey();
    const used = Number((await env.ASK_COUNTER.get(counterKey)) ?? '0');
    if (cap > 0 && used >= cap) {
      return fail('quota_exhausted', 'The atlas has answered all it can today. It rests until midnight UTC.', 429, headers, secondsUntilUtcMidnight());
    }

    const history = body.history.slice(-MAX_HISTORY_TURNS);
    const contents = [
      ...history.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
      { role: 'user', parts: [{ text: body.question }] },
    ];

    const started = Date.now();
    const requestBody = JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt(body.lang, body.selectedId) }] },
      contents,
      generationConfig: { temperature: 0.3, maxOutputTokens: 2048, responseMimeType: 'application/json', responseSchema: planSchema, ...thinkingConfig(env.THINKING_BUDGET) },
    });

    let upstream: Response | null = null;
    let payload: GeminiResponse = {};
    let lastFailure: 'unreachable' | 'unreadable' | 'status' = 'unreachable';

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      if (attempt > 0) await sleep(BACKOFF_MS[attempt - 1]);
      const remaining = TOTAL_BUDGET_MS - (Date.now() - started);
      if (remaining <= 3_000) break;
      try {
        upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
          body: requestBody,
          signal: AbortSignal.timeout(Math.min(UPSTREAM_TIMEOUT_MS, remaining)),
        });
      } catch (error) {
        lastFailure = 'unreachable';
        console.warn(JSON.stringify({ event: 'upstream_unreachable', attempt, message: error instanceof Error ? error.message : String(error) }));
        continue;
      }

      try {
        payload = (await upstream.json()) as GeminiResponse;
      } catch {
        lastFailure = 'unreadable';
        console.warn(JSON.stringify({ event: 'upstream_unreadable', attempt, status: upstream.status }));
        continue;
      }

      if (upstream.ok) break;

      lastFailure = 'status';
      const level = RETRYABLE_STATUS.has(upstream.status) ? console.warn : console.error;
      level(JSON.stringify({ event: 'upstream_error', attempt, status: upstream.status, status_code: payload.error?.status, message: payload.error?.message }));
      if (upstream.status === 429 || !RETRYABLE_STATUS.has(upstream.status)) break;
    }

    if (!upstream || !upstream.ok) {
      if (upstream?.status === 429) {
        return fail('quota_exhausted', 'The model is over its quota right now. Try again later.', 429, headers, 300);
      }
      // Every transient shape ends here: the model is up but has no room for us.
      if (lastFailure !== 'status' || RETRYABLE_STATUS.has(upstream?.status ?? 0)) {
        console.error(JSON.stringify({ event: 'upstream_gave_up', model: env.GEMINI_MODEL, lastFailure, status: upstream?.status, ms: Date.now() - started }));
        return fail('busy', 'The model is under heavy load right now. Try again in a moment.', 503, headers, 30);
      }
      return fail('upstream', 'The model returned an error.', 502, headers);
    }

    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
    let plan;
    try {
      plan = sanitizePlan(JSON.parse(text));
    } catch {
      console.error(JSON.stringify({ event: 'plan_unparseable', finishReason: payload.candidates?.[0]?.finishReason, usage: payload.usageMetadata, sample: text.slice(0, 200) }));
      return fail('upstream', 'The model answered off-script.', 502, headers);
    }

    ctx.waitUntil(env.ASK_COUNTER.put(counterKey, String(used + 1), { expirationTtl: 60 * 60 * 36 }));

    console.log(JSON.stringify({
      event: 'ask',
      lang: body.lang,
      questionChars: body.question.length,
      historyTurns: history.length,
      highlighted: plan.highlight.length,
      pathLength: plan.path.length,
      outOfScope: plan.outOfScope,
      tokens: payload.usageMetadata?.totalTokenCount,
      thoughtTokens: payload.usageMetadata?.thoughtsTokenCount,
      finishReason: payload.candidates?.[0]?.finishReason,
      ms: Date.now() - started,
      dayUsed: used + 1,
    }));

    return json({ plan }, 200, headers);
  },
} satisfies ExportedHandler<Env>;
