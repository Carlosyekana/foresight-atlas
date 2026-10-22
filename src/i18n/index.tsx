import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { blueprintShapes, edgeId, edges, nodeShapes, threadShapes, type AtlasEdge, type AtlasNode, type BlueprintShape, type ThreadShape } from '../data/atlas';
import { contentEn } from './content.en';
import { contentEs } from './content.es';
import { contentPt } from './content.pt';
import { languages, type ContentDict, type Language, type UiDict } from './types';
import { uiEn } from './ui.en';
import { uiEs } from './ui.es';
import { uiPt } from './ui.pt';

export { languageNames, languages, type Language } from './types';

const content: Record<Language, ContentDict> = { es: contentEs, en: contentEn, pt: contentPt };
const ui: Record<Language, UiDict> = { es: uiEs, en: uiEn, pt: uiPt };

const STORAGE_KEY = 'foresight-atlas-language-v1';
export const defaultLanguage: Language = 'es';

function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (languages as readonly string[]).includes(value);
}

function readLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLanguage(stored)) return stored;
  } catch { /* storage unavailable — fall through to the default */ }
  return defaultLanguage;
}

/** Fills {name}-style placeholders. Missing keys are left in place so they surface in review. */
export function format(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in values ? String(values[key]) : match));
}

function buildNodes(lang: Language): AtlasNode[] {
  const dict = content[lang];
  return nodeShapes.map((shape) => {
    const text = dict.nodes[shape.id];
    return {
      ...shape,
      name: text.name,
      lines: text.lines,
      subtitle: text.subtitle,
      description: text.description,
      question: text.question,
      publication: {
        title: text.publicationTitle,
        year: shape.publicationYear,
        kind: text.publicationKind,
        url: shape.publicationUrl,
      },
    };
  });
}

/**
 * Search matches names from every language, so someone reading the Spanish atlas
 * still finds a node by the English term they already know.
 */
const searchIndex = new Map<string, string>(
  nodeShapes.map((shape) => [
    shape.id,
    languages.map((lang) => content[lang].nodes[shape.id].name).join(' ').toLowerCase(),
  ]),
);

/** A Plano with part texts resolved and zipped with their node links. */
export interface AtlasBlueprint extends Omit<BlueprintShape, 'links'> {
  parts: { title: string; body: string; example?: string; link: string | null }[];
}

/** A Hilo with its text resolved for the active language. */
export interface AtlasThread extends ThreadShape {
  title: string;
  dek: string;
  steps: Record<string, string>;
}

export interface I18n {
  lang: Language;
  setLang: (lang: Language) => void;
  ui: UiDict;
  schools: ContentDict['schools'];
  typeLabels: ContentDict['typeLabels'];
  typePlurals: ContentDict['typePlurals'];
  nodes: AtlasNode[];
  nodeById: Map<string, AtlasNode>;
  /** Connections carry the edge itself plus its one-sentence context. */
  getConnections: (id: string) => { node: AtlasNode; relation: string; context: string; edge: AtlasEdge }[];
  /** The plain sentence that says why an edge exists, in the active language. */
  edgeContext: (edge: AtlasEdge) => string;
  threads: AtlasThread[];
  /** Method blueprints keyed by the method's node id. */
  blueprints: Map<string, AtlasBlueprint>;
  matchesSearch: (node: AtlasNode, query: string) => boolean;
}

const I18nContext = createContext<I18n | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(readLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* preference is per-session only */ }
  }, [lang]);

  const setLang = useCallback((next: Language) => setLangState(next), []);

  const value = useMemo<I18n>(() => {
    const dict = content[lang];
    const nodes = buildNodes(lang);
    const nodeById = new Map(nodes.map((node) => [node.id, node]));

    return {
      lang,
      setLang,
      ui: ui[lang],
      schools: dict.schools,
      typeLabels: dict.typeLabels,
      typePlurals: dict.typePlurals,
      nodes,
      nodeById,
      getConnections: (id) =>
        edges
          .filter((edge) => edge.source === id || edge.target === id)
          .map((edge) => ({
            node: nodeById.get(edge.source === id ? edge.target : edge.source)!,
            relation: edge.source === id ? dict.relations[edge.relation].forward : dict.relations[edge.relation].inverse,
            context: dict.edgeContexts[edgeId(edge)] ?? '',
            edge,
          })),
      edgeContext: (edge) => dict.edgeContexts[edgeId(edge)] ?? '',
      threads: threadShapes.map((shape) => ({ ...shape, ...dict.threads[shape.id] })),
      blueprints: new Map(blueprintShapes.map((shape) => [shape.nodeId, {
        nodeId: shape.nodeId,
        code: shape.code,
        kind: shape.kind,
        parts: (dict.blueprints[shape.nodeId]?.parts ?? []).map((part, index) => ({ ...part, link: shape.links[index] ?? null })),
      }])),
      matchesSearch: (node, query) => {
        const search = query.trim().toLowerCase();
        if (!search) return true;
        const haystack = `${node.name} ${node.subtitle} ${node.description} ${dict.schools[node.school]} ${searchIndex.get(node.id)} ${node.id === 'cla' ? 'CLA ACC' : ''}`;
        return haystack.toLowerCase().includes(search);
      },
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside a LanguageProvider');
  return value;
}
