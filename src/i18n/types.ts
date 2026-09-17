import type { EntityType, RelationKey, School } from '../data/atlas';

export const languages = ['es', 'en', 'pt'] as const;
export type Language = (typeof languages)[number];

export const languageNames: Record<Language, string> = {
  es: 'Español',
  en: 'English',
  pt: 'Português',
};

/** Text for one node. Author names are never translated; concept and method names are. */
export interface NodeText {
  name: string;
  /** Label split across lines in the graph. Each language wraps differently. */
  lines?: string[];
  subtitle: string;
  description: string;
  question?: string;
  /** Publication titles stay in their language of record — they are citations. */
  publicationTitle: string;
  /** Either a descriptor ("Book") or an author name. Only descriptors get translated. */
  publicationKind: string;
}

export interface ContentDict {
  schools: Record<School, string>;
  typeLabels: Record<EntityType, string>;
  /** Plurals are irregular across languages — never build them by appending an 's'. */
  typePlurals: Record<EntityType, string>;
  /** `forward` reads source → target; `inverse` reads target → source. */
  relations: Record<RelationKey, { forward: string; inverse: string }>;
  nodes: Record<string, NodeText>;
}

export interface UiDict {
  brand: { tagline: string; home: string };
  nav: {
    explore: string;
    graph: string;
    authors: string;
    concepts: string;
    reading: string;
    yourCollections: string;
    createCollection: string;
    openNavigation: string;
    closeNavigation: string;
    workspace: string;
    yourWorkspace: string;
    storedOnDevice: string;
    storedForSession: string;
    guidance: string;
  };
  topbar: {
    livingAtlas: string;
    about: string;
    export: string;
    exportLong: string;
    language: string;
  };
  pages: Record<'graph' | 'authors' | 'concepts' | 'reading', { heading: string; description: string; breadcrumb: string; directoryTitle: string }>;
  collection: { description: string; directoryTitle: string };
  actions: { surprise: string; clearFilters: string; resetFilters: string; cancel: string; exploreGraph: string };
  view: { graphView: string; listView: string; nodes: string; entries: string; connections: string; azSort: string; mostConnected: string };
  search: {
    placeholder: string;
    label: string;
    clear: string;
    resultsLabel: string;
    followThread: string;
    noResults: string;
    footer: string;
  };
  filters: {
    allTypes: string;
    allSchools: string;
    showInAtlas: string;
    schoolOfThought: string;
    displaySettings: string;
    makeItYours: string;
    showLabels: string;
    showConnections: string;
    highlightRelated: string;
    dragTip: string;
    sortEntries: string;
    sortYourView: string;
    openDetails: string;
  };
  graph: {
    legend: string;
    exploring: string;
    returnToGraph: string;
    instructions: string;
    ariaLabel: string;
    zoomIn: string;
    zoomOut: string;
    resetZoom: string;
    fitToView: string;
    expand: string;
    exitExpand: string;
    gestureDrag: string;
    gestureZoom: string;
    minimap: string;
    emptyTitle: string;
    emptyBody: string;
    nodeHint: string;
  };
  directory: {
    columnAuthor: string;
    columnName: string;
    columnSchool: string;
    columnLinks: string;
    exploreConnections: string;
    save: string;
    removeFrom: string;
    removeFromCollections: string;
    emptyFilteredTitle: string;
    emptyFilteredBody: string;
    emptyTitle: string;
    emptyBody: string;
  };
  detail: {
    close: string;
    connectedIdeas: string;
    connectedThreads: string;
    focusOn: string;
    startHere: string;
    questionLabel: string;
    moreAboutAuthor: string;
    exploreSource: string;
    viewAll: string;
    showFewer: string;
    saveToCollection: string;
    savedToCollection: string;
    footer: string;
  };
  status: {
    focused: string;
    graph: string;
    discoveries: string;
    discovery: string;
    howToExplore: string;
    aboutConnections: string;
    footnote: string;
    curated: string;
  };
  about: {
    title: string;
    description: string;
    welcome: string;
    steps: { title: string; body: string }[];
    noteTitle: string;
    noteBody: string;
    noteSources: string;
    sourcesTitle: string;
    keyboardTip: string;
    cta: string;
  };
  create: {
    title: string;
    description: string;
    nameLabel: string;
    placeholder: string;
    hint: string;
    errorEmpty: string;
    errorDuplicate: string;
    submit: string;
  };
  save: {
    title: string;
    description: string;
    saveTo: string;
    hint: string;
    submit: string;
    remove: string;
  };
  exportModal: {
    title: string;
    description: string;
    summaryFiltered: string;
    summaryComplete: string;
    chooseFormat: string;
    svgTitle: string;
    svgBody: string;
    jsonTitle: string;
    jsonBody: string;
    graphViewHint: string;
    submit: string;
    exportNote: string;
    atlasTitle: string;
  };
  toasts: {
    newThread: string;
    savedTo: string;
    savedToCollections: string;
    removed: string;
    removedFrom: string;
    collectionReady: string;
    exportReady: string;
    dismiss: string;
  };
  ask: {
    open: string;
    title: string;
    eyebrow: string;
    placeholder: string;
    send: string;
    stop: string;
    thinking: string;
    intro: string;
    /** Starter questions shown before the first message. Written per language, not translated. */
    starters: string[];
    routeFrom: string;
    highlightedLabel: string;
    pathLabel: string;
    showPath: string;
    filtersApplied: string;
    saveCollection: string;
    collectionSaved: string;
    outOfScope: string;
    clear: string;
    close: string;
    disclaimer: string;
    offline: string;
    errors: Record<'bad_request' | 'rate_limited' | 'quota_exhausted' | 'upstream' | 'unavailable', string>;
  };
  defaultCollection: string;
}
