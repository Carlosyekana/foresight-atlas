export type EntityType = 'author' | 'concept' | 'method';
export type School = 'foundations' | 'strategic' | 'critical' | 'systems' | 'literacy' | 'experiential';

export const relationKeys = ['developed', 'co-developed', 'advances', 'explores', 'practices', 'popularized',
  'pioneered', 'theorized', 'articulated', 'puts into practice', 'complements', 'is used in', 'draws on',
  'is related to', 'informs', 'supports', 'works toward'] as const;
export type RelationKey = (typeof relationKeys)[number];

/**
 * Structure only: ids, layout, typing and links. Every human-readable string
 * lives in `src/i18n/content.<lang>.ts`, keyed by these ids.
 */
export interface AtlasNodeShape {
  id: string;
  type: EntityType;
  school: School;
  x: number;
  y: number;
  radius: number;
  /** Authors are drawn as their initials. */
  initials?: string;
  publicationYear: string;
  publicationUrl: string;
  source: string;
}

export interface AtlasEdge {
  source: string;
  target: string;
  relation: RelationKey;
  reference?: string;
}

/** A node with its text resolved for the active language. */
export interface AtlasNode extends AtlasNodeShape {
  name: string;
  lines?: string[];
  subtitle: string;
  description: string;
  question?: string;
  publication: { title: string; year: string; kind: string; url: string };
}

export const palette = {
  author: { fill: '#e5dcf4', stroke: '#cbb9e7', ink: '#786095', soft: '#f3eef9' },
  concept: { fill: '#d9e8dd', stroke: '#b7d0be', ink: '#517b60', soft: '#eef5ef' },
  method: { fill: '#f3e3cc', stroke: '#e3c9a5', ink: '#a3814d', soft: '#faf3e9' },
};

/** One vivid hue per school — the node's ring. Type keeps the pastel fill,
 *  so the graph reads two encodings at once (fill = what it is, ring = its
 *  tradition), the way the reference maps color nine categories. */
export const schoolPalette: Record<School, { stroke: string; ink: string }> = {
  foundations: { stroke: '#6ecbff', ink: '#7cc7ee' },
  strategic: { stroke: '#b48cff', ink: '#bb9bf5' },
  critical: { stroke: '#ff6f61', ink: '#f28273' },
  systems: { stroke: '#3fd8c2', ink: '#4cc9b4' },
  literacy: { stroke: '#ffc93c', ink: '#d9ab3a' },
  experiential: { stroke: '#ff7ac2', ink: '#ef85c3' },
};

export const claSource = 'https://www.metafuture.org/causal-layered-analysis-2/';
export const triangleSource = 'https://www.adb.org/sites/default/files/publication/579491/futures-thinking-asia-pacific-policy-makers.pdf';
export const datorSource = 'https://jfsdigital.org/wp-content/uploads/2014/01/142-A01.pdf';
export const literacySource = 'https://www.unesco.org/en/futures-literacy/resources';
export const horizonsSource = 'https://www.iffpraxis.com/3h-approach';
export const meadowsSource = 'https://donellameadows.org/archives/leverage-points-places-to-intervene-in-a-system/';

