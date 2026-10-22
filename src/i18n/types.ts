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

/** Text for one Plano (method blueprint). Parts align with the shape's links. */
export interface BlueprintText {
  parts: { title: string; body: string; example?: string }[];
}

/** Text for one Hilo (reading thread). Steps are keyed by node id. */
export interface ThreadText {
  title: string;
  dek: string;
  steps: Record<string, string>;
}

export interface ContentDict {
  schools: Record<School, string>;
  typeLabels: Record<EntityType, string>;
  /** Plurals are irregular across languages — never build them by appending an 's'. */
  typePlurals: Record<EntityType, string>;
  /** `forward` reads source → target; `inverse` reads target → source. */
  relations: Record<RelationKey, { forward: string; inverse: string }>;
  nodes: Record<string, NodeText>;
  /**
   * One plain sentence per edge: why this link exists. Keyed by `edgeId`
   * (`${source}--${target}`). Reads in the edge's forward direction. Every
   * edge in `data/atlas.ts` must have one in every language — the i18n layer
   * assembles them and a missing key surfaces as an empty context in the UI.
   */
  edgeContexts: Record<string, string>;
  /** Keyed by thread id from `threadShapes`. */
  threads: Record<string, ThreadText>;
  /** Keyed by method node id from `blueprintShapes`. */
  blueprints: Record<string, BlueprintText>;
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
    instrument: string;
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
    errors: Record<'bad_request' | 'rate_limited' | 'quota_exhausted' | 'busy' | 'upstream' | 'unavailable', string>;
  };
  defaultCollection: string;
  /** Chrome of the dark instrument mode (#/instrumento). */
  inst: {
    brandSub: string;
    map: string; index: string; classicView: string;
    searchPlaceholder: string; searchLabel: string;
    types: string; schools: string; threadsFiles: string; guidedRoutes: string; railHint: string;
    names: string; namesOff: string; namesKey: string; namesAll: string;
    zoomSystem: string; zoomConstellation: string; zoomNode: string;
    modeNetwork: string; modeOrbit: string; modeSchools: string; modeTimeline: string; modesLabel: string;
    nodesUpper: string; dataLine: string; world: string; backTitle: string;
    skipIntro: string; introKicker: string; introTitleA: string; introTitleB: string; introMeta: string;
    dossierWorld: string; instrumentWord: string; fieldTitle: string; fieldSub: string;
    plainFieldA: string; plainFieldB: string; plainFieldC: string; plainFieldD: string; plainFieldE: string;
    statModes: string; startByThread: string; stepsGuided: string; howTitle: string; howBody: string;
    backToWorld: string; backToThread: string;
    wovenA: string; wovenB: string; wovenC: string;
    school: string; year: string; connections: string; relations: string;
    publication: string; source: string; centerOrbit: string;
    directSource: string; editorialAssoc: string;
    threadFile: string; closeUpper: string; steps: string; years: string; chain: string;
    threadPlainA: string; threadPlainB: string; threadPlainC: string;
    openPaper: string; paperOpen: string; paperWord: string; paperAria: string;
    fileCard: string; photoShow: string; photoHide: string;
    reportKicker: string; reportData: string; directSources: string; timeSpan: string;
    kfAuthors: string; kfIdeas: string; kfDirect: string; kfYears: string;
    chainSteps: string; linkSources: string; directLink: string; editorialNote: string; endMark: string;
    directBadge: string; editorialBadge: string; seeReference: string; editorialExplain: string;
    indexTitle: string; backToMap: string; colName: string; colType: string; colCode: string;
    openBlueprint: string; blueprintInInstrument: string;
    bpKicker: string; bpExploded: string; bpAssembled: string; bpParts: string;
    bpGoNode: string; bpAuthor: string; bpHint: string; bpExample: string; bpDepth: string; bpPresence: string; bpTime: string;
    phStart: string; phField: string; phThreads: string; phBlueprints: string; phExplore: string;
    phFull: string; phFullHint: string; phBack: string; phAll: string; phNodesShown: string; phNoResults: string;
    saveRelation: string; savedRelation: string; guideRoute: string; clearGuide: string;
  };
}
