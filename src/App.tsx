import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { AlignLeft, ArrowDownAZ, ArrowRight, ArrowUpRight, BookOpen, Bookmark, Check, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, Compass, Download, FileJson, Folder, FolderPlus, Image, Languages, Layers3, Menu, Network, PanelRightOpen, Plus, Search, Settings2, Shapes, Shuffle, Sparkles, UsersRound, X } from 'lucide-react';
import Graph, { type GraphSettings } from './components/Graph';
import AskPanel from './components/AskPanel';
import DetailPanel from './components/DetailPanel';
import Modal from './components/Modal';
import NodeMark from './components/NodeMark';
import { askEnabled } from './ai/client';
import type { AskPlan } from './ai/contract';
import { edges, palette, shapeById, type AtlasNode, type EntityType, type School } from './data/atlas';
import { format, languageNames, languages, useI18n, type Language } from './i18n';

type Page = 'graph' | 'authors' | 'concepts' | 'reading' | 'collection';
type Collection = { id: string; name: string; nodeIds: string[] };
type ModalName = 'about' | 'export' | 'create' | 'save' | null;
type Dropdown = 'type' | 'school' | 'settings' | 'sort' | 'language' | null;
const STORAGE_KEY = 'foresight-atlas-collections-v1';
/** The built-in collection keeps this id so its name can follow the active language. */
const DEFAULT_COLLECTION_ID = 'discoveries';
const defaultCollections: Collection[] = [{ id: DEFAULT_COLLECTION_ID, name: '', nodeIds: [] }];

function readCollections(): Collection[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!Array.isArray(raw)) return defaultCollections;
    const valid = raw.filter((item): item is Collection => !!item && typeof item.id === 'string' && typeof item.name === 'string' && Array.isArray(item.nodeIds));
    return valid.length ? valid.map((item) => ({ ...item, nodeIds: [...new Set(item.nodeIds.filter((id) => typeof id === 'string' && shapeById.has(id)))] })) : defaultCollections;
  } catch { return defaultCollections; }
}

function BrandMark() {
  return <svg width="34" height="34" viewBox="0 0 40 40" fill="none" aria-hidden="true"><g stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><path d="M20 3v9m0 16v9M3 20h9m16 0h9M8 8l6.3 6.3m11.4 11.4L32 32M8 32l6.3-6.3m11.4-11.4L32 8" /></g><circle cx="20" cy="20" r="4" fill="currentColor" /><circle cx="20" cy="20" r="10" stroke="currentColor" strokeWidth="1.1" opacity=".35" /></svg>;
}

// Some embedded hosts block anchor-driven downloads and mediate saves through
// their own confirmation instead. Use that route when it is offered.
interface SandboxHost { use?: (name: string) => Promise<{ save: (file: { filename: string; data: string }) => Promise<unknown> } | null> }

