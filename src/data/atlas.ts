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

/**
 * Initial figure: Inayatullah at the centre and the remaining entities on
 * three concentric rings (rendered radii 102, 194 and 285 around 480,330),
 * so the whole system loads as a circle. The stored `y` is the inverse of
 * the graph transform `y * 0.88 + 16` used by both graph views.
 */
export const nodeShapes: AtlasNodeShape[] = [
  {
    id: 'inayatullah', type: 'author', school: 'critical',
    x: 480, y: 357, radius: 31, initials: 'SI',
    publicationYear: '1998', publicationUrl: claSource, source: 'https://www.metafutureschool.org/',
  },
  {
    id: 'dator', type: 'author', school: 'foundations',
    x: 295, y: 110, radius: 25, initials: 'JD',
    publicationYear: '2009', publicationUrl: datorSource, source: datorSource,
  },
  {
    id: 'schwartz', type: 'author', school: 'strategic',
    x: 201, y: 425, radius: 23, initials: 'PS',
    publicationYear: '1991', publicationUrl: 'https://books.google.com/books/about/The_Art_of_the_Long_View.html?id=4vcOAQAAMAAJ', source: 'https://en.wikipedia.org/wiki/Peter_Schwartz_(futurist)',
  },
  {
    id: 'wack', type: 'author', school: 'strategic',
    x: 200, y: 295, radius: 20, initials: 'PW',
    publicationYear: '1985', publicationUrl: 'https://hbr.org/1985/09/scenarios-uncharted-waters-ahead', source: 'https://en.wikipedia.org/wiki/Pierre_Wack',
  },
  {
    id: 'kahn', type: 'author', school: 'strategic',
    x: 341, y: 74, radius: 20, initials: 'HK',
    publicationYear: '1967', publicationUrl: 'https://hudson.org/research/9019-hudson-institute-mourns-the-loss-of-founding-member-anthony-j-wiener', source: 'https://en.wikipedia.org/wiki/Herman_Kahn',
  },
  {
    id: 'bell', type: 'author', school: 'foundations',
    x: 576, y: 52, radius: 21, initials: 'WB',
    publicationYear: '1997', publicationUrl: 'https://en.wikipedia.org/wiki/Wendell_Bell', source: 'https://en.wikipedia.org/wiki/Wendell_Bell',
  },
  {
    id: 'slaughter', type: 'author', school: 'critical',
    x: 467, y: 137, radius: 22, initials: 'RS',
    publicationYear: '2004', publicationUrl: 'https://en.wikipedia.org/wiki/Richard_Slaughter', source: 'https://en.wikipedia.org/wiki/Richard_Slaughter',
  },
  {
    id: 'sardar', type: 'author', school: 'critical',
    x: 609, y: 192, radius: 22, initials: 'ZS',
    publicationYear: '2010', publicationUrl: 'https://doi.org/10.1016/j.futures.2009.11.028', source: 'https://en.wikipedia.org/wiki/Ziauddin_Sardar',
  },
  {
    id: 'meadows', type: 'author', school: 'systems',
    x: 747, y: 244, radius: 25, initials: 'DM',
    publicationYear: '1999', publicationUrl: meadowsSource, source: 'https://donellameadows.org/donella-the-person/',
  },
  {
    id: 'sharpe', type: 'author', school: 'systems',
    x: 725, y: 522, radius: 21, initials: 'BS',
    publicationYear: '2013', publicationUrl: 'https://www.iffpraxis.com/3h-book', source: 'https://www.iffpraxis.com/3h-book',
  },
  {
    id: 'miller', type: 'author', school: 'literacy',
    x: 651, y: 460, radius: 25, initials: 'RM',
    publicationYear: '2018', publicationUrl: 'https://digitallibrary.un.org/record/1494609', source: literacySource,
  },
  {
    id: 'candy', type: 'author', school: 'experiential',
    x: 463, y: 680, radius: 23, initials: 'SC',
    publicationYear: '2010', publicationUrl: 'https://catalogue.nla.gov.au/catalog/5740121', source: 'https://en.wikipedia.org/wiki/Stuart_Candy',
  },
  {
    id: 'dunne', type: 'author', school: 'experiential',
    x: 486, y: 577, radius: 21, initials: 'AD',
    publicationYear: '2013', publicationUrl: 'https://mitpress.mit.edu/9780262019842/speculative-everything/', source: 'https://en.wikipedia.org/wiki/Anthony_Dunne',
  },
  {
    id: 'masini', type: 'author', school: 'foundations',
    x: 229, y: 510, radius: 12, initials: 'EM',
    publicationYear: '1993', publicationUrl: 'https://en.wikipedia.org/wiki/Eleonora_Masini', source: 'https://en.wikipedia.org/wiki/Eleonora_Masini',
  },
  {
    id: 'alternative-futures', type: 'concept', school: 'foundations',
    x: 483, y: 33, radius: 22,
    publicationYear: '2009', publicationUrl: datorSource, source: datorSource,
  },
  {
    id: 'critical-futures', type: 'concept', school: 'critical',
    x: 414, y: 150, radius: 20,
    publicationYear: '1998', publicationUrl: claSource, source: claSource,
  },
  {
    id: 'integral-futures', type: 'concept', school: 'critical',
    x: 659, y: 105, radius: 17,
    publicationYear: '2004', publicationUrl: 'https://en.wikipedia.org/wiki/Richard_Slaughter', source: 'https://en.wikipedia.org/wiki/Richard_Slaughter',
  },
  {
    id: 'postnormal-times', type: 'concept', school: 'critical',
    x: 692, y: 141, radius: 18,
    publicationYear: '2010', publicationUrl: 'https://doi.org/10.1016/j.futures.2009.11.028', source: 'https://doi.org/10.1016/j.futures.2009.11.028',
  },
  {
    id: 'systems-thinking', type: 'concept', school: 'systems',
    x: 761, y: 414, radius: 23,
    publicationYear: '2008', publicationUrl: 'https://www.penguinrandomhouse.com/books/801035/thinking-in-systems-by-donella-meadows/', source: meadowsSource,
  },
  {
    id: 'leverage-points', type: 'concept', school: 'systems',
    x: 765, y: 357, radius: 17,
    publicationYear: '1999', publicationUrl: meadowsSource, source: meadowsSource,
  },
  {
    id: 'futures-literacy', type: 'concept', school: 'literacy',
    x: 671, y: 396, radius: 23,
    publicationYear: '2018', publicationUrl: 'https://digitallibrary.un.org/record/1494609', source: literacySource,
  },
  {
    id: 'anticipation', type: 'concept', school: 'literacy',
    x: 583, y: 544, radius: 17,
    publicationYear: '2018', publicationUrl: 'https://digitallibrary.un.org/record/1494609', source: literacySource,
  },
  {
    id: 'preferred-futures', type: 'concept', school: 'foundations',
    x: 251, y: 550, radius: 19,
    publicationYear: '1997', publicationUrl: 'https://en.wikipedia.org/wiki/Wendell_Bell', source: 'https://en.wikipedia.org/wiki/Futures_studies',
  },
  {
    id: 'images-of-future', type: 'concept', school: 'foundations',
    x: 621, y: 75, radius: 18,
    publicationYear: '1973', publicationUrl: 'https://en.wikipedia.org/wiki/Fred_Polak', source: 'https://en.wikipedia.org/wiki/Fred_Polak',
  },
  {
    id: 'wild-cards', type: 'concept', school: 'strategic',
    x: 232, y: 197, radius: 15,
    publicationYear: 'Overview', publicationUrl: 'https://en.wikipedia.org/wiki/Wild_card_(foresight)', source: 'https://en.wikipedia.org/wiki/Wild_card_(foresight)',
  },
  {
    id: 'participatory-futures', type: 'concept', school: 'foundations',
    x: 365, y: 653, radius: 18,
    publicationYear: '1993', publicationUrl: 'https://en.wikipedia.org/wiki/Eleonora_Masini', source: 'https://en.wikipedia.org/wiki/Eleonora_Masini',
  },
  {
    id: 'scenario-planning', type: 'method', school: 'strategic',
    x: 195, y: 358, radius: 25,
    publicationYear: '1991', publicationUrl: 'https://books.google.com/books/about/The_Art_of_the_Long_View.html?id=4vcOAQAAMAAJ', source: 'https://en.wikipedia.org/wiki/Scenario_planning',
  },
  {
    id: 'cla', type: 'method', school: 'critical',
    x: 451, y: 246, radius: 25,
    publicationYear: '1998', publicationUrl: claSource, source: claSource,
  },
  {
    id: 'futures-triangle', type: 'method', school: 'critical',
    x: 551, y: 440, radius: 20,
    publicationYear: '2020', publicationUrl: triangleSource, source: triangleSource,
  },
  {
    id: 'six-pillars', type: 'method', school: 'critical',
    x: 663, y: 283, radius: 18,
    publicationYear: '2008', publicationUrl: 'https://doi.org/10.1108/14636680810855991', source: 'https://doi.org/10.1108/14636680810855991',
  },
  {
    id: 'three-horizons', type: 'method', school: 'systems',
    x: 694, y: 570, radius: 21,
    publicationYear: '2013', publicationUrl: 'https://www.iffpraxis.com/3h-book', source: horizonsSource,
  },
  {
    id: 'experiential-futures', type: 'method', school: 'experiential',
    x: 567, y: 665, radius: 21,
    publicationYear: '2010', publicationUrl: 'https://catalogue.nla.gov.au/catalog/5740121', source: 'https://en.wikipedia.org/wiki/Stuart_Candy',
  },
  {
    id: 'speculative-design', type: 'method', school: 'experiential',
    x: 538, y: 567, radius: 20,
    publicationYear: '2013', publicationUrl: 'https://mitpress.mit.edu/9780262019842/speculative-everything/', source: 'https://mitpress.mit.edu/9780262019842/speculative-everything/',
  },
  {
    id: 'horizon-scanning', type: 'method', school: 'strategic',
    x: 434, y: 37, radius: 17,
    publicationYear: '2024', publicationUrl: 'https://www.gov.uk/government/publications/futures-toolkit-for-policy-makers-and-analysts', source: 'https://www.gov.uk/government/publications/futures-toolkit-for-policy-makers-and-analysts',
  },
  {
    id: 'backcasting', type: 'method', school: 'strategic',
    x: 322, y: 485, radius: 20,
    publicationYear: '1982', publicationUrl: 'https://doi.org/10.1016/0301-4215(82)90048-9', source: 'https://en.wikipedia.org/wiki/Backcasting',
  },
  {
    id: 'futures-wheel', type: 'method', school: 'strategic',
    x: 289, y: 319, radius: 18,
    publicationYear: '2020', publicationUrl: triangleSource, source: triangleSource,
  },
  {
    id: 'berger', type: 'author', school: 'foundations',
    x: 330, y: 217, radius: 20, initials: 'GB',
    publicationYear: '1957', publicationUrl: 'https://www.futuribles.com/en/la-prospective/histoire-et-memoire-de-la-prospective/histoire-de-la-prospective/', source: 'https://en.wikipedia.org/wiki/Gaston_Berger',
  },
  {
    id: 'jouvenel', type: 'author', school: 'foundations',
    x: 387, y: 51, radius: 20, initials: 'BJ',
    publicationYear: '1964', publicationUrl: 'https://en.wikipedia.org/wiki/Bertrand_de_Jouvenel', source: 'https://en.wikipedia.org/wiki/Bertrand_de_Jouvenel',
  },
  {
    id: 'polak', type: 'author', school: 'foundations',
    x: 368, y: 177, radius: 20, initials: 'FP',
    publicationYear: '1973', publicationUrl: 'https://en.wikipedia.org/wiki/Fred_Polak', source: 'https://en.wikipedia.org/wiki/Fred_Polak',
  },
  {
    id: 'helmer', type: 'author', school: 'foundations',
    x: 303, y: 266, radius: 19, initials: 'OH',
    publicationYear: '1963', publicationUrl: 'https://doi.org/10.1287/mnsc.9.3.458', source: 'https://www.rand.org/pubs/research_memoranda/RM727z1.html',
  },
  {
    id: 'godet', type: 'author', school: 'strategic',
    x: 413, y: 444, radius: 21, initials: 'MG',
    publicationYear: '2000', publicationUrl: 'http://en.laprospective.fr/dyn/anglais/articles/art_of_scenarios.pdf', source: 'http://en.laprospective.fr/dyn/anglais/articles/art_of_scenarios.pdf',
  },
  {
    id: 'galtung', type: 'author', school: 'critical',
    x: 380, y: 335, radius: 20, initials: 'JG',
    publicationYear: '1969', publicationUrl: 'https://www.prio.org/publications/11799', source: 'https://www.prio.org/publications/11799',
  },
  {
    id: 'gidley', type: 'author', school: 'critical',
    x: 520, y: 141, radius: 20, initials: 'JG',
    publicationYear: '2017', publicationUrl: 'https://global.oup.com/academic/product/the-future-9780198735281', source: 'https://global.oup.com/academic/product/the-future-9780198735281',
  },
  {
    id: 'kenneth-boulding', type: 'author', school: 'systems',
    x: 722, y: 186, radius: 21, initials: 'KB',
    publicationYear: '1956', publicationUrl: 'https://www.press.umich.edu/9476/image', source: 'https://en.wikipedia.org/wiki/Kenneth_Boulding',
  },
  {
    id: 'robinson', type: 'author', school: 'systems',
    x: 579, y: 387, radius: 20, initials: 'JR',
    publicationYear: '1982', publicationUrl: 'https://doi.org/10.1016/0301-4215(82)90048-9', source: 'https://doi.org/10.1016/0301-4215(82)90048-9',
  },
  {
    id: 'damhof', type: 'author', school: 'literacy',
    x: 657, y: 611, radius: 20, initials: 'LD',
    publicationYear: '2023', publicationUrl: 'https://doi.org/10.1177/27538699231174821', source: 'https://www.hanze.nl/nl/onderzoek/centers/centrum-voor-talent-en-leren/futures-literacy',
  },
  {
    id: 'milojevic', type: 'author', school: 'literacy',
    x: 553, y: 276, radius: 20, initials: 'IM',
    publicationYear: '2005', publicationUrl: 'https://www.routledge.com/Educational-Futures-Dominant-and-Contesting-Visions/Milojevic/p/book/9780415603638', source: 'https://www.metafuture.org/about/biography-ivana-milojevic/',
  },
  {
    id: 'elise-boulding', type: 'author', school: 'literacy',
    x: 298, y: 433, radius: 20, initials: 'EB',
    publicationYear: '1988', publicationUrl: 'https://doi.org/10.1111/j.1540-4560.1988.tb02061.x', source: 'https://en.wikipedia.org/wiki/Elise_M._Boulding',
  },
  {
    id: 'jungk', type: 'author', school: 'experiential',
    x: 284, y: 592, radius: 20, initials: 'RJ',
    publicationYear: '1987', publicationUrl: 'https://en.wikipedia.org/wiki/Robert_Jungk', source: 'https://en.wikipedia.org/wiki/Robert_Jungk',
  },
  {
    id: 'anab-jain', type: 'author', school: 'experiential',
    x: 516, y: 678, radius: 20, initials: 'AJ',
    publicationYear: '2017', publicationUrl: 'https://www.ted.com/talks/anab_jain_why_we_need_to_imagine_different_futures', source: 'https://superflux.in/',
  },
  {
    id: 'la-prospective', type: 'concept', school: 'foundations',
    x: 257, y: 155, radius: 19,
    publicationYear: '1957', publicationUrl: 'https://www.futuribles.com/en/la-prospective/histoire-et-memoire-de-la-prospective/histoire-de-la-prospective/', source: 'https://www.futuribles.com/en/la-prospective/histoire-et-memoire-de-la-prospective/histoire-de-la-prospective/',
  },
  {
    id: 'futures-cone', type: 'concept', school: 'strategic',
    x: 214, y: 242, radius: 18,
    publicationYear: '1994', publicationUrl: 'https://pubmed.ncbi.nlm.nih.gov/10132585/', source: 'https://thevoroscope.com/2017/02/24/the-futures-cone-use-and-history/',
  },
  {
    id: 'anticipatory-governance', type: 'concept', school: 'strategic',
    x: 579, y: 327, radius: 18,
    publicationYear: '2014', publicationUrl: 'https://doi.org/10.1177/0306312713508669', source: 'https://doi.org/10.1177/0306312713508669',
  },
  {
    id: 'decolonial-futures', type: 'concept', school: 'critical',
    x: 383, y: 394, radius: 18,
    publicationYear: '2023', publicationUrl: 'https://jfsdigital.org/articles-and-essays/2023-2/vol-28-no-1-september-2023/decolonizing-futures-practice-opening-up-authentic-alternative-futures/', source: 'https://jfsdigital.org/articles-and-essays/2023-2/vol-28-no-1-september-2023/decolonizing-futures-practice-opening-up-authentic-alternative-futures/',
  },
  {
    id: 'resilience', type: 'concept', school: 'systems',
    x: 747, y: 471, radius: 18,
    publicationYear: '1973', publicationUrl: 'https://doi.org/10.1146/annurev.es.04.110173.000245', source: 'https://doi.org/10.1146/annurev.es.04.110173.000245',
  },
  {
    id: 'wicked-problems', type: 'concept', school: 'systems',
    x: 642, y: 235, radius: 17,
    publicationYear: '1973', publicationUrl: 'https://doi.org/10.1007/BF01405730', source: 'https://doi.org/10.1007/BF01405730',
  },
  {
    id: 'limits-to-growth', type: 'concept', school: 'systems',
    x: 761, y: 304, radius: 19,
    publicationYear: '1972', publicationUrl: 'https://www.clubofrome.org/publication/the-limits-to-growth/', source: 'https://www.clubofrome.org/publication/the-limits-to-growth/',
  },
  {
    id: 'great-transition', type: 'concept', school: 'systems',
    x: 673, y: 336, radius: 18,
    publicationYear: '2002', publicationUrl: 'https://greattransition.org/publication/great-transition', source: 'https://greattransition.org/publication/great-transition',
  },
  {
    id: 'future-consciousness', type: 'concept', school: 'literacy',
    x: 566, y: 159, radius: 17,
    publicationYear: '2006', publicationUrl: 'https://www.centerforfutureconsciousness.com/', source: 'https://www.centerforfutureconsciousness.com/',
  },
  {
    id: 'used-future', type: 'concept', school: 'literacy',
    x: 459, y: 470, radius: 16,
    publicationYear: '2008', publicationUrl: 'https://doi.org/10.1108/14636680810855991', source: 'https://doi.org/10.1108/14636680810855991',
  },
  {
    id: 'weak-signals', type: 'concept', school: 'literacy',
    x: 531, y: 38, radius: 15,
    publicationYear: '1975', publicationUrl: 'https://doi.org/10.2307/41164635', source: 'https://doi.org/10.2307/41164635',
  },
  {
    id: 'long-term-thinking', type: 'concept', school: 'literacy',
    x: 394, y: 554, radius: 17,
    publicationYear: '2020', publicationUrl: 'https://www.romankrznaric.com/the-good-ancestor', source: 'https://www.romankrznaric.com/the-good-ancestor',
  },
  {
    id: 'afrofuturism', type: 'concept', school: 'experiential',
    x: 437, y: 572, radius: 17,
    publicationYear: '1994', publicationUrl: 'https://en.wikipedia.org/wiki/Afrofuturism', source: 'https://en.wikipedia.org/wiki/Afrofuturism',
  },
  {
    id: 'indigenous-futurisms', type: 'concept', school: 'experiential',
    x: 355, y: 526, radius: 17,
    publicationYear: '2012', publicationUrl: 'https://www.bibliovault.org/BV.book.epl?ISBN=9780816529827', source: 'https://www.bibliovault.org/BV.book.epl?ISBN=9780816529827',
  },
  {
    id: 'delphi-method', type: 'method', school: 'strategic',
    x: 287, y: 375, radius: 20,
    publicationYear: '1963', publicationUrl: 'https://doi.org/10.1287/mnsc.9.3.458', source: 'https://www.rand.org/pubs/research_memoranda/RM727z1.html',
  },
  {
    id: 'morphological-analysis', type: 'method', school: 'strategic',
    x: 403, y: 281, radius: 18,
    publicationYear: '1969', publicationUrl: 'https://www.swemorph.com/pdf/gma.pdf', source: 'https://www.swemorph.com/ma.html',
  },
  {
    id: 'micmac', type: 'method', school: 'systems',
    x: 508, y: 245, radius: 18,
    publicationYear: '1973', publicationUrl: 'http://en.laprospective.fr/dyn/anglais/articles/art_of_scenarios.pdf', source: 'http://en.laprospective.fr/dyn/anglais/articles/art_of_scenarios.pdf',
  },
  {
    id: 'cross-impact-analysis', type: 'method', school: 'systems',
    x: 507, y: 469, radius: 17,
    publicationYear: '1968', publicationUrl: 'https://doi.org/10.1016/S0016-3287(68)80003-5', source: 'https://doi.org/10.1016/S0016-3287(68)80003-5',
  },
  {
    id: 'futures-literacy-laboratory', type: 'method', school: 'literacy',
    x: 615, y: 642, radius: 20,
    publicationYear: '2023', publicationUrl: 'https://unesdoc.unesco.org/ark:/48223/pf0000386130', source: 'https://www.unesco.org/en/futures-literacy/resources',
  },
  {
    id: 'futures-workshops', type: 'method', school: 'experiential',
    x: 323, y: 627, radius: 19,
    publicationYear: '1987', publicationUrl: 'https://en.wikipedia.org/wiki/Futures_workshop', source: 'https://en.wikipedia.org/wiki/Futures_workshop',
  },
  {
    id: 'design-fiction', type: 'method', school: 'experiential',
    x: 411, y: 671, radius: 19,
    publicationYear: '2009', publicationUrl: 'https://nearfuturelaboratory.com/essays/2009/design-fiction-a-short-essay-on-design-science-fact-and-fiction/', source: 'https://nearfuturelaboratory.com/essays/2009/design-fiction-a-short-essay-on-design-science-fact-and-fiction/',
  },
  {
    id: 'futures-games', type: 'method', school: 'experiential',
    x: 619, y: 510, radius: 18,
    publicationYear: '2014', publicationUrl: 'http://situationlab.org/projects/the-thing-from-the-future/', source: 'http://situationlab.org/projects/the-thing-from-the-future/',
  },
  {
    id: 'javier-medina', type: 'author', school: 'foundations',
    x: 214, y: 474, radius: 12, initials: 'JM',
    publicationYear: '2014', publicationUrl: 'https://www.cepal.org/es/publicaciones/37057-prospectiva-politica-publica-cambio-estructural-america-latina-caribe', source: 'https://www.cepal.org/en/staff/javier-medina-vasquez',
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
  { source: 'berger', target: 'la-prospective', relation: 'developed', reference: 'https://www.futuribles.com/en/la-prospective/histoire-et-memoire-de-la-prospective/histoire-de-la-prospective/' },
  { source: 'berger', target: 'alternative-futures', relation: 'explores' },
  { source: 'berger', target: 'preferred-futures', relation: 'theorized' },
  { source: 'jouvenel', target: 'la-prospective', relation: 'advances', reference: 'https://www.futuribles.com/en/la-prospective/histoire-et-memoire-de-la-prospective/histoire-de-la-prospective/' },
  { source: 'jouvenel', target: 'alternative-futures', relation: 'theorized' },
  { source: 'polak', target: 'images-of-future', relation: 'developed', reference: 'https://en.wikipedia.org/wiki/Fred_Polak' },
  { source: 'polak', target: 'future-consciousness', relation: 'theorized' },
  { source: 'polak', target: 'preferred-futures', relation: 'explores' },
  { source: 'helmer', target: 'delphi-method', relation: 'co-developed', reference: 'https://doi.org/10.1287/mnsc.9.3.458' },
  { source: 'helmer', target: 'cross-impact-analysis', relation: 'pioneered', reference: 'https://doi.org/10.1016/S0016-3287(68)80003-5' },
  { source: 'helmer', target: 'scenario-planning', relation: 'practices', reference: 'https://www.rand.org/pubs/papers/P2982.html' },
  { source: 'godet', target: 'micmac', relation: 'co-developed', reference: 'http://en.laprospective.fr/dyn/anglais/articles/art_of_scenarios.pdf' },
  { source: 'godet', target: 'la-prospective', relation: 'practices', reference: 'http://en.laprospective.fr/dyn/anglais/articles/art_of_scenarios.pdf' },
  { source: 'godet', target: 'scenario-planning', relation: 'advances', reference: 'http://en.laprospective.fr/dyn/anglais/articles/art_of_scenarios.pdf' },
  { source: 'galtung', target: 'critical-futures', relation: 'advances' },
  { source: 'galtung', target: 'participatory-futures', relation: 'advances' },
  { source: 'gidley', target: 'integral-futures', relation: 'advances' },
  { source: 'gidley', target: 'future-consciousness', relation: 'advances' },
  { source: 'gidley', target: 'futures-literacy', relation: 'advances' },
  { source: 'kenneth-boulding', target: 'systems-thinking', relation: 'pioneered' },
  { source: 'kenneth-boulding', target: 'images-of-future', relation: 'theorized' },
  { source: 'robinson', target: 'backcasting', relation: 'developed', reference: 'https://doi.org/10.1016/0301-4215(82)90048-9' },
  { source: 'robinson', target: 'great-transition', relation: 'explores' },
  { source: 'robinson', target: 'preferred-futures', relation: 'explores' },
  { source: 'damhof', target: 'futures-literacy', relation: 'advances', reference: 'https://doi.org/10.1177/27538699231174821' },
  { source: 'damhof', target: 'futures-literacy-laboratory', relation: 'practices', reference: 'https://unesdoc.unesco.org/ark:/48223/pf0000386130' },
  { source: 'damhof', target: 'anticipation', relation: 'explores' },
  { source: 'milojevic', target: 'cla', relation: 'advances', reference: claSource },
  { source: 'milojevic', target: 'futures-literacy', relation: 'advances', reference: 'https://www.routledge.com/Educational-Futures-Dominant-and-Contesting-Visions/Milojevic/p/book/9780415603638' },
  { source: 'elise-boulding', target: 'images-of-future', relation: 'explores' },
  { source: 'elise-boulding', target: 'participatory-futures', relation: 'pioneered' },
  { source: 'elise-boulding', target: 'preferred-futures', relation: 'explores' },
  { source: 'jungk', target: 'futures-workshops', relation: 'developed', reference: 'https://en.wikipedia.org/wiki/Futures_workshop' },
  { source: 'jungk', target: 'participatory-futures', relation: 'pioneered' },
  { source: 'anab-jain', target: 'experiential-futures', relation: 'practices', reference: 'https://www.ted.com/talks/anab_jain_why_we_need_to_imagine_different_futures' },
  { source: 'anab-jain', target: 'design-fiction', relation: 'practices', reference: 'https://superflux.in/' },
  { source: 'anab-jain', target: 'speculative-design', relation: 'practices' },
  { source: 'bell', target: 'futures-cone', relation: 'theorized' },
  { source: 'meadows', target: 'limits-to-growth', relation: 'developed', reference: 'https://www.clubofrome.org/publication/the-limits-to-growth/' },
  { source: 'inayatullah', target: 'used-future', relation: 'articulated', reference: 'https://doi.org/10.1108/14636680810855991' },
  { source: 'miller', target: 'futures-literacy-laboratory', relation: 'advances', reference: 'https://unesdoc.unesco.org/ark:/48223/pf0000386130' },
  { source: 'candy', target: 'futures-games', relation: 'practices', reference: 'http://situationlab.org/projects/the-thing-from-the-future/' },
  { source: 'la-prospective', target: 'scenario-planning', relation: 'informs', reference: 'http://en.laprospective.fr/dyn/anglais/articles/art_of_scenarios.pdf' },
  { source: 'futures-cone', target: 'alternative-futures', relation: 'informs' },
  { source: 'futures-cone', target: 'preferred-futures', relation: 'informs' },
  { source: 'anticipatory-governance', target: 'anticipation', relation: 'puts into practice', reference: 'https://doi.org/10.1177/0306312713508669' },
  { source: 'anticipatory-governance', target: 'horizon-scanning', relation: 'draws on' },
  { source: 'anticipatory-governance', target: 'futures-literacy', relation: 'supports' },
  { source: 'decolonial-futures', target: 'critical-futures', relation: 'is related to', reference: 'https://jfsdigital.org/articles-and-essays/2023-2/vol-28-no-1-september-2023/decolonizing-futures-practice-opening-up-authentic-alternative-futures/' },
  { source: 'decolonial-futures', target: 'participatory-futures', relation: 'supports' },
  { source: 'afrofuturism', target: 'decolonial-futures', relation: 'is related to' },
  { source: 'afrofuturism', target: 'speculative-design', relation: 'informs' },
  { source: 'indigenous-futurisms', target: 'decolonial-futures', relation: 'supports' },
  { source: 'indigenous-futurisms', target: 'participatory-futures', relation: 'supports' },
  { source: 'resilience', target: 'systems-thinking', relation: 'draws on', reference: 'https://doi.org/10.1146/annurev.es.04.110173.000245' },
  { source: 'resilience', target: 'three-horizons', relation: 'informs' },
  { source: 'resilience', target: 'wicked-problems', relation: 'is related to' },
  { source: 'wicked-problems', target: 'systems-thinking', relation: 'draws on', reference: 'https://doi.org/10.1007/BF01405730' },
  { source: 'wicked-problems', target: 'morphological-analysis', relation: 'is related to', reference: 'https://www.swemorph.com/pdf/gma.pdf' },
  { source: 'morphological-analysis', target: 'scenario-planning', relation: 'is used in', reference: 'https://www.swemorph.com/pdf/gma.pdf' },
  { source: 'limits-to-growth', target: 'systems-thinking', relation: 'informs', reference: 'https://www.clubofrome.org/publication/the-limits-to-growth/' },
  { source: 'limits-to-growth', target: 'great-transition', relation: 'informs' },
  { source: 'great-transition', target: 'backcasting', relation: 'supports' },
  { source: 'future-consciousness', target: 'futures-literacy', relation: 'informs' },
  { source: 'used-future', target: 'six-pillars', relation: 'is used in', reference: 'https://doi.org/10.1108/14636680810855991' },
  { source: 'used-future', target: 'images-of-future', relation: 'informs' },
  { source: 'weak-signals', target: 'horizon-scanning', relation: 'informs' },
  { source: 'weak-signals', target: 'wild-cards', relation: 'is related to' },
  { source: 'long-term-thinking', target: 'backcasting', relation: 'supports' },
  { source: 'long-term-thinking', target: 'preferred-futures', relation: 'works toward' },
  { source: 'delphi-method', target: 'scenario-planning', relation: 'informs' },
  { source: 'delphi-method', target: 'cross-impact-analysis', relation: 'informs', reference: 'https://doi.org/10.1016/S0016-3287(68)80003-5' },
  { source: 'cross-impact-analysis', target: 'futures-wheel', relation: 'complements' },
  { source: 'micmac', target: 'systems-thinking', relation: 'draws on', reference: 'http://en.laprospective.fr/dyn/anglais/articles/art_of_scenarios.pdf' },
  { source: 'micmac', target: 'scenario-planning', relation: 'is used in', reference: 'http://en.laprospective.fr/dyn/anglais/articles/art_of_scenarios.pdf' },
  { source: 'futures-literacy-laboratory', target: 'futures-literacy', relation: 'puts into practice', reference: 'https://unesdoc.unesco.org/ark:/48223/pf0000386130' },
  { source: 'futures-workshops', target: 'participatory-futures', relation: 'puts into practice' },
  { source: 'futures-workshops', target: 'preferred-futures', relation: 'works toward' },
  { source: 'design-fiction', target: 'speculative-design', relation: 'complements' },
  { source: 'design-fiction', target: 'experiential-futures', relation: 'supports' },
  { source: 'futures-games', target: 'experiential-futures', relation: 'puts into practice', reference: 'http://situationlab.org/projects/the-thing-from-the-future/' },
  { source: 'futures-games', target: 'participatory-futures', relation: 'supports' },
  { source: 'javier-medina', target: 'masini', relation: 'draws on', reference: 'https://www.univalle.edu.co/lo-que-pasa-en-la-u/javier-medina-academia-colombiana-ciencias-economicas' },
  { source: 'javier-medina', target: 'anticipatory-governance', relation: 'practices', reference: 'https://www.cepal.org/es/publicaciones/37057-prospectiva-politica-publica-cambio-estructural-america-latina-caribe' },
  { source: 'javier-medina', target: 'participatory-futures', relation: 'advances', reference: 'https://www.cepal.org/es/publicaciones/37057-prospectiva-politica-publica-cambio-estructural-america-latina-caribe' },
  { source: 'javier-medina', target: 'long-term-thinking', relation: 'advances', reference: 'https://www.cepal.org/es/publicaciones/5490-manual-prospectiva-decision-estrategica-bases-teoricas-instrumentos-america' },
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
