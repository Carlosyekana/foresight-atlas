import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { edges, nodeShapes, palette, type AtlasEdge, type AtlasNode, type EntityType, type School } from '../data/atlas';
import { format, useI18n, type AtlasThread } from '../i18n';
import Blueprint from './Blueprint';
import Phone from './Phone';
import './instrumento.css';

/**
 * «Modo instrumento» — la lectura oscura del Atlas, tras #/instrumento.
 * Traslada los patrones narrativos de BL00D.MONEY
 * (docs/ingenieria-inversa/01-*.md, ADR 0002) sobre los datos reales:
 * mundo full-bleed, modos-pregunta, zoom semántico, dossier-campo,
 * relaciones inspeccionables con su frase de contexto, e Hilos
 * (expedientes de lectura) con informe en papel.
 * Pendiente: localizar el chrome de esta vista (hoy en español; el
 * contenido del atlas —nodos, hilos y contextos— ya va por i18n).
 */

type Mode = 'red' | 'orbita' | 'escuelas' | 'cronologia';
type Panel = 'campo' | 'nodo' | 'hilo';
type LabelMode = 'off' | 'key' | 'all';
type Point = { x: number; y: number };

const W = 960;
const H = 690;
const SCHOOL_ORDER: School[] = ['foundations', 'strategic', 'critical', 'systems', 'literacy', 'experiential'];
const SCHOOL_CENTERS: Record<School, Point> = {
  foundations: { x: 200, y: 180 }, strategic: { x: 480, y: 180 }, critical: { x: 760, y: 180 },
  systems: { x: 200, y: 505 }, literacy: { x: 480, y: 505 }, experiential: { x: 760, y: 505 },
};
const MODES: Mode[] = ['red', 'orbita', 'escuelas', 'cronologia'];
const CODE_PREFIX: Record<EntityType, string> = { author: 'AUT', concept: 'CON', method: 'MET' };

function codeOf(node: AtlasNode) {
  const index = nodeShapes.findIndex((shape) => shape.id === node.id) + 1;
  return `${CODE_PREFIX[node.type]}-${String(index).padStart(3, '0')}`;
}

function bfsDistances(center: string) {
  const dist = new Map<string, number>([[center, 0]]);
  const queue = [center];
  while (queue.length) {
    const current = queue.shift()!;
    edges.forEach((edge) => {
      const next = edge.source === current ? edge.target : edge.target === current ? edge.source : null;
      if (next && !dist.has(next)) { dist.set(next, dist.get(current)! + 1); queue.push(next); }
    });
  }
  return dist;
}