export const nodeShapes: AtlasNodeShape[] = [
  {
    id: 'inayatullah', type: 'author', school: 'critical',
    x: 451, y: 309, radius: 31, initials: 'SI',
    publicationYear: '1998', publicationUrl: claSource, source: 'https://www.metafutureschool.org/',
  },
  {
    id: 'dator', type: 'author', school: 'foundations',
    x: 238, y: 276, radius: 25, initials: 'JD',
    publicationYear: '2009', publicationUrl: datorSource, source: datorSource,
  },
  {
    id: 'schwartz', type: 'author', school: 'strategic',
    x: 126, y: 470, radius: 23, initials: 'PS',
    publicationYear: '1991', publicationUrl: 'https://books.google.com/books/about/The_Art_of_the_Long_View.html?id=4vcOAQAAMAAJ', source: 'https://en.wikipedia.org/wiki/Peter_Schwartz_(futurist)',
  },
  {
    id: 'wack', type: 'author', school: 'strategic',
    x: 77, y: 349, radius: 20, initials: 'PW',
    publicationYear: '1985', publicationUrl: 'https://hbr.org/1985/09/scenarios-uncharted-waters-ahead', source: 'https://en.wikipedia.org/wiki/Pierre_Wack',
  },
  {
    id: 'kahn', type: 'author', school: 'strategic',
    x: 85, y: 178, radius: 20, initials: 'HK',
    publicationYear: '1967', publicationUrl: 'https://hudson.org/research/9019-hudson-institute-mourns-the-loss-of-founding-member-anthony-j-wiener', source: 'https://en.wikipedia.org/wiki/Herman_Kahn',
  },
  {
    id: 'bell', type: 'author', school: 'foundations',
    x: 200, y: 68, radius: 21, initials: 'WB',
    publicationYear: '1997', publicationUrl: 'https://en.wikipedia.org/wiki/Wendell_Bell', source: 'https://en.wikipedia.org/wiki/Wendell_Bell',
  },
  {
    id: 'slaughter', type: 'author', school: 'critical',
    x: 396, y: 111, radius: 22, initials: 'RS',
    publicationYear: '2004', publicationUrl: 'https://en.wikipedia.org/wiki/Richard_Slaughter', source: 'https://en.wikipedia.org/wiki/Richard_Slaughter',
  },
  {
    id: 'sardar', type: 'author', school: 'critical',
    x: 655, y: 158, radius: 22, initials: 'ZS',
    publicationYear: '2010', publicationUrl: 'https://doi.org/10.1016/j.futures.2009.11.028', source: 'https://en.wikipedia.org/wiki/Ziauddin_Sardar',
  },
  {
    id: 'meadows', type: 'author', school: 'systems',
    x: 790, y: 72, radius: 25, initials: 'DM',
    publicationYear: '1999', publicationUrl: meadowsSource, source: 'https://donellameadows.org/donella-the-person/',
  },
  {
    id: 'sharpe', type: 'author', school: 'systems',
    x: 876, y: 279, radius: 21, initials: 'BS',
    publicationYear: '2013', publicationUrl: 'https://www.iffpraxis.com/3h-book', source: 'https://www.iffpraxis.com/3h-book',
  },
  {
    id: 'miller', type: 'author', school: 'literacy',
    x: 678, y: 443, radius: 25, initials: 'RM',
    publicationYear: '2018', publicationUrl: 'https://digitallibrary.un.org/record/1494609', source: literacySource,
  },
  {
    id: 'candy', type: 'author', school: 'experiential',
    x: 818, y: 585, radius: 23, initials: 'SC',
    publicationYear: '2010', publicationUrl: 'https://catalogue.nla.gov.au/catalog/5740121', source: 'https://en.wikipedia.org/wiki/Stuart_Candy',
  },
  {
    id: 'dunne', type: 'author', school: 'experiential',
    x: 460, y: 549, radius: 21, initials: 'AD',
    publicationYear: '2013', publicationUrl: 'https://mitpress.mit.edu/9780262019842/speculative-everything/', source: 'https://en.wikipedia.org/wiki/Anthony_Dunne',
  },
  {
    id: 'masini', type: 'author', school: 'foundations',
    x: 93, y: 582, radius: 21, initials: 'EM',
    publicationYear: '1993', publicationUrl: 'https://en.wikipedia.org/wiki/Eleonora_Masini', source: 'https://en.wikipedia.org/wiki/Eleonora_Masini',
  },
  {
    id: 'alternative-futures', type: 'concept', school: 'foundations',
    x: 245, y: 172, radius: 22,
    publicationYear: '2009', publicationUrl: datorSource, source: datorSource,
  },
  {
    id: 'critical-futures', type: 'concept', school: 'critical',
    x: 375, y: 205, radius: 20,
    publicationYear: '1998', publicationUrl: claSource, source: claSource,
  },
  {
    id: 'integral-futures', type: 'concept', school: 'critical',
    x: 505, y: 63, radius: 17,
    publicationYear: '2004', publicationUrl: 'https://en.wikipedia.org/wiki/Richard_Slaughter', source: 'https://en.wikipedia.org/wiki/Richard_Slaughter',
  },
  {
    id: 'postnormal-times', type: 'concept', school: 'critical',
    x: 641, y: 67, radius: 18,
    publicationYear: '2010', publicationUrl: 'https://doi.org/10.1016/j.futures.2009.11.028', source: 'https://doi.org/10.1016/j.futures.2009.11.028',
  },
  {
    id: 'systems-thinking', type: 'concept', school: 'systems',
    x: 773, y: 210, radius: 23,
    publicationYear: '2008', publicationUrl: 'https://www.penguinrandomhouse.com/books/801035/thinking-in-systems-by-donella-meadows/', source: meadowsSource,
  },
  {
    id: 'leverage-points', type: 'concept', school: 'systems',
    x: 892, y: 146, radius: 17,
    publicationYear: '1999', publicationUrl: meadowsSource, source: meadowsSource,
  },
  {
    id: 'futures-literacy', type: 'concept', school: 'literacy',
    x: 729, y: 354, radius: 23,
    publicationYear: '2018', publicationUrl: 'https://digitallibrary.un.org/record/1494609', source: literacySource,
  },
  {
    id: 'anticipation', type: 'concept', school: 'literacy',
    x: 610, y: 531, radius: 17,
    publicationYear: '2018', publicationUrl: 'https://digitallibrary.un.org/record/1494609', source: literacySource,
  },
  {
    id: 'preferred-futures', type: 'concept', school: 'foundations',
    x: 245, y: 549, radius: 19,
    publicationYear: '1997', publicationUrl: 'https://en.wikipedia.org/wiki/Wendell_Bell', source: 'https://en.wikipedia.org/wiki/Futures_studies',
  },
  {
    id: 'images-of-future', type: 'concept', school: 'foundations',
    x: 316, y: 57, radius: 18,
    publicationYear: '1973', publicationUrl: 'https://en.wikipedia.org/wiki/Fred_Polak', source: 'https://en.wikipedia.org/wiki/Fred_Polak',
  },
  {
    id: 'wild-cards', type: 'concept', school: 'strategic',
    x: 97, y: 270, radius: 15,
    publicationYear: 'Overview', publicationUrl: 'https://en.wikipedia.org/wiki/Wild_card_(foresight)', source: 'https://en.wikipedia.org/wiki/Wild_card_(foresight)',
  },
  {
    id: 'participatory-futures', type: 'concept', school: 'foundations',
    x: 364, y: 620, radius: 18,
    publicationYear: '1993', publicationUrl: 'https://en.wikipedia.org/wiki/Eleonora_Masini', source: 'https://en.wikipedia.org/wiki/Eleonora_Masini',
  },
  {
    id: 'scenario-planning', type: 'method', school: 'strategic',
    x: 211, y: 399, radius: 25,
    publicationYear: '1991', publicationUrl: 'https://books.google.com/books/about/The_Art_of_the_Long_View.html?id=4vcOAQAAMAAJ', source: 'https://en.wikipedia.org/wiki/Scenario_planning',
  },
  {
    id: 'cla', type: 'method', school: 'critical',
    x: 542, y: 222, radius: 25,
    publicationYear: '1998', publicationUrl: claSource, source: claSource,
  },
  {
    id: 'futures-triangle', type: 'method', school: 'critical',
    x: 505, y: 420, radius: 20,
    publicationYear: '2020', publicationUrl: triangleSource, source: triangleSource,
  },
  {
    id: 'six-pillars', type: 'method', school: 'critical',
    x: 633, y: 318, radius: 18,
    publicationYear: '2008', publicationUrl: 'https://doi.org/10.1108/14636680810855991', source: 'https://doi.org/10.1108/14636680810855991',
  },
  {
    id: 'three-horizons', type: 'method', school: 'systems',
    x: 867, y: 388, radius: 21,
    publicationYear: '2013', publicationUrl: 'https://www.iffpraxis.com/3h-book', source: horizonsSource,
  },
  {
    id: 'experiential-futures', type: 'method', school: 'experiential',
    x: 795, y: 494, radius: 21,
    publicationYear: '2010', publicationUrl: 'https://catalogue.nla.gov.au/catalog/5740121', source: 'https://en.wikipedia.org/wiki/Stuart_Candy',
  },
  {
    id: 'speculative-design', type: 'method', school: 'experiential',
    x: 555, y: 612, radius: 20,
    publicationYear: '2013', publicationUrl: 'https://mitpress.mit.edu/9780262019842/speculative-everything/', source: 'https://mitpress.mit.edu/9780262019842/speculative-everything/',
  },
  {
    id: 'horizon-scanning', type: 'method', school: 'strategic',
    x: 76, y: 87, radius: 17,
    publicationYear: '2024', publicationUrl: 'https://www.gov.uk/government/publications/futures-toolkit-for-policy-makers-and-analysts', source: 'https://www.gov.uk/government/publications/futures-toolkit-for-policy-makers-and-analysts',
  },
  {
    id: 'backcasting', type: 'method', school: 'strategic',
    x: 347, y: 455, radius: 20,
    publicationYear: '1982', publicationUrl: 'https://doi.org/10.1016/0301-4215(82)90048-9', source: 'https://en.wikipedia.org/wiki/Backcasting',
  },
  {
    id: 'futures-wheel', type: 'method', school: 'strategic',
    x: 317, y: 349, radius: 18,
    publicationYear: '2020', publicationUrl: triangleSource, source: triangleSource,
  },
];

