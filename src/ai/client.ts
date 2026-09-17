import { CONTRACT_VERSION, sanitizePlan, type AskError, type AskErrorCode, type AskPlan, type AskTurn } from './contract';
import type { Language } from '../i18n/types';

/** Set at build time. Empty means the guide is switched off and the UI hides it. */
export const ASK_ENDPOINT: string = (import.meta.env.VITE_ASK_ENDPOINT as string | undefined)?.trim() ?? '';

export const askEnabled = ASK_ENDPOINT.length > 0;

// Slightly beyond the Worker's own total budget, so its error message wins.
const CLIENT_TIMEOUT_MS = 30_000;

export class AskFailure extends Error {
  code: AskErrorCode;
  retryAfter?: number;
  constructor(error: AskError) {
    super(error.message);
    this.code = error.error;
    this.retryAfter = error.retryAfter;
  }
}

export async function ask(input: { lang: Language; question: string; history: AskTurn[]; selectedId?: string; signal?: AbortSignal }): Promise<AskPlan> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
  input.signal?.addEventListener('abort', () => controller.abort(), { once: true });

  let response: Response;
  try {
    response = await fetch(`${ASK_ENDPOINT.replace(/\/$/, '')}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: CONTRACT_VERSION, lang: input.lang, question: input.question, history: input.history, selectedId: input.selectedId }),
      signal: controller.signal,
    });
  } catch {
    throw new AskFailure({ error: 'unavailable', message: 'unreachable' });
  } finally {
    window.clearTimeout(timer);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new AskFailure({ error: 'upstream', message: 'unreadable' });
  }

  if (!response.ok || !body || typeof body !== 'object' || !('plan' in body)) {
    const error = body && typeof body === 'object' && 'error' in body ? (body as AskError) : { error: 'upstream' as const, message: 'unexpected' };
    throw new AskFailure(error);
  }

  // The Worker already sanitized, but the app never trusts ids it did not check itself.
  return sanitizePlan((body as { plan: unknown }).plan);
}