export default function Instrumento() {
  const { lang, ui, nodes, nodeById, getConnections, schools, typeLabels, typePlurals, matchesSearch, edgeContext, threads, blueprints } = useI18n();
  const t = ui.inst;
  const MODE_LABEL: Record<Mode, string> = { red: t.modeNetwork, orbita: t.modeOrbit, escuelas: t.modeSchools, cronologia: t.modeTimeline };
  const [intro, setIntro] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [mode, setMode] = useState<Mode>('red');
  const [labels, setLabels] = useState<LabelMode>('key');
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const requested = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('node');
    return requested && nodeShapes.some((shape) => shape.id === requested) ? requested : null;
  });
  const [panel, setPanel] = useState<Panel>(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
    return params.get('thread') ? 'hilo' : params.get('node') ? 'nodo' : 'campo';
  });
  const [history, setHistory] = useState<string[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [view, setView] = useState({ k: 0.92, x: 0, y: 0 });
  const [hiddenTypes, setHiddenTypes] = useState<Set<EntityType>>(new Set());
  const [schoolFilter, setSchoolFilter] = useState<School | 'all'>('all');
  const [threadId, setThreadId] = useState<string | null>(() => new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('thread'));
  const [isPhone, setIsPhone] = useState(() => window.matchMedia('(max-width: 760px)').matches);
  const [forceFull, setForceFull] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blueprintOpen, setBlueprintOpen] = useState(() => new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('blueprint') === '1');
  const [indexOpen, setIndexOpen] = useState(false);
  const [indexSort, setIndexSort] = useState<'name' | 'year' | 'degree'>('degree');
  const [photoTucked, setPhotoTucked] = useState(false);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [insp, setInsp] = useState<{ edge: AtlasEdge; x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; view: typeof view; moved: boolean } | null>(null);

  const selected = selectedId ? nodeById.get(selectedId) : undefined;
  const activeThread: AtlasThread | undefined = threads.find((thread) => thread.id === threadId);
  const degree = useMemo(() => {
    const map = new Map<string, number>();
    edges.forEach((edge) => { map.set(edge.source, (map.get(edge.source) ?? 0) + 1); map.set(edge.target, (map.get(edge.target) ?? 0) + 1); });
    return map;
  }, []);
  const relationBetween = (a: string, b: string) => getConnections(a).find((item) => item.node.id === b)?.relation ?? '';
  const edgeBetween = (a: string, b: string) => edges.find((edge) => (edge.source === a && edge.target === b) || (edge.source === b && edge.target === a));

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (blueprintOpen) setBlueprintOpen(false);
      else if (reportOpen) setReportOpen(false);
      else if (indexOpen) setIndexOpen(false);
      else if (insp) setInsp(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [blueprintOpen, reportOpen, indexOpen, insp]);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 760px)');
    const onChange = (event: MediaQueryListEvent) => setIsPhone(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  /* ---------- intro cinemática ---------- */
  useEffect(() => {
    if (!intro) return;
    const timer = window.setTimeout(() => setIntro(false), 3000);
    return () => window.clearTimeout(timer);
  }, [intro]);

  /* ---------- modos = aparatos de lectura ---------- */
  const targets = useMemo(() => {
    const map = new Map<string, Point>();
    if (mode === 'orbita') {
      const centerId = selectedId ?? 'inayatullah';
      const dist = bfsDistances(centerId);
      const rings = new Map<number, AtlasNode[]>();
      nodes.forEach((node) => {
        const d = Math.min(dist.get(node.id) ?? 4, 4);
        rings.set(d, [...(rings.get(d) ?? []), node]);
      });
      const radii = [0, 185, 305, 395, 450];
      rings.forEach((ring, d) => ring.forEach((node, i) => {
        if (d === 0) { map.set(node.id, { x: W / 2, y: H / 2 }); return; }
        const angle = (i / ring.length) * Math.PI * 2 - Math.PI / 2;
        map.set(node.id, { x: W / 2 + Math.cos(angle) * radii[d], y: H / 2 + Math.sin(angle) * radii[d] * 0.74 });
      }));
      return map;
    }
    if (mode === 'escuelas') {
      SCHOOL_ORDER.forEach((school) => {
        const members = nodes.filter((node) => node.school === school);
        const center = SCHOOL_CENTERS[school];
        const radius = 46 + members.length * 6;
        members.forEach((node, i) => {
          const angle = (i / members.length) * Math.PI * 2 - Math.PI / 2;
          map.set(node.id, { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius * 0.82 });
        });
      });
      return map;
    }
    if (mode === 'cronologia') {
      const lanes: Record<EntityType, number> = { author: 165, concept: 345, method: 525 };
      const stacks = new Map<string, number>();
      const counts = new Map<string, number>();
      nodes.forEach((node) => counts.set(`${node.publicationYear}-${node.type}`, (counts.get(`${node.publicationYear}-${node.type}`) ?? 0) + 1));
      nodes.forEach((node) => {
        const key = `${node.publicationYear}-${node.type}`;
        const i = stacks.get(key) ?? 0; stacks.set(key, i + 1);
        const year = parseInt(node.publicationYear, 10);
        const x = 80 + ((year - 1962) / (2024 - 1962)) * 810;
        const y = lanes[node.type] + (i - ((counts.get(key)! - 1) / 2)) * 44;
        map.set(node.id, { x, y });
      });
      return map;
    }
    nodes.forEach((node) => map.set(node.id, { x: node.x, y: node.y * 0.88 + 16 }));
    return map;
  }, [mode, nodes, selectedId]);

  /* posiciones animadas entre modos (0.88s, ease-in-out) */
  const [positions, setPositions] = useState<Map<string, Point>>(() => targets);
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  useEffect(() => {
    const from = new Map(positionsRef.current);
    const start = performance.now();
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 880;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const next = new Map<string, Point>();
      targets.forEach((target, id) => {
        const origin = from.get(id) ?? target;
        next.set(id, { x: origin.x + (target.x - origin.x) * e, y: origin.y + (target.y - origin.y) * e });
      });
      setPositions(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [targets]);

  /* ---------- zoom/paneo ---------- */
  function svgPoint(clientX: number, clientY: number) {
    const rect = svgRef.current!.getBoundingClientRect();
    const scale = Math.min(rect.width / W, rect.height / H);
    return {
      x: (clientX - rect.left - (rect.width - W * scale) / 2) / scale,
      y: (clientY - rect.top - (rect.height - H * scale) / 2) / scale,
    };
  }
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const point = svgPoint(event.clientX, event.clientY);
      setView((current) => {
        const k = Math.min(2.8, Math.max(0.45, current.k * Math.exp(-event.deltaY * 0.0014)));
        const ratio = k / current.k;
        return { k, x: point.x - W / 2 - (point.x - W / 2 - current.x) * ratio, y: point.y - H / 2 - (point.y - H / 2 - current.y) * ratio };
      });
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, []);
  const zoomBy = (amount: number) => setView((current) => ({ ...current, k: Math.min(2.8, Math.max(0.45, current.k + amount)) }));

  /* ---------- navegación con historial ---------- */
  function go(id: string) {
    if (id !== selectedId) {
      if (selectedId) setHistory((stack) => [...stack.slice(-11), selectedId]);
      setSelectedId(id);
    }
    setPanel('nodo'); setInsp(null); setPhotoTucked(false);
  }
  function back() {
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory((stack) => stack.slice(0, -1));
    setSelectedId(previous); setPanel('nodo');
  }
  function openThread(thread: AtlasThread) {
    setThreadId(threadId === thread.id ? null : thread.id);
    if (threadId !== thread.id) { setPanel('hilo'); setInsp(null); }
    else setPanel(selectedId ? 'nodo' : 'campo');
  }
  function switchMode(next: Mode) {
    if (next === 'orbita' && !selectedId) { setSelectedId('inayatullah'); setPanel('nodo'); }
    setMode(next); setInsp(null);
  }
  function exitPrototype() { window.location.hash = ''; }

  /* ---------- conjuntos derivados ---------- */
  const visibleNodes = nodes.filter((node) => !hiddenTypes.has(node.type) && (schoolFilter === 'all' || node.school === schoolFilter));
  const visibleIds = new Set(visibleNodes.map((node) => node.id));
  const visibleEdges = edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target));
  const activeId = hovered ?? selectedId;
  const neighbors = useMemo(() => {
    const set = new Set<string>();
    if (activeId) { set.add(activeId); edges.forEach((edge) => { if (edge.source === activeId) set.add(edge.target); if (edge.target === activeId) set.add(edge.source); }); }
    return set;
  }, [activeId]);
  const threadSet = new Set(activeThread?.path ?? []);
  const threadEdgeKeys = new Set((activeThread?.path ?? []).slice(0, -1).map((id, i) => [id, activeThread!.path[i + 1]].sort().join('|')));
  const dimmed = (id: string) => (activeThread ? !threadSet.has(id) : activeId ? !neighbors.has(id) : false);
  const showLabel = (node: AtlasNode) =>
    labels === 'all' || (labels === 'key' && ((degree.get(node.id) ?? 0) >= 4 || node.id === selectedId || node.id === hovered || threadSet.has(node.id) || (activeId ? neighbors.has(node.id) : false)));
  const zoomLevel = view.k < 0.95 ? ['01', t.zoomSystem] : view.k < 1.6 ? ['02', t.zoomConstellation] : ['03', t.zoomNode];
  const typeCounts = (Object.keys(typeLabels) as EntityType[]).map((type) => ({ type, count: nodes.filter((node) => node.type === type).length }));
  const searchResults = query.trim() ? nodes.filter((node) => matchesSearch(node, query)).slice(0, 7) : [];
  const indexNodes = [...nodes].sort((a, b) =>
    indexSort === 'name' ? a.name.localeCompare(b.name) : indexSort === 'year' ? parseInt(a.publicationYear, 10) - parseInt(b.publicationYear, 10) : (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0));

  const threadFacts = activeThread ? (() => {
    const routeEdges = activeThread.path.slice(0, -1).map((id, i) => edgeBetween(id, activeThread.path[i + 1])).filter(Boolean) as AtlasEdge[];
    const routeNodes = activeThread.path.map((id) => nodeById.get(id)!).filter(Boolean);
    const years = routeNodes.map((node) => parseInt(node.publicationYear, 10));
    return {
      routeEdges, routeNodes,
      direct: routeEdges.filter((edge) => edge.reference).length,
      schools: new Set(routeNodes.map((node) => node.school)).size,
      span: `${Math.min(...years)}–${Math.max(...years)}`,
    };
  })() : null;

  /* ---------- dossieres ---------- */
  function renderCampo() {
    return <>
      <div className="inst-idrow"><span className="tiny">{t.dossierWorld}</span><span className="tiny">{lang.toUpperCase()} · {t.instrumentWord}</span></div>
      <h1>{t.fieldTitle}</h1>
      <p className="sub">{t.fieldSub}</p>
      <div className="inst-campostat">
        <div className="row"><b className="big">{nodes.length}</b><span className="tiny">{t.nodesUpper}<br />{edges.length} {t.relations}</span></div>
        <div className="inst-blocks">{typeCounts.map(({ type, count }) => <i key={type} style={{ background: palette[type].stroke, width: `${(count / nodes.length) * 100}%` }} />)}</div>
        <ul className="inst-mparts">{typeCounts.map(({ type, count }) => <li key={type}><span className="sw" style={{ background: palette[type].stroke }} />{typePlurals[type]}<span className="v">{count}</span></li>)}</ul>
      </div>
      <p className="inst-plain">{t.plainFieldA} <em>1967</em> {t.plainFieldB} <em>2018</em>{t.plainFieldC} <em>{edges.filter((edge) => edge.reference).length}</em> {t.plainFieldD} <em>{edges.filter((edge) => !edge.reference).length}</em> {t.plainFieldE}</p>
      <div className="inst-stat3">
        <div><b>6</b><span>{t.schools}</span></div>
        <div><b>{threads.length}</b><span>Hilos</span></div>
        <div><b>4</b><span>{t.statModes}</span></div>
      </div>
      <section className="inst-sec">
        <h4>{t.startByThread}</h4>
        {threads.map((thread) => <button key={thread.id} className="inst-rel" onClick={() => openThread(thread)}>
          <span className="cdot" style={{ borderColor: 'var(--signal)', background: 'var(--signal)' }} />
          <span className="who">{thread.title}</span><span className="yr">{thread.code}</span>
          <span className="what">{format(t.stepsGuided, { count: thread.path.length })}</span>
        </button>)}
      </section>
      <section className="inst-sec">
        <h4>{t.howTitle}</h4>
        <p className="inst-prose">{t.howBody}</p>
      </section>
    </>;
  }

  function renderNodo(node: AtlasNode) {
    const connections = getConnections(node.id);
    const verbs = [...new Set(connections.map((item) => item.relation))].slice(0, 3).join(', ');
    return <>
      <div className="inst-idrow"><span className="tiny" style={{ color: palette[node.type].stroke }}>● {codeOf(node)} · {typeLabels[node.type]}</span>
        <button className="closebtn" onClick={() => { if (activeThread) setPanel('hilo'); else { setSelectedId(null); setPanel('campo'); } }}>{activeThread ? t.backToThread : t.backToWorld}</button></div>
      <h1>{node.name}</h1>
      <p className="sub">{node.subtitle}</p>
      <p className="inst-plain">{t.wovenA} <em>{connections.length}</em> {t.wovenB}{verbs ? <> — {verbs}</> : null}. {t.wovenC} <em>{node.publicationYear}</em>.</p>
      <dl className="inst-kv">
        <dt>{t.school}</dt><dd>{schools[node.school]}</dd>
        <dt>{t.year}</dt><dd className="mono">{node.publicationYear}</dd>
        <dt>{t.connections}</dt><dd className="mono">{connections.length}</dd>
      </dl>
      <section className="inst-sec">
        <p className="inst-prose">{node.description}</p>
        {node.question && <blockquote className="inst-quote"><span>{ui.detail.questionLabel}</span>{node.question}</blockquote>}
      </section>
      <section className="inst-sec">
        <h4>{t.relations} <span>{connections.length}</span></h4>
        {connections.map((item) => <button key={item.node.id} className="inst-rel" onClick={() => go(item.node.id)}>
          <span className="cdot" style={{ background: palette[item.node.type].fill, borderColor: palette[item.node.type].stroke }} />
          <span className="who">{item.node.name}</span><span className="yr">{item.node.publicationYear}</span>
          <span className="what">{item.relation}{edgeBetween(node.id, item.node.id)?.reference ? ` · ${t.directSource}` : ` · ${t.editorialAssoc}`}</span>
          {item.context && <span className="ctx">{item.context}</span>}
        </button>)}
      </section>
      <section className="inst-sec">
        <h4>{ui.detail.startHere}</h4>
        <p className="inst-prose">{node.publication.title} <span className="mono" style={{ color: 'var(--fg3)', fontSize: 11 }}>· {node.publication.kind} / {node.publication.year}</span></p>
        <div className="inst-srcs"><a href={node.publication.url} target="_blank" rel="noreferrer">{t.publication}</a><a href={node.source} target="_blank" rel="noreferrer">{t.source}</a></div>
      </section>
      {blueprints.has(node.id) && <button className="inst-cta solid" onClick={() => setBlueprintOpen(true)}>{t.openBlueprint} · {blueprints.get(node.id)!.code}</button>}
      <button className="inst-cta" onClick={() => switchMode('orbita')}>{t.centerOrbit}</button>
    </>;
  }

  function renderHilo(thread: AtlasThread) {
    const facts = threadFacts!;
    return <>
      <div className="inst-idrow"><span className="tiny" style={{ color: 'var(--signal)' }}>{t.threadFile} · {thread.code}</span>
        <button className="closebtn" onClick={() => { setThreadId(null); setPanel('campo'); }}>{t.closeUpper}</button></div>
      <h1>{thread.title}</h1>
      <p className="inst-prose">{thread.dek}</p>
      <div className="inst-stat3">
        <div><b>{thread.path.length}</b><span>{t.steps}</span></div>
        <div><b>{facts.schools}</b><span>{t.schools}</span></div>
        <div><b style={{ fontSize: 21, paddingTop: 6 }}>{facts.span}</b><span>{t.years}</span></div>
      </div>
      <p className="inst-plain">{t.threadPlainA} <em>{facts.routeEdges.length}</em> {t.threadPlainB} <em>{facts.direct}</em> {t.threadPlainC}</p>
      <section className="inst-sec">
        <h4>{t.chain}</h4>
        <ol className="inst-chain">
          {thread.path.map((id, i) => {
            const node = nodeById.get(id)!;
            const next = thread.path[i + 1];
            return <li key={id}><span className="n">{String(i + 1).padStart(2, '0')}</span>
              <button className="step" onClick={() => go(id)}>
                <h5>{node.name}</h5>
                <p>{thread.steps[id]}</p>
                {next && <span className="relto">— {relationBetween(id, next)} →</span>}
              </button></li>;
          })}
        </ol>
      </section>
      <button className="inst-cta solid" onClick={() => setReportOpen(true)}>{t.openPaper}</button>
    </>;
  }

  function renderReport(thread: AtlasThread) {
    const facts = threadFacts!;
    return <section className="inst-report" role="dialog" aria-modal="true" aria-label={`${t.threadFile}: ${thread.title}`}>
      <button className="x" onClick={() => setReportOpen(false)}>{t.closeUpper}</button>
      <div className="inst-doc">
        <div className="hd"><span>{t.reportKicker}</span><span>{thread.code} / {facts.span}</span><span>{format(t.reportData, { nodes: nodes.length, edges: edges.length })}</span></div>
        <div className="dossierbox"><span className="tabno">{thread.code}</span>
          <dl className="fields">
            <div><dt>{t.steps}</dt><dd>{thread.path.length}</dd></div>
            <div><dt>{t.schools}</dt><dd>{facts.schools}</dd></div>
            <div><dt>{t.directSources}</dt><dd>{facts.direct}/{facts.routeEdges.length}</dd></div>
            <div><dt>{t.timeSpan}</dt><dd>{facts.span}</dd></div>
          </dl>
        </div>
        <h1><mark>{thread.title}</mark></h1>
        <p className="dek">{thread.dek}</p>
        <div className="kf">
          <div><span>{t.kfAuthors}</span><b>{facts.routeNodes.filter((node) => node.type === 'author').length}</b></div>
          <div><span>{t.kfIdeas}</span><b>{facts.routeNodes.filter((node) => node.type !== 'author').length}</b></div>
          <div><span>{t.kfDirect}</span><b>{facts.direct}</b></div>
          <div><span>{t.kfYears}</span><b>{facts.span}</b></div>
        </div>
        <h2>{t.chain} <span>{format(t.chainSteps, { count: thread.path.length })}</span></h2>
        <ol className="chain">
          {thread.path.map((id, i) => {
            const node = nodeById.get(id)!;
            return <li key={id}><span className="n">{String(i + 1).padStart(2, '0')}</span><div>
              <h4>{node.name}<small>{codeOf(node)} · {node.publicationYear}</small></h4>
              <p>{thread.steps[id]}</p>
              <p className="desc">{node.description}</p>
            </div></li>;
          })}
        </ol>
        <h2>{t.linkSources}</h2>
        <ol className="src">
          {facts.routeEdges.map((edge, i) => <li key={i}>
            {nodeById.get(edge.source)?.name} — {nodeById.get(edge.target)?.name}:{' '}
            {edge.reference ? <a href={edge.reference} target="_blank" rel="noreferrer">{t.directLink}</a> : t.editorialNote}
            {edgeContext(edge) && <><br />{edgeContext(edge)}</>}
          </li>)}
        </ol>
        <div className="endmark">{t.endMark}</div>
      </div>
    </section>;
  }

  const crumbs = selectedId ? [...history, selectedId] : history;

  if (isPhone && !forceFull) {
    return <Phone onOpenFull={() => setForceFull(true)} onExitClassic={exitPrototype} initialNodeId={selectedId} initialBlueprint={blueprintOpen} />;
  }

  return <div className={`inst ${intro ? 'is-intro' : ''}`} ref={rootRef}>
    <div className="inst-grid-bg" />
    <svg ref={svgRef} className="inst-net" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.introKicker}
      onPointerDown={(event) => { if (event.button === 0) dragRef.current = { startX: event.clientX, startY: event.clientY, view, moved: false }; }}
      onPointerMove={(event) => {
        const drag = dragRef.current; if (!drag) return;
        const rect = svgRef.current!.getBoundingClientRect();
        const scale = Math.min(rect.width / W, rect.height / H);
        const dx = (event.clientX - drag.startX) / scale; const dy = (event.clientY - drag.startY) / scale;
        if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
        setView({ ...drag.view, x: drag.view.x + dx / drag.view.k, y: drag.view.y + dy / drag.view.k });
      }}
      onPointerUp={() => { window.setTimeout(() => { dragRef.current = null; }, 0); }}
      onClick={() => setInsp(null)}>
      <g transform={`translate(${W / 2} ${H / 2}) scale(${view.k}) translate(${-W / 2 + view.x} ${-H / 2 + view.y})`}>
        {mode === 'cronologia' && [1970, 1985, 2000, 2015].map((year) => {
          const x = 80 + ((year - 1962) / 62) * 810;
          return <g key={year}><line x1={x} y1={60} x2={x} y2={630} stroke="#1d2f23" strokeDasharray="3 6" /><text className="inst-axis" x={x} y={655} textAnchor="middle">{year}</text></g>;
        })}
        {mode === 'escuelas' && SCHOOL_ORDER.map((school) => <text key={school} className="inst-territory" x={SCHOOL_CENTERS[school].x} y={SCHOOL_CENTERS[school].y - 108} textAnchor="middle">{schools[school]}</text>)}
        {mode === 'orbita' && [185, 305, 395].map((radius) => <ellipse key={radius} cx={W / 2} cy={H / 2} rx={radius} ry={radius * 0.74} fill="none" stroke="#1d2f23" strokeDasharray="2 7" />)}
        {visibleEdges.map((edge, i) => {
          const a = positions.get(edge.source); const b = positions.get(edge.target);
          if (!a || !b) return null;
          const key = [edge.source, edge.target].sort().join('|');
          const inThread = threadEdgeKeys.has(key);
          const inFocus = !!activeId && (edge.source === activeId || edge.target === activeId);
          const opacity = inThread ? 1 : dimmed(edge.source) && dimmed(edge.target) ? 0.14 : inFocus ? 0.95 : 0.4;
          return <g key={i} opacity={opacity}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={inThread ? '#b7f04a' : inFocus ? '#cfe3c2' : '#435c48'} strokeWidth={inThread ? 2.2 : 1} />
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={13} style={{ cursor: 'pointer' }}
              onClick={(event) => {
                event.stopPropagation();
                const rect = rootRef.current!.getBoundingClientRect();
                setInsp({ edge, x: event.clientX - rect.left, y: event.clientY - rect.top });
              }} />
          </g>;
        })}
        {visibleNodes.map((node) => {
          const point = positions.get(node.id); if (!point) return null;
          const radius = node.radius * 0.82;
          const stepIndex = activeThread ? activeThread.path.indexOf(node.id) : -1;
          return <g key={node.id} className="inst-node" transform={`translate(${point.x} ${point.y})`} opacity={dimmed(node.id) ? 0.16 : 1}
            onMouseEnter={() => setHovered(node.id)} onMouseLeave={() => setHovered(null)}
            onClick={(event) => { event.stopPropagation(); if (!dragRef.current?.moved) go(node.id); }}>
            {node.id === selectedId && <><circle r={radius + 7} fill="none" stroke="#b7f04a" strokeWidth={1.4} /><circle r={radius + 12} fill="none" stroke="#b7f04a" strokeOpacity={0.35} /></>}
            <circle r={radius} fill={palette[node.type].fill} stroke={palette[node.type].stroke} strokeWidth={1.4} />
            {node.initials && <text textAnchor="middle" dominantBaseline="central" fontFamily="'IBM Plex Mono', monospace" fontSize={10} fill={palette[node.type].ink}>{node.initials}</text>}
            {stepIndex >= 0 && <g transform={`translate(${radius * 0.85} ${-radius * 0.85})`}><circle r={10} fill="#b7f04a" /><text textAnchor="middle" dominantBaseline="central" fontSize={10} fontFamily="'IBM Plex Mono', monospace" fill="#11160c">{stepIndex + 1}</text></g>}
            {showLabel(node) && <text className={`inst-node-label ${node.id === selectedId ? 'sel' : ''}`} y={radius + 15} textAnchor="middle">{node.name.length > 26 ? `${node.name.slice(0, 25)}…` : node.name}</text>}
          </g>;
        })}
      </g>
    </svg>

    <div className="inst-intro-veil" aria-hidden={!intro}><div>
      <span className="tiny">{t.introKicker}</span>
      <h1>{t.introTitleA} <em>{t.introTitleB}</em></h1>
      <p>{format(t.introMeta, { nodes: nodes.length, edges: edges.length })}</p>
    </div></div>
    <button className="inst-skip" aria-label={t.skipIntro} title={t.skipIntro} onClick={() => setIntro(false)}>»</button>

    <header>
      <button className="inst-mark" onClick={() => { setSelectedId(null); setPanel('campo'); }}><b>FORESIGHT <i>ATLAS</i></b><span className="tiny">{t.brandSub}</span></button>
      <div className="inst-search">
        <input type="search" placeholder={t.searchPlaceholder} aria-label={t.searchLabel} value={query}
          onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} />
        {searchOpen && searchResults.length > 0 && <div className="inst-results">
          {searchResults.map((node) => <button key={node.id} onClick={() => { go(node.id); setSearchOpen(false); setQuery(''); }}><span>{node.name}</span><span>{typeLabels[node.type]} · {node.publicationYear}</span></button>)}
        </div>}
      </div>
      <nav className="inst-top" aria-label={`${t.map} · ${t.index}`}>
        <button aria-pressed={!indexOpen} onClick={() => setIndexOpen(false)}>{t.map}</button>
        <button aria-pressed={indexOpen} onClick={() => setIndexOpen(true)}>{t.index}</button>
        <button onClick={exitPrototype}>{t.classicView}</button>
      </nav>
    </header>

    <aside className="inst-rail" aria-label={t.types}>
      <section>
        <h3>{t.types} <span>{visibleNodes.length}/{nodes.length}</span></h3>
        {typeCounts.map(({ type, count }) => <button key={type} className="inst-opt" style={{ color: hiddenTypes.has(type) ? 'var(--fg2)' : palette[type].stroke }} aria-pressed={!hiddenTypes.has(type)}
          onClick={() => setHiddenTypes((current) => { const next = new Set(current); if (next.has(type)) next.delete(type); else next.add(type); return next; })}>
          <span className="dot" />{typePlurals[type]}<span className="n">{count}</span></button>)}
      </section>
      <section>
        <h3>{t.schools}</h3>
        {SCHOOL_ORDER.map((school) => <button key={school} className="inst-opt" aria-pressed={schoolFilter === school} onClick={() => setSchoolFilter(schoolFilter === school ? 'all' : school)}>
          <span className="dot" />{schools[school]}<span className="n">{nodes.filter((node) => node.school === school).length}</span></button>)}
      </section>
      <section>
        <h3>{t.threadsFiles} <span>{threads.length}</span></h3>
        <div className="inst-drawer">
          {threads.map((thread, i) => <button key={thread.id} className="inst-file" aria-pressed={threadId === thread.id} onClick={() => openThread(thread)}>
            <span className="tab" style={{ '--off': `${(i % 3) * 22}px` } as CSSProperties}><span>{thread.title.split(':')[0].split(' ').slice(0, 3).join(' ')}…</span><b>{thread.code}</b></span>
          </button>)}
          <div className="inst-drawerfoot"><span>{t.guidedRoutes}</span></div>
        </div>
      </section>
      <p className="inst-hint">{t.railHint}</p>
    </aside>

    {activeThread && <div className="inst-paperwrap"><button className="inst-paper" onClick={() => setReportOpen(true)} aria-label={t.paperAria}>
      <span className="k" style={{ textTransform: "uppercase" }}>{t.threadFile} · {activeThread.code}</span>
      <span className="t" style={{ display: 'block' }}>{activeThread.title}</span>
      <span className="lines" style={{ display: 'block' }} />
      <span className="go">{t.paperOpen}</span>
      <span className="edge">{t.paperWord} · {activeThread.code}</span>
    </button></div>}

    {selected?.type === 'author' && panel === 'nodo' && <div className={`inst-photo ${photoTucked ? 'tucked' : ''}`}>
      <button className="arrow" aria-label={photoTucked ? t.photoShow : t.photoHide} onClick={() => setPhotoTucked(!photoTucked)}>→</button>
      <div className="card"><span className="clip" />
        <div className="lab"><span>{codeOf(selected)}</span><span>{t.fileCard}</span></div>
        <div className="pic" style={{ color: palette.author.stroke }}>{selected.initials}</div>
        <div className="nm">{selected.name}</div>
        <span className="stamp">{selected.publicationYear}</span>
      </div>
    </div>}

    <aside className="inst-dossier" aria-live="polite">
      {panel === 'hilo' && activeThread ? renderHilo(activeThread) : panel === 'nodo' && selected ? renderNodo(selected) : renderCampo()}
    </aside>

    <div className="inst-zoomlbl tiny">ZOOM <b>{zoomLevel[0]}</b> — {zoomLevel[1]} · ×{view.k.toFixed(2)}</div>
    <div className="inst-names" role="group" aria-label={t.names}>
      <span className="tiny">{t.names}</span>
      {(['off', 'key', 'all'] as LabelMode[]).map((value) => <button key={value} aria-pressed={labels === value} onClick={() => setLabels(value)}>{value === 'off' ? t.namesOff : value === 'key' ? t.namesKey : t.namesAll}</button>)}
    </div>

    <div className="inst-ctrls" aria-label={t.map}>
      <button onClick={() => zoomBy(0.18)} aria-label={ui.graph.zoomIn}>+</button>
      <button onClick={() => zoomBy(-0.18)} aria-label={ui.graph.zoomOut}>−</button>
      <button onClick={() => setView({ k: 0.92, x: 0, y: 0 })} aria-label={ui.graph.resetZoom}>◎</button>
    </div>

    <div className="inst-modes" role="group" aria-label={t.modesLabel}>
      {MODES.map((value) => <button key={value} aria-pressed={mode === value} onClick={() => switchMode(value)}>{mode === value ? '●' : '○'} {MODE_LABEL[value]}</button>)}
    </div>

    <div className="inst-crumbs">
      {history.length > 0 && <button className="back" onClick={back} aria-label={t.backTitle}>←</button>}
      {crumbs.length ? crumbs.map((id, i) => <span key={`${id}-${i}`}>{i > 0 && ' › '}<button onClick={() => { setSelectedId(id); setPanel('nodo'); }}>{nodeById.get(id)?.name}</button></span>) : t.world}
    </div>
    <div className="inst-meta tiny">
      X {view.x.toFixed(1)} · Y {view.y.toFixed(1)}<br />{MODE_LABEL[mode]} · {visibleNodes.length} {t.nodesUpper}<br />{format(t.dataLine, { nodes: nodes.length, edges: edges.length })}
    </div>

    {insp && <div className="inst-insp" role="dialog" aria-label={t.relations} style={{ left: Math.min(insp.x + 14, window.innerWidth - 356), top: Math.max(84, insp.y - 20) }}>
      <button className="x" onClick={() => setInsp(null)}>✕</button>
      <span className={`st ${insp.edge.reference ? '' : 'ed'}`}>{insp.edge.reference ? t.directBadge : t.editorialBadge}</span>
      <div className="ends">
        {nodeById.get(insp.edge.source)?.name}
        <span className="arr">— {relationBetween(insp.edge.source, insp.edge.target)} →</span>
        {nodeById.get(insp.edge.target)?.name}
      </div>
      {edgeContext(insp.edge) && <p className="ex">{edgeContext(insp.edge)}</p>}
      {insp.edge.reference
        ? <a href={insp.edge.reference} target="_blank" rel="noreferrer">{t.seeReference}</a>
        : <span className="tiny">{t.editorialExplain}</span>}
    </div>}

    {indexOpen && <section className="inst-index" aria-label={t.indexTitle}>
      <div className="head"><h2>{t.indexTitle}</h2><button className="tiny" onClick={() => setIndexOpen(false)}>{t.backToMap}</button></div>
      <div style={{ overflowX: 'auto' }}><table className="idx"><thead><tr>
        <th><button onClick={() => setIndexSort('name')}>{t.colName} {indexSort === 'name' ? '↓' : ''}</button></th><th>{t.colType}</th><th>{t.school}</th>
        <th><button onClick={() => setIndexSort('year')}>{t.year} {indexSort === 'year' ? '↓' : ''}</button></th>
        <th><button onClick={() => setIndexSort('degree')}>{t.connections} {indexSort === 'degree' ? '↓' : ''}</button></th><th>{t.colCode}</th>
      </tr></thead><tbody>
        {indexNodes.map((node) => <tr key={node.id} data-node onClick={() => { go(node.id); setIndexOpen(false); }}>
          <td>{node.name}</td><td>{typeLabels[node.type]}</td><td>{schools[node.school]}</td>
          <td className="m">{node.publicationYear}</td><td className="m">{degree.get(node.id)}</td><td className="m">{codeOf(node)}</td>
        </tr>)}
      </tbody></table></div>
    </section>}

    {reportOpen && activeThread && renderReport(activeThread)}
    {blueprintOpen && selected && <Blueprint node={selected} onClose={() => setBlueprintOpen(false)} onGoNode={(id) => go(id)} />}
  </div>;
}