async function downloadFile(content: string, name: string, type: string) {
  const host = (window as unknown as { claude?: SandboxHost }).claude;
  if (host?.use) {
    try {
      const downloads = await host.use('downloads');
      if (downloads) { await downloads.save({ filename: name, data: content }); return true; }
    } catch { return false; }
  }
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

export default function App() {
  const { lang, setLang, ui, schools, typeLabels, typePlurals, nodes, nodeById, getConnections, matchesSearch } = useI18n();
  const [page, setPage] = useState<Page>('graph');
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [selectedId, setSelectedId] = useState('inayatullah');
  const [detailsOpen, setDetailsOpen] = useState(() => window.innerWidth >= 900);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<EntityType | 'all'>('all');
  const [schoolFilter, setSchoolFilter] = useState<School | 'all'>('all');
  const [dropdown, setDropdown] = useState<Dropdown>(null);
  const [settings, setSettings] = useState<GraphSettings>({ labels: true, connections: true, highlight: true });
  const [sort, setSort] = useState<'alphabetical' | 'connections'>('alphabetical');
  const [expanded, setExpanded] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [modal, setModal] = useState<ModalName>(null);
  const [collections, setCollections] = useState<Collection[]>(readCollections);
  const [activeCollection, setActiveCollection] = useState(DEFAULT_COLLECTION_ID);
  const [saveTarget, setSaveTarget] = useState<AtlasNode | null>(null);
  const [pendingCollections, setPendingCollections] = useState<string[]>([]);
  const [collectionName, setCollectionName] = useState('');
  const [collectionError, setCollectionError] = useState('');
  const [exportFormat, setExportFormat] = useState<'svg' | 'json'>('svg');
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchIndex, setSearchIndex] = useState(0);
  const [askOpen, setAskOpen] = useState(false);
  const [emphasis, setEmphasis] = useState<string[]>([]);
  const [route, setRoute] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  /** The built-in collection is labelled in the active language; user-made ones keep their name. */
  const labelOf = (item: Collection) => (item.id === DEFAULT_COLLECTION_ID ? ui.defaultCollection : item.name);

  const savedIds = useMemo(() => new Set(collections.flatMap((item) => item.nodeIds)), [collections]);
  const selectedNode = nodeById.get(selectedId)!;
  const collection = collections.find((item) => item.id === activeCollection) || collections[0];
  const isGraph = page === 'graph' && viewMode === 'graph';
  const authorCount = nodes.filter((node) => node.type === 'author').length;
  const ideaCount = nodes.length - authorCount;

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(collections)); setStorageAvailable(true); }
    catch { setStorageAvailable(false); }
  }, [collections]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const outside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown-root]')) setDropdown(null);
      if (!target.closest('[data-search-root]')) setSearchOpen(false);
    };
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const editing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
      if (!modal && (((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') || event.key === '/' && !editing)) {
        event.preventDefault(); searchRef.current?.focus();
      }
      if (event.key === 'Escape') {
        if (modal) setModal(null);
        else if (dropdown) setDropdown(null);
        else if (searchOpen) setSearchOpen(false);
        else if (mobileNav) setMobileNav(false);
        else if (askOpen) setAskOpen(false);
        else if (detailsOpen && window.innerWidth <= 900) setDetailsOpen(false);
        else if (expanded) setExpanded(false);
        else if (focusId) setFocusId(null);
      }
    };
    document.addEventListener('keydown', keydown);
    return () => document.removeEventListener('keydown', keydown);
  }, [modal, dropdown, searchOpen, mobileNav, askOpen, detailsOpen, expanded, focusId]);

  const baseNodes = useMemo(() => {
    if (page === 'authors') return nodes.filter((node) => node.type === 'author');
    if (page === 'concepts') return nodes.filter((node) => node.type !== 'author');
    if (page === 'reading') return nodes.filter((node) => savedIds.has(node.id));
    if (page === 'collection') return nodes.filter((node) => collection.nodeIds.includes(node.id));
    return nodes;
  }, [nodes, page, savedIds, collection]);

  const visibleNodes = useMemo(() => {
    const focused = focusId ? new Set([focusId, ...getConnections(focusId).map((item) => item.node.id)]) : null;
    return baseNodes.filter((node) => (typeFilter === 'all' || node.type === typeFilter)
      && (schoolFilter === 'all' || node.school === schoolFilter)
      && matchesSearch(node, query)
      && (!focused || focused.has(node.id)));
  }, [baseNodes, typeFilter, schoolFilter, query, focusId, getConnections, matchesSearch]);

  const visibleEdges = useMemo(() => {
    const ids = new Set(visibleNodes.map((node) => node.id));
    return edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target));
  }, [visibleNodes]);

  const listNodes = useMemo(() => [...visibleNodes].sort((a, b) => sort === 'alphabetical' ? a.name.localeCompare(b.name, lang) : getConnections(b.id).length - getConnections(a.id).length || a.name.localeCompare(b.name, lang)), [visibleNodes, sort, lang, getConnections]);
  const searchResults = useMemo(() => nodes.filter((node) => matchesSearch(node, query)).slice(0, 6), [nodes, query, matchesSearch]);
  const suggestionsVisible = searchOpen && query.trim().length > 0 && isGraph;
  const hasFilters = query.length > 0 || typeFilter !== 'all' || schoolFilter !== 'all' || focusId !== null;
  const viewSummary = isGraph ? `${visibleEdges.length} ${ui.view.connections}` : sort === 'alphabetical' ? ui.view.azSort : ui.view.mostConnected;

  function notify(message: string) { setToast({ message, id: Date.now() }); }
  function resetFilters() { setQuery(''); setTypeFilter('all'); setSchoolFilter('all'); setFocusId(null); setDropdown(null); setSearchOpen(false); setEmphasis([]); setRoute([]); }
  function navigate(next: Page, collectionId?: string) {
    setPage(next); setViewMode(next === 'graph' ? 'graph' : 'list'); resetFilters(); setMobileNav(false); setExpanded(false);
    if (collectionId) setActiveCollection(collectionId);
    setDetailsOpen(next === 'graph' && window.innerWidth >= 900);
  }
  function selectNode(node: AtlasNode) { setSelectedId(node.id); setDetailsOpen(true); }
  function jumpToNode(node: AtlasNode) { resetFilters(); setPage('graph'); setViewMode('graph'); selectNode(node); }
  function focusNode(node: AtlasNode) {
    resetFilters(); setPage('graph'); setViewMode('graph'); setFocusId(node.id); selectNode(node);
    if (window.innerWidth <= 900) setDetailsOpen(false);
  }
  function surprise() {
    const options = nodes.filter((node) => node.id !== selectedId);
    const node = options[Math.floor(Math.random() * options.length)];
    jumpToNode(node); notify(format(ui.toasts.newThread, { name: node.name }));
  }
  function openSave(node: AtlasNode) {
    setSaveTarget(node);
    const containing = collections.filter((item) => item.nodeIds.includes(node.id)).map((item) => item.id);
    setPendingCollections(containing.length ? containing : [collections[0].id]);
    setModal('save');
  }
  function saveCollections() {
    if (!saveTarget) return;
    setCollections((current) => current.map((item) => ({ ...item, nodeIds: pendingCollections.includes(item.id) ? [...new Set([...item.nodeIds, saveTarget.id])] : item.nodeIds.filter((id) => id !== saveTarget.id) })));
    setModal(null);
    if (!pendingCollections.length) { notify(format(ui.toasts.removed, { name: saveTarget.name })); return; }
    const target = collections.find((item) => item.id === pendingCollections[0]);
    notify(pendingCollections.length === 1 && target
      ? format(ui.toasts.savedTo, { collection: labelOf(target) })
      : format(ui.toasts.savedToCollections, { name: saveTarget.name, count: pendingCollections.length }));
  }
  function quickSave(node: AtlasNode) {
    if (page === 'collection') {
      setCollections((current) => current.map((item) => item.id === collection.id ? { ...item, nodeIds: item.nodeIds.filter((id) => id !== node.id) } : item));
      notify(format(ui.toasts.removedFrom, { collection: labelOf(collection) }));
    } else if (savedIds.has(node.id)) {
      setCollections((current) => current.map((item) => ({ ...item, nodeIds: item.nodeIds.filter((id) => id !== node.id) })));
      notify(format(ui.toasts.removed, { name: node.name }));
    } else {
      setCollections((current) => current.map((item, index) => index === 0 ? { ...item, nodeIds: [...item.nodeIds, node.id] } : item));
      notify(format(ui.toasts.savedTo, { collection: labelOf(collections[0]) }));
    }
  }
  function openCreate() { setCollectionName(''); setCollectionError(''); setModal('create'); }
  function createCollection(event: FormEvent) {
    event.preventDefault();
    const name = collectionName.trim();
    if (!name) { setCollectionError(ui.create.errorEmpty); return; }
    if (collections.some((item) => labelOf(item).toLowerCase() === name.toLowerCase())) { setCollectionError(ui.create.errorDuplicate); return; }
    const id = `collection-${Date.now().toString(36)}`;
    setCollections((current) => [...current, { id, name, nodeIds: [] }]);
    setModal(null); navigate('collection', id); notify(format(ui.toasts.collectionReady, { name }));
  }
  function openGuide() { setAskOpen(true); if (window.innerWidth <= 900) setDetailsOpen(false); }
  function closeGuide() { setAskOpen(false); setEmphasis([]); setRoute([]); }
  /** Selecting from the guide moves the graph without swapping the panel away. */
  function selectFromGuide(node: AtlasNode) { setPage('graph'); setViewMode('graph'); setSelectedId(node.id); }
  function applyPlan(plan: AskPlan) {
    setPage('graph'); setViewMode('graph'); setQuery(''); setSearchOpen(false); setFocusId(null);
    setTypeFilter(plan.filters.type); setSchoolFilter(plan.filters.school);
    setEmphasis(plan.highlight); setRoute(plan.path);
    if (plan.highlight[0]) setSelectedId(plan.highlight[0]);
  }
  function showRoute(ids: string[]) { setPage('graph'); setViewMode('graph'); setTypeFilter('all'); setSchoolFilter('all'); setFocusId(null); setRoute(ids); setEmphasis(ids); }
  function saveGuideCollection(name: string, ids: string[]) {
    const id = `collection-${Date.now().toString(36)}`;
    const unique = collections.some((item) => labelOf(item).toLowerCase() === name.toLowerCase()) ? `${name} ${collections.length}` : name;
    setCollections((current) => [...current, { id, name: unique, nodeIds: ids }]);
    notify(format(ui.ask.collectionSaved, { name: unique, count: ids.length }));
  }
  async function exportGraph() {
    let delivered = false;
    if (exportFormat === 'svg' && svgRef.current) {
      const clone = svgRef.current.cloneNode(true) as SVGSVGElement;
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.setAttribute('width', '1440'); clone.setAttribute('height', '1035');
      clone.querySelectorAll('[tabindex]').forEach((element) => element.removeAttribute('tabindex'));
      delivered = await downloadFile(new XMLSerializer().serializeToString(clone), 'foresight-atlas.svg', 'image/svg+xml');
    } else {
      const data = {
        title: ui.exportModal.atlasTitle, language: lang, exportedAt: new Date().toISOString(),
        note: ui.exportModal.exportNote,
        nodes: visibleNodes,
        links: visibleEdges.map((edge) => ({
          ...edge,
          evidence: edge.reference ? 'direct-reference' : nodeById.get(edge.source)?.type === 'author' ? 'author-background' : 'editorial-association',
          reference: edge.reference || (nodeById.get(edge.source)?.type === 'author' ? nodeById.get(edge.source)?.source : null),
        })),
      };
      delivered = await downloadFile(JSON.stringify(data, null, 2), `foresight-atlas-${lang}.json`, 'application/json');
    }
    setModal(null);
    if (delivered) notify(ui.toasts.exportReady);
  }

  const pageCopy = page === 'collection'
    ? { heading: labelOf(collection), description: ui.collection.description, breadcrumb: labelOf(collection), directoryTitle: ui.collection.directoryTitle }
    : ui.pages[page];

  return <MotionConfig reducedMotion="user">
    <div className="app-shell">
      {mobileNav && <button className="sidebar-scrim" aria-label={ui.nav.closeNavigation} onClick={() => setMobileNav(false)} />}
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <button className="brand" onClick={() => navigate('graph')} aria-label={ui.brand.home}><BrandMark /><span className="brand-type">foresight<span>ATLAS</span></span></button>
        <div className="sidebar-body">
          <span className="nav-section-label">{ui.nav.explore}</span>
          <nav className="primary-nav" aria-label={ui.nav.explore}>
            <button className={page === 'graph' ? 'nav-item active' : 'nav-item'} onClick={() => navigate('graph')} title={ui.nav.graph}><Network size={18} /><span>{ui.nav.graph}</span>{page === 'graph' && <span className="active-nav-dot" />}</button>
            <button className={page === 'authors' ? 'nav-item active' : 'nav-item'} onClick={() => navigate('authors')} title={ui.nav.authors}><UsersRound size={18} /><span>{ui.nav.authors}</span><small>{authorCount}</small></button>
            <button className={page === 'concepts' ? 'nav-item active' : 'nav-item'} onClick={() => navigate('concepts')} title={ui.nav.concepts}><Shapes size={18} /><span>{ui.nav.concepts}</span><small>{ideaCount}</small></button>
            <button className={page === 'reading' ? 'nav-item active' : 'nav-item'} onClick={() => navigate('reading')} title={ui.nav.reading}><BookOpen size={18} /><span>{ui.nav.reading}</span>{savedIds.size > 0 && <small>{savedIds.size}</small>}</button>
          </nav>
          <div className="collections-label"><span className="nav-section-label">{ui.nav.yourCollections}</span><button className="icon-button" title={ui.nav.createCollection} aria-label={ui.nav.createCollection} onClick={openCreate}><Plus size={15} /></button></div>
          <nav className="collection-nav" aria-label={ui.nav.yourCollections}>{collections.map((item) => <button key={item.id} title={labelOf(item)} className={`nav-item collection-item ${page === 'collection' && activeCollection === item.id ? 'active' : ''}`} onClick={() => navigate('collection', item.id)}><Folder size={17} /><span>{labelOf(item)}</span><small>{item.nodeIds.length}</small></button>)}</nav>
          <button className="new-collection-rail icon-button" aria-label={ui.nav.createCollection} onClick={openCreate}><FolderPlus size={19} /></button>
        </div>
        <div className="sidebar-footer">
          <button className="getting-started" onClick={() => setModal('about')} title={ui.nav.guidance}><Compass size={18} /><span>{ui.nav.guidance}</span><ArrowUpRight size={14} /></button>
          <div className="workspace-identity"><span className="workspace-avatar"><Layers3 size={19} /></span><span><strong>{ui.nav.yourWorkspace}</strong><small><i className={storageAvailable ? '' : 'warning-dot'} />{storageAvailable ? ui.nav.storedOnDevice : ui.nav.storedForSession}</small></span></div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" aria-label={ui.nav.openNavigation} onClick={() => setMobileNav(true)}><Menu size={20} /></button><Layers3 size={15} className="breadcrumb-icon" /><span>{ui.nav.workspace}</span><ChevronRight size={13} /><strong>{pageCopy.breadcrumb}</strong></div><div className="topbar-actions"><span className="living-atlas"><i />{ui.topbar.livingAtlas}</span>
          {askEnabled && <button className={`button button-secondary ask-open-button ${askOpen ? 'active' : ''}`} aria-pressed={askOpen} aria-label={ui.ask.open} title={ui.ask.open} onClick={() => askOpen ? closeGuide() : openGuide()}><Sparkles size={14} /><span>{ui.ask.open}</span></button>}
          <div className="dropdown-root" data-dropdown-root><button className={`icon-button help-button ${dropdown === 'language' ? 'active' : ''}`} aria-label={ui.topbar.language} title={ui.topbar.language} aria-expanded={dropdown === 'language'} aria-haspopup="menu" onClick={() => setDropdown(dropdown === 'language' ? null : 'language')}><Languages size={18} /></button><AnimatePresence>{dropdown === 'language' && <motion.div className="popover language-popover" role="menu" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><span className="popover-label">{ui.topbar.language.toUpperCase()}</span>{languages.map((code) => <button key={code} className="popover-option" role="menuitemradio" aria-checked={lang === code} lang={code} onClick={() => { setLang(code as Language); setDropdown(null); }}>{languageNames[code]}{lang === code && <Check size={14} />}</button>)}</motion.div>}</AnimatePresence></div>
          <button className="icon-button help-button" aria-label={ui.topbar.about} title={ui.topbar.about} onClick={() => setModal('about')}><CircleHelp size={18} /></button><span className="topbar-divider" /><button className="button button-secondary export-button" onClick={() => { setExportFormat(isGraph ? 'svg' : 'json'); setModal('export'); }}><Download size={14} />{ui.topbar.export}<span className="export-long">{ui.topbar.exportLong}</span></button></div></header>

        <main className="main-content">
          <motion.section className="page-heading" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}><div><h1>{pageCopy.heading}</h1><p>{pageCopy.description}</p></div><button className="button surprise-button" onClick={surprise}><Shuffle size={15} />{ui.actions.surprise}<ArrowUpRight size={14} /></button></motion.section>

          <div className="view-bar">
            {page === 'graph' ? <div className="view-tabs" role="group" aria-label={ui.view.graphView}><button className={viewMode === 'graph' ? 'view-tab active' : 'view-tab'} aria-pressed={viewMode === 'graph'} onClick={() => setViewMode('graph')}><Network size={16} />{ui.view.graphView}</button><button className={viewMode === 'list' ? 'view-tab active' : 'view-tab'} aria-pressed={viewMode === 'list'} onClick={() => setViewMode('list')}><AlignLeft size={16} />{ui.view.listView}</button></div> : <div className="directory-title">{pageCopy.directoryTitle}<span>{baseNodes.length}</span></div>}
            <div className="graph-summary">{hasFilters && <button onClick={resetFilters}>{ui.actions.clearFilters}<X size={11} /></button>}<span>{visibleNodes.length} {isGraph ? ui.view.nodes : ui.view.entries}</span><i /><span>{viewSummary}</span></div>
          </div>

          {expanded && <div className="expanded-backdrop" />}
          <motion.div className={`workspace-shell ${expanded ? 'workspace-expanded' : ''} ${detailsOpen || askOpen ? 'with-details' : ''}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <div className="workspace-left">
              <div className="workspace-toolbar">
                <div className="search-area" data-search-root>
                  <div className={`search-field ${query ? 'has-value' : ''}`}><Search size={16} /><input ref={searchRef} value={query} type="text" role="combobox" aria-autocomplete="list" aria-label={ui.search.label} placeholder={ui.search.placeholder} autoComplete="off" aria-expanded={suggestionsVisible} aria-controls={suggestionsVisible ? 'search-results' : undefined} aria-activedescendant={suggestionsVisible && searchResults.length ? `search-option-${searchResults[searchIndex]?.id}` : undefined}
                    onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); setSearchIndex(0); setFocusId(null); }} onFocus={() => setSearchOpen(true)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') { event.stopPropagation(); setSearchOpen(false); setQuery(''); }
                      if (!suggestionsVisible) return;
                      if (event.key === 'ArrowDown') { event.preventDefault(); setSearchIndex((current) => Math.max(0, Math.min(current + 1, searchResults.length - 1))); }
                      if (event.key === 'ArrowUp') { event.preventDefault(); setSearchIndex((current) => Math.max(0, current - 1)); }
                      if (event.key === 'Enter' && searchResults[searchIndex]) { event.preventDefault(); jumpToNode(searchResults[searchIndex]); searchRef.current?.blur(); }
                    }} />{query ? <button className="search-clear" aria-label={ui.search.clear} onClick={() => { setQuery(''); setSearchOpen(false); searchRef.current?.focus(); }}><X size={13} /></button> : <kbd>/</kbd>}</div>
                  <AnimatePresence>{suggestionsVisible && <motion.div className="search-results" id="search-results" role="listbox" aria-label={ui.search.resultsLabel} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}><div className="search-results-label">{ui.search.followThread}</div>{searchResults.length ? searchResults.map((node, index) => <button key={node.id} id={`search-option-${node.id}`} role="option" aria-selected={index === searchIndex} className={index === searchIndex ? 'search-result highlighted' : 'search-result'} onMouseEnter={() => setSearchIndex(index)} onClick={() => jumpToNode(node)}><NodeMark node={node} size={31} /><span><strong>{node.name}</strong><small>{typeLabels[node.type]} / {schools[node.school]}</small></span><ArrowUpRight size={14} /></button>) : <p className="no-search-results">{ui.search.noResults}</p>}<div className="search-results-footer">{ui.search.footer}</div></motion.div>}</AnimatePresence>
                </div>

                <div className="toolbar-filters">
                  {page !== 'authors' && <div className="dropdown-root" data-dropdown-root><button className={`filter-button ${typeFilter !== 'all' ? 'filter-active' : ''}`} aria-expanded={dropdown === 'type'} aria-haspopup="menu" onClick={() => setDropdown(dropdown === 'type' ? null : 'type')}>{typeFilter === 'all' ? ui.filters.allTypes : typePlurals[typeFilter]}<ChevronDown size={13} /></button><AnimatePresence>{dropdown === 'type' && <motion.div className="popover type-popover" role="menu" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><span className="popover-label">{ui.filters.showInAtlas}</span>{(['all', 'author', 'concept', 'method'] as const).filter((type) => page !== 'concepts' || type !== 'author').map((type) => <button key={type} role="menuitemradio" aria-checked={typeFilter === type} className="popover-option" onClick={() => { setTypeFilter(type); setFocusId(null); setDropdown(null); }}><span className="option-label">{type === 'all' ? <Shapes size={14} /> : <i style={{ background: palette[type].fill, borderColor: palette[type].stroke }} />}{type === 'all' ? ui.filters.allTypes : typePlurals[type]}</span>{typeFilter === type ? <Check size={14} /> : <small>{baseNodes.filter((node) => type === 'all' || node.type === type).length}</small>}</button>)}</motion.div>}</AnimatePresence></div>}
                  <div className="dropdown-root school-filter" data-dropdown-root><button className={`filter-button ${schoolFilter !== 'all' ? 'filter-active' : ''}`} aria-expanded={dropdown === 'school'} aria-haspopup="menu" onClick={() => setDropdown(dropdown === 'school' ? null : 'school')}><span>{schoolFilter === 'all' ? ui.filters.allSchools : schools[schoolFilter]}</span><ChevronDown size={13} /></button><AnimatePresence>{dropdown === 'school' && <motion.div className="popover school-popover" role="menu" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><span className="popover-label">{ui.filters.schoolOfThought}</span><button className="popover-option" role="menuitemradio" aria-checked={schoolFilter === 'all'} onClick={() => { setSchoolFilter('all'); setFocusId(null); setDropdown(null); }}>{ui.filters.allSchools}{schoolFilter === 'all' && <Check size={14} />}</button>{Object.entries(schools).map(([id, label]) => <button key={id} className="popover-option" role="menuitemradio" aria-checked={schoolFilter === id} onClick={() => { setSchoolFilter(id as School); setFocusId(null); setDropdown(null); }}>{label}{schoolFilter === id && <Check size={14} />}</button>)}</motion.div>}</AnimatePresence></div>
                  <div className="toolbar-separator" />
                  {isGraph ? <div className="dropdown-root" data-dropdown-root><button className={`icon-button settings-button ${dropdown === 'settings' ? 'active' : ''}`} aria-label={ui.filters.displaySettings} title={ui.filters.displaySettings} aria-expanded={dropdown === 'settings'} onClick={() => setDropdown(dropdown === 'settings' ? null : 'settings')}><Settings2 size={17} /></button><AnimatePresence>{dropdown === 'settings' && <motion.div className="popover settings-popover" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><span className="popover-label">{ui.filters.makeItYours}</span>{([{ key: 'labels', label: ui.filters.showLabels }, { key: 'connections', label: ui.filters.showConnections }, { key: 'highlight', label: ui.filters.highlightRelated }] as const).map((item) => <button className="setting-row" key={item.key} role="switch" aria-checked={settings[item.key]} onClick={() => setSettings((current) => ({ ...current, [item.key]: !current[item.key] }))}><span>{item.label}</span><span className={`switch ${settings[item.key] ? 'on' : ''}`}><i /></span></button>)}<p>{ui.filters.dragTip}</p></motion.div>}</AnimatePresence></div> : <div className="dropdown-root" data-dropdown-root><button className="icon-button settings-button" title={ui.filters.sortEntries} aria-label={ui.filters.sortEntries} aria-expanded={dropdown === 'sort'} onClick={() => setDropdown(dropdown === 'sort' ? null : 'sort')}><ArrowDownAZ size={17} /></button>{dropdown === 'sort' && <div className="popover sort-popover" role="menu"><span className="popover-label">{ui.filters.sortYourView}</span>{(['alphabetical', 'connections'] as const).map((value) => <button key={value} className="popover-option" role="menuitemradio" aria-checked={sort === value} onClick={() => { setSort(value); setDropdown(null); }}>{value === 'alphabetical' ? ui.view.azSort : ui.view.mostConnected}{sort === value && <Check size={14} />}</button>)}</div>}</div>}
                  {!detailsOpen && !askOpen && <button className="icon-button reopen-details" aria-label={ui.filters.openDetails} title={ui.filters.openDetails} onClick={() => setDetailsOpen(true)}><PanelRightOpen size={16} /></button>}
                </div>
              </div>

              {isGraph ? <Graph nodes={visibleNodes} edges={visibleEdges} selectedId={selectedId} onSelect={selectNode} focusId={focusId} onClearFocus={() => setFocusId(null)} settings={settings} svgRef={svgRef} onReset={resetFilters} expanded={expanded} onExpand={() => setExpanded(!expanded)} emphasisIds={emphasis} pathIds={route} /> : <div className="directory-scroll">
                {listNodes.length > 0 ? <div className="directory-list"><div className="directory-columns"><span>{page === 'authors' ? ui.directory.columnAuthor : ui.directory.columnName}</span><span className="directory-school">{ui.directory.columnSchool}</span><span>{ui.directory.columnLinks}</span><span /></div>{listNodes.map((node) => <div key={node.id} className={`directory-row ${node.id === selectedId && detailsOpen ? 'selected' : ''}`}><button className="directory-entity" onClick={() => selectNode(node)}><NodeMark node={node} size={38} /><span><strong>{node.name}</strong><small>{node.type === 'author' ? node.subtitle : typeLabels[node.type]}</small></span><ArrowUpRight size={14} className="directory-row-arrow" /></button><span className="directory-school">{schools[node.school]}</span><button className="connection-count" title={format(ui.directory.exploreConnections, { count: getConnections(node.id).length, name: node.name })} onClick={() => focusNode(node)}><Network size={13} />{getConnections(node.id).length}</button><button className={`icon-button row-bookmark ${savedIds.has(node.id) ? 'bookmarked' : ''}`} aria-label={savedIds.has(node.id) ? (page === 'collection' ? format(ui.directory.removeFrom, { name: node.name, collection: labelOf(collection) }) : format(ui.directory.removeFromCollections, { name: node.name })) : format(ui.directory.save, { name: node.name })} onClick={() => quickSave(node)}><Bookmark size={16} fill={savedIds.has(node.id) ? 'currentColor' : 'none'} /></button></div>)}</div> : <div className="directory-empty">{page === 'reading' || page === 'collection' ? <Bookmark size={36} strokeWidth={1.2} /> : <Search size={36} strokeWidth={1.2} />}<h2>{hasFilters ? ui.directory.emptyFilteredTitle : ui.directory.emptyTitle}</h2><p>{hasFilters ? ui.directory.emptyFilteredBody : ui.directory.emptyBody}</p><button className="button button-primary" onClick={hasFilters ? resetFilters : () => navigate('graph')}>{hasFilters ? ui.actions.clearFilters : ui.actions.exploreGraph}<ArrowRight size={15} /></button></div>}
              </div>}
              <div className="canvas-status"><span><i />{focusId ? ui.status.focused : isGraph ? ui.status.graph : format(listNodes.length === 1 ? ui.status.discovery : ui.status.discoveries, { count: listNodes.length })}</span><button onClick={() => setModal('about')}>{isGraph ? ui.status.howToExplore : ui.status.aboutConnections}<CircleHelp size={12} /></button></div>
            </div>
            {askOpen
              ? <><button className="detail-mobile-scrim" aria-label={ui.ask.close} onClick={closeGuide} /><AskPanel selectedId={selectedId} onClose={closeGuide} onSelect={selectFromGuide} onPlan={applyPlan} onShowPath={showRoute} onSaveCollection={saveGuideCollection} /></>
              : detailsOpen && <><button className="detail-mobile-scrim" aria-label={ui.detail.close} onClick={() => setDetailsOpen(false)} /><DetailPanel node={selectedNode} onSelect={selectNode} onClose={() => setDetailsOpen(false)} onFocus={focusNode} onSave={openSave} saved={savedIds.has(selectedId)} /></>}
          </motion.div>
          <div className="page-footnote"><span>{ui.status.footnote}</span><button onClick={() => setModal('about')}>{ui.status.curated}<ArrowUpRight size={12} /></button></div>
        </main>
      </div>
    </div>

    <AnimatePresence>
      {modal === 'about' && <Modal key="about" title={ui.about.title} description={ui.about.description} onClose={() => setModal(null)} wide><div className="about-intro"><span className="about-brand-mark"><BrandMark /></span><p>{ui.about.welcome}</p></div><div className="guide-steps">{ui.about.steps.map((step, index) => <div key={step.title}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{step.title}</h3><p>{step.body}</p></div></div>)}</div><div className="editorial-note"><h3>{ui.about.noteTitle}</h3><p>{ui.about.noteBody}</p><p>{ui.about.noteSources}</p></div><div className="about-sources"><h3>{ui.about.sourcesTitle}</h3><a href="https://www.metafuture.org/causal-layered-analysis-2/" target="_blank" rel="noreferrer">Inayatullah / Causal Layered Analysis<ArrowUpRight size={13} /></a><a href="https://jfsdigital.org/wp-content/uploads/2014/01/142-A01.pdf" target="_blank" rel="noreferrer">Dator / Alternative Futures at the Manoa School<ArrowUpRight size={13} /></a><a href="https://www.unesco.org/en/futures-literacy/resources" target="_blank" rel="noreferrer">UNESCO / Futures Literacy<ArrowUpRight size={13} /></a><a href="https://www.iffpraxis.com/3h-approach" target="_blank" rel="noreferrer">International Futures Forum / Three Horizons<ArrowUpRight size={13} /></a></div><div className="modal-footer"><span className="keyboard-tip">{ui.about.keyboardTip.split('{key}').flatMap((part, index) => index === 0 ? [part] : [<kbd key="key">/</kbd>, part])}</span><button className="button button-primary" onClick={() => setModal(null)}>{ui.about.cta}<ArrowRight size={15} /></button></div></Modal>}
      {modal === 'create' && <Modal key="create" title={ui.create.title} description={ui.create.description} onClose={() => setModal(null)}><form onSubmit={createCollection}><label className="form-label" htmlFor="collection-name">{ui.create.nameLabel}</label><input className="form-input" id="collection-name" placeholder={ui.create.placeholder} maxLength={48} value={collectionName} onChange={(event) => { setCollectionName(event.target.value); setCollectionError(''); }} aria-invalid={!!collectionError} aria-describedby={collectionError ? 'collection-error' : undefined} />{collectionError && <p className="form-error" id="collection-error">{collectionError}</p>}<p className="form-hint">{ui.create.hint}</p><div className="modal-footer"><button type="button" className="button button-secondary" onClick={() => setModal(null)}>{ui.actions.cancel}</button><button className="button button-primary" type="submit"><FolderPlus size={16} />{ui.create.submit}</button></div></form></Modal>}
      {modal === 'save' && saveTarget && <Modal key="save" title={ui.save.title} description={ui.save.description} onClose={() => setModal(null)}><div className="save-preview"><NodeMark node={saveTarget} size={44} /><span><strong>{saveTarget.name}</strong><small>{typeLabels[saveTarget.type]} / {schools[saveTarget.school]}</small></span></div><span className="form-label">{ui.save.saveTo}</span><div className="collection-choices">{collections.map((item) => <label className={`collection-choice ${pendingCollections.includes(item.id) ? 'chosen' : ''}`} key={item.id}><Folder size={19} /><span><strong>{labelOf(item)}</strong><small>{format(item.nodeIds.length === 1 ? ui.status.discovery : ui.status.discoveries, { count: item.nodeIds.length })}</small></span><input type="checkbox" checked={pendingCollections.includes(item.id)} onChange={(event) => setPendingCollections((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} /></label>)}</div><p className="form-hint">{ui.save.hint}</p><div className="modal-footer"><button className="button button-secondary" onClick={() => setModal(null)}>{ui.actions.cancel}</button><button className="button button-primary" onClick={saveCollections} disabled={!pendingCollections.length && !savedIds.has(saveTarget.id)}><Check size={16} />{pendingCollections.length ? ui.save.submit : ui.save.remove}</button></div></Modal>}
      {modal === 'export' && <Modal key="export" title={ui.exportModal.title} description={ui.exportModal.description} onClose={() => setModal(null)}>
        <div className="export-summary"><Network size={19} /><span><strong>{visibleNodes.length} {ui.view.nodes}, {visibleEdges.length} {ui.view.connections}</strong><small>{hasFilters || page !== 'graph' ? ui.exportModal.summaryFiltered : ui.exportModal.summaryComplete}</small></span></div>
        <fieldset className="export-formats">
          <legend>{ui.exportModal.chooseFormat}</legend>
          <label className={`format-option ${exportFormat === 'svg' ? 'chosen' : ''} ${!isGraph ? 'disabled' : ''}`}>
            <Image size={23} /><span><strong>{ui.exportModal.svgTitle} <small>.svg</small></strong><p>{ui.exportModal.svgBody}</p></span>
            <input type="radio" name="export-format" value="svg" checked={exportFormat === 'svg'} disabled={!isGraph} onChange={() => setExportFormat('svg')} />
          </label>
          <label className={`format-option ${exportFormat === 'json' ? 'chosen' : ''}`}>
            <FileJson size={23} /><span><strong>{ui.exportModal.jsonTitle} <small>.json</small></strong><p>{ui.exportModal.jsonBody}</p></span>
            <input type="radio" name="export-format" value="json" checked={exportFormat === 'json'} onChange={() => setExportFormat('json')} />
          </label>
        </fieldset>
        {!isGraph && <p className="form-hint">{ui.exportModal.graphViewHint}</p>}
        <div className="modal-footer"><button className="button button-secondary" onClick={() => setModal(null)}>{ui.actions.cancel}</button><button className="button button-primary" onClick={exportGraph}><Download size={16} />{ui.exportModal.submit}</button></div>
      </Modal>}
    </AnimatePresence>
    <AnimatePresence>{toast && <motion.div key={toast.id} className="toast" role="status" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}><CheckCircle2 size={18} /><span>{toast.message}</span><button className="icon-button" onClick={() => setToast(null)} aria-label={ui.toasts.dismiss}><X size={14} /></button></motion.div>}</AnimatePresence>
  </MotionConfig>;
}
