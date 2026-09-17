import { edges, relationKeys, shapeById, type EntityType, type School } from '../data/atlas';
import type { Language } from '../i18n/types';

/** Wire contract between the app and the Worker. Bump when the shape changes. */
export const CONTRACT_VERSION = 1;

export interface AskTurn {
  role: 'user' | 'model';
  text: string;
}

export interface AskRequest {
  version: typeof CONTRACT_VERSION;
  lang: Language;
  question: string;
  /** Previous turns, oldest first. The Worker truncates to a fixed window. */
  history: AskTurn[];
  /** Node the reader currently has open, if any. Lets "this author" resolve. */
  selectedId?: string;
}

/**
 * What the model is allowed to do to the graph. The app validates every id
 * against the atlas before acting; anything unknown is dropped, never rendered.
 */
export interface AskPlan {
  /** Prose answer in the request language. Cites nodes by name, never by id. */
  answer: string;
  /** Nodes the answer rests on. Rendered as chips; selecting one opens it. */
  highlight: string[];
  /** Ordered reading route. Only shown when every consecutive pair is an edge. */
  path: string[];
  /** Narrow the graph to a type and/or school when the question is a category. */
  filters: { type: EntityType | 'all'; school: School | 'all' };
  /** Offer to save the cited nodes as a named collection. */
  collection: { name: string; ids: string[] } | null;
  /** True when the atlas has nothing on the subject. The app says so plainly. */
  outOfScope: boolean;
}

export type AskErrorCode = 'bad_request' | 'rate_limited' | 'quota_exhausted' | 'upstream' | 'unavailable';

export interface AskError {
  error: AskErrorCode;
  message: string;
  /** Seconds until the caller may retry, when known. */
  retryAfter?: number;
}

export type AskResponse = { plan: AskPlan } | AskError;

export const MAX_QUESTION_CHARS = 600;
export const MAX_HISTORY_TURNS = 8;

const entityTypes = new Set<string>(['author', 'concept', 'method']);
const schools = new Set<string>(['foundations', 'strategic', 'critical', 'systems', 'literacy', 'experiential']);
const edgeKeys = new Set(edges.map((edge) => `${edge.source}>${edge.target}`));

function isEdge(a: string, b: string) {
  return edgeKeys.has(`${a}>${b}`) || edgeKeys.has(`${b}>${a}`);
}

/**
 * Coerces whatever the model returned into a plan the app can trust.
 * Unknown ids vanish; a path with a gap collapses to its highlights.
 */
export function sanitizePlan(raw: unknown): AskPlan {
  const input = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const ids = (value: unknown) =>
    Array.isArray(value)
      ? [...new Set(value.filter((id): id is string => typeof id === 'string' && shapeById.has(id)))]
      : [];

  const highlight = ids(input.highlight);
  let path = ids(input.path);
  if (path.length < 2 || path.some((id, index) => index > 0 && !isEdge(path[index - 1], id))) path = [];

  const rawFilters = (input.filters && typeof input.filters === 'object' ? input.filters : {}) as Record<string, unknown>;
  const type = typeof rawFilters.type === 'string' && entityTypes.has(rawFilters.type) ? (rawFilters.type as EntityType) : 'all';
  const school = typeof rawFilters.school === 'string' && schools.has(rawFilters.school) ? (rawFilters.school as School) : 'all';

  const rawCollection = (input.collection && typeof input.collection === 'object' ? input.collection : null) as Record<string, unknown> | null;
  const collectionIds = rawCollection ? ids(rawCollection.ids) : [];
  const collection = rawCollection && typeof rawCollection.name === 'string' && rawCollection.name.trim() && collectionIds.length
    ? { name: rawCollection.name.trim().slice(0, 48), ids: collectionIds }
    : null;

  return {
    answer: typeof input.answer === 'string' ? input.answer.trim() : '',
    highlight: highlight.length ? highlight : path,
    path,
    filters: { type, school },
    collection,
    outOfScope: input.outOfScope === true,
  };
}

/** JSON Schema handed to Gemini as `responseSchema`. Mirrors `AskPlan`. */
export const planSchema = {
  type: 'object',
  properties: {
    answer: { type: 'string' },
    highlight: { type: 'array', items: { type: 'string' } },
    path: { type: 'array', items: { type: 'string' } },
    filters: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['all', ...entityTypes] },
        school: { type: 'string', enum: ['all', ...schools] },
      },
      required: ['type', 'school'],
    },
    collection: {
      type: 'object',
      nullable: true,
      properties: { name: { type: 'string' }, ids: { type: 'array', items: { type: 'string' } } },
      required: ['name', 'ids'],
    },
    outOfScope: { type: 'boolean' },
  },
  required: ['answer', 'highlight', 'path', 'filters', 'collection', 'outOfScope'],
} as const;

export function isAskRequest(value: unknown): value is AskRequest {
  if (!value || typeof value !== 'object') return false;
  const body = value as Record<string, unknown>;
  return body.version === CONTRACT_VERSION
    && typeof body.lang === 'string' && ['es', 'en', 'pt'].includes(body.lang)
    && typeof body.question === 'string' && body.question.trim().length > 0 && body.question.length <= MAX_QUESTION_CHARS
    && Array.isArray(body.history)
    && body.history.every((turn) => turn && typeof turn === 'object'
      && ((turn as AskTurn).role === 'user' || (turn as AskTurn).role === 'model')
      && typeof (turn as AskTurn).text === 'string' && (turn as AskTurn).text.length <= 4000)
    && (body.selectedId === undefined || (typeof body.selectedId === 'string' && shapeById.has(body.selectedId)));
}

export { relationKeys };
