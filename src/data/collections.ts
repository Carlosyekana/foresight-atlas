import { shapeById } from './atlas';

/**
 * Collections (saved entities) shared by the classic workspace and the dark
 * instrument: one localStorage store, so anything saved in one world shows
 * up in the other. Saved relations live alongside under their own key.
 */
export interface Collection { id: string; name: string; nodeIds: string[] }

export const COLLECTIONS_KEY = 'foresight-atlas-collections-v1';
export const SAVED_EDGES_KEY = 'foresight-atlas-saved-edges-v1';
/** The built-in collection keeps this id so its name can follow the active language. */
export const DEFAULT_COLLECTION_ID = 'discoveries';
export const defaultCollections: Collection[] = [{ id: DEFAULT_COLLECTION_ID, name: '', nodeIds: [] }];

export function readCollections(): Collection[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(COLLECTIONS_KEY) || 'null');
    if (!Array.isArray(raw)) return defaultCollections;
    const valid = raw.filter((item): item is Collection => !!item && typeof item.id === 'string' && typeof item.name === 'string' && Array.isArray(item.nodeIds));
    return valid.length ? valid.map((item) => ({ ...item, nodeIds: [...new Set(item.nodeIds.filter((id) => typeof id === 'string' && shapeById.has(id)))] })) : defaultCollections;
  } catch { return defaultCollections; }
}

export function writeCollections(collections: Collection[]): boolean {
  try { localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections)); return true; } catch { return false; }
}

/** Quick save/unsave: saved anywhere → removed everywhere; else → first collection. */
export function toggleNodeInCollections(collections: Collection[], nodeId: string): Collection[] {
  const saved = collections.some((item) => item.nodeIds.includes(nodeId));
  if (saved) return collections.map((item) => ({ ...item, nodeIds: item.nodeIds.filter((id) => id !== nodeId) }));
  return collections.map((item, index) => index === 0 ? { ...item, nodeIds: [...item.nodeIds, nodeId] } : item);
}

export function appendCollection(collections: Collection[], name: string, ids: string[], labelOf: (c: Collection) => string): { collections: Collection[]; name: string } {
  const unique = collections.some((item) => labelOf(item).toLowerCase() === name.toLowerCase()) ? `${name} ${collections.length}` : name;
  return { collections: [...collections, { id: `collection-${Date.now().toString(36)}`, name: unique, nodeIds: ids }], name: unique };
}

export function readSavedEdges(): string[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(SAVED_EDGES_KEY) || 'null');
    return Array.isArray(raw) ? raw.filter((id): id is string => typeof id === 'string') : [];
  } catch { return []; }
}

export function writeSavedEdges(ids: string[]): void {
  try { localStorage.setItem(SAVED_EDGES_KEY, JSON.stringify(ids)); } catch { /* private mode */ }
}