// Author links describe contributions, not exclusive ownership. Concept links are editorial associations.
export const edges: AtlasEdge[] = [
  { source: 'inayatullah', target: 'cla', relation: 'developed', reference: claSource },
  { source: 'inayatullah', target: 'futures-triangle', relation: 'developed', reference: triangleSource },
  { source: 'inayatullah', target: 'six-pillars', relation: 'developed', reference: 'https://doi.org/10.1108/14636680810855991' },
  { source: 'inayatullah', target: 'critical-futures', relation: 'advances', reference: claSource },
  { source: 'inayatullah', target: 'alternative-futures', relation: 'explores', reference: claSource },
  { source: 'inayatullah', target: 'preferred-futures', relation: 'explores', reference: triangleSource },
  { source: 'inayatullah', target: 'participatory-futures', relation: 'practices', reference: triangleSource },
  { source: 'dator', target: 'alternative-futures', relation: 'advances', reference: datorSource },
  { source: 'dator', target: 'images-of-future', relation: 'explores', reference: datorSource },
  { source: 'dator', target: 'scenario-planning', relation: 'practices', reference: datorSource },
  { source: 'dator', target: 'preferred-futures', relation: 'explores', reference: datorSource },
  { source: 'schwartz', target: 'scenario-planning', relation: 'popularized' },
  { source: 'schwartz', target: 'alternative-futures', relation: 'explores' },
  { source: 'wack', target: 'scenario-planning', relation: 'pioneered' },
  { source: 'kahn', target: 'scenario-planning', relation: 'pioneered' },
  { source: 'kahn', target: 'alternative-futures', relation: 'explores' },
  { source: 'bell', target: 'alternative-futures', relation: 'theorized' },
  { source: 'bell', target: 'preferred-futures', relation: 'theorized' },
  { source: 'bell', target: 'images-of-future', relation: 'explores' },
  { source: 'slaughter', target: 'critical-futures', relation: 'advances' },
  { source: 'slaughter', target: 'integral-futures', relation: 'advances' },
  { source: 'sardar', target: 'postnormal-times', relation: 'developed' },
  { source: 'sardar', target: 'critical-futures', relation: 'advances' },
  { source: 'sardar', target: 'alternative-futures', relation: 'explores' },
  { source: 'meadows', target: 'systems-thinking', relation: 'advances', reference: meadowsSource },
  { source: 'meadows', target: 'leverage-points', relation: 'articulated', reference: meadowsSource },
  { source: 'sharpe', target: 'three-horizons', relation: 'co-developed', reference: horizonsSource },
  { source: 'sharpe', target: 'systems-thinking', relation: 'practices', reference: horizonsSource },
  { source: 'miller', target: 'futures-literacy', relation: 'advances', reference: literacySource },
  { source: 'miller', target: 'anticipation', relation: 'theorized', reference: literacySource },
  { source: 'candy', target: 'experiential-futures', relation: 'advances' },
  { source: 'candy', target: 'futures-literacy', relation: 'practices', reference: 'https://digitallibrary.un.org/record/1494609' },
  { source: 'candy', target: 'participatory-futures', relation: 'practices' },
  { source: 'dunne', target: 'speculative-design', relation: 'co-developed' },
  { source: 'dunne', target: 'alternative-futures', relation: 'explores' },
  { source: 'masini', target: 'participatory-futures', relation: 'advances' },
  { source: 'masini', target: 'preferred-futures', relation: 'explores' },
  { source: 'masini', target: 'images-of-future', relation: 'explores' },
  { source: 'cla', target: 'critical-futures', relation: 'puts into practice', reference: claSource },
  { source: 'cla', target: 'scenario-planning', relation: 'complements', reference: claSource },
  { source: 'cla', target: 'six-pillars', relation: 'is used in', reference: 'https://doi.org/10.1108/14636680810855991' },
  { source: 'futures-triangle', target: 'six-pillars', relation: 'is used in', reference: 'https://doi.org/10.1108/14636680810855991' },
  { source: 'futures-triangle', target: 'images-of-future', relation: 'draws on', reference: triangleSource },
  { source: 'critical-futures', target: 'integral-futures', relation: 'is related to' },
  { source: 'postnormal-times', target: 'systems-thinking', relation: 'is related to' },
  { source: 'systems-thinking', target: 'leverage-points', relation: 'informs', reference: meadowsSource },
  { source: 'systems-thinking', target: 'three-horizons', relation: 'informs', reference: horizonsSource },
  { source: 'futures-literacy', target: 'anticipation', relation: 'draws on', reference: literacySource },
  { source: 'futures-literacy', target: 'experiential-futures', relation: 'is related to' },
  { source: 'experiential-futures', target: 'speculative-design', relation: 'is related to' },
  { source: 'experiential-futures', target: 'participatory-futures', relation: 'supports' },
  { source: 'speculative-design', target: 'preferred-futures', relation: 'explores' },
  { source: 'scenario-planning', target: 'alternative-futures', relation: 'explores' },
  { source: 'horizon-scanning', target: 'scenario-planning', relation: 'informs' },
  { source: 'horizon-scanning', target: 'wild-cards', relation: 'explores' },
  { source: 'wild-cards', target: 'scenario-planning', relation: 'informs' },
  { source: 'backcasting', target: 'preferred-futures', relation: 'works toward' },
  { source: 'backcasting', target: 'three-horizons', relation: 'complements' },
  { source: 'futures-wheel', target: 'systems-thinking', relation: 'draws on' },
  { source: 'futures-wheel', target: 'scenario-planning', relation: 'informs' },
  { source: 'participatory-futures', target: 'preferred-futures', relation: 'explores' },
  { source: 'images-of-future', target: 'alternative-futures', relation: 'informs' },
];

export const shapeById = new Map(nodeShapes.map((node) => [node.id, node]));

/** Stable key for one edge, used to look up its context sentence per language. */
export function edgeId(edge: AtlasEdge): string {
  return `${edge.source}--${edge.target}`;
}

/**
 * A Hilo ("thread") is a curated reading route. Structure only: the title, dek
 * and step notes live in `src/i18n/content.<lang>.ts`, keyed by `id`, with one
 * step note per node id in `path`. Every consecutive pair is a real edge.
 */
export interface ThreadShape {
  id: string;
  /** File-style code shown in the instrument, e.g. HIL-01. Language-neutral. */
  code: string;
  path: string[];
}

export const threadShapes: ThreadShape[] = [
  { id: 'escenarios', code: 'HIL-01', path: ['kahn', 'scenario-planning', 'alternative-futures', 'dator', 'images-of-future'] },
  { id: 'critica', code: 'HIL-02', path: ['slaughter', 'integral-futures', 'critical-futures', 'cla', 'six-pillars'] },
  { id: 'sistemas', code: 'HIL-03', path: ['meadows', 'leverage-points', 'systems-thinking', 'three-horizons', 'backcasting'] },
  { id: 'tocar', code: 'HIL-04', path: ['dunne', 'speculative-design', 'experiential-futures', 'futures-literacy', 'miller'] },
];

/**
 * A Plano ("blueprint") is an exploded diagram of one method. Structure only:
 * part titles/bodies live in `content.<lang>.ts` under `blueprints[nodeId]`,
 * aligned by position with `links` (the node each part points to, if any).
 */
export type BlueprintKind = 'layers' | 'pillars' | 'horizons' | 'triangle';

export interface BlueprintShape {
  nodeId: string;
  code: string;
  kind: BlueprintKind;
  links: (string | null)[];
}

export const blueprintShapes: BlueprintShape[] = [
  { nodeId: 'cla', code: 'PLN-01', kind: 'layers', links: ['critical-futures', 'systems-thinking', 'images-of-future', 'preferred-futures'] },
  { nodeId: 'six-pillars', code: 'PLN-02', kind: 'pillars', links: ['futures-triangle', 'horizon-scanning', null, 'cla', 'scenario-planning', 'preferred-futures'] },
  { nodeId: 'three-horizons', code: 'PLN-03', kind: 'horizons', links: ['systems-thinking', 'wild-cards', 'backcasting'] },
  { nodeId: 'futures-triangle', code: 'PLN-04', kind: 'triangle', links: ['images-of-future', 'horizon-scanning', 'preferred-futures'] },
];
