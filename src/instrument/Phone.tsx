import { useEffect, useMemo, useRef, useState } from 'react';
import { edges, nodeShapes, palette, type AtlasNode, type EntityType } from '../data/atlas';
import { format, useI18n } from '../i18n';
import Blueprint from './Blueprint';
import './instrumento.css';

/**
 * Phone story (pattern N12 from the BL00D.MONEY reverse engineering):
 * at ≤760px the instrument is NOT a shrunk map. It is one long scroll —
 * the graph as the hero's backdrop, then numbered sections: the field,
 * the Hilos, the method blueprints and a touch index. Node dossiers and
 * blueprints open as full pages. The full instrument stays one tap away.
 */

const CODE_PREFIX: Record<EntityType, string> = { author: 'AUT', concept: 'CON', method: 'MET' };
const codeOf = (node: AtlasNode) => `${CODE_PREFIX[node.type]}-${String(nodeShapes.findIndex((shape) => shape.id === node.id) + 1).padStart(3, '0')}`;

interface PhoneProps {
  onOpenFull: () => void;
  onExitClassic: () => void;
  initialNodeId: string | null;
  initialBlueprint: boolean;
}

export default function Phone({ onOpenFull, onExitClassic, initialNodeId, initialBlueprint }: PhoneProps) {
  const { ui, nodes, nodeById, getConnections, schools, typeLabels, typePlurals, matchesSearch, threads, blueprints, edgeContext } = useI18n();
  const t = ui.inst;
  const [pageNodeId, setPageNodeId] = useState<string | null>(initialNodeId);
  const [blueprintNodeId, setBlueprintNodeId] = useState<string | null>(initialBlueprint && initialNodeId ? initialNodeId : null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<EntityType | 'all'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLElement>(null);
  const savedScroll = useRef(0);

  const degree = useMemo(() => {
    const map = new Map<string, number>();
    edges.forEach((edge) => { map.set(edge.source, (map.get(edge.source) ?? 0) + 1); map.set(edge.target, (map.get(edge.target) ?? 0) + 1); });
    return map;
  }, []);

  const pageNode = pageNodeId ? nodeById.get(pageNodeId) : undefined;
  const blueprintNode = blueprintNodeId ? nodeById.get(blueprintNodeId) : undefined;
  const activeThread = threads.find((thread) => thread.id === threadId);
  const typeCounts = (Object.keys(typeLabels) as EntityType[]).map((type) => ({ type, count: nodes.filter((node) => node.type === type).length }));
  const listNodes = [...nodes]
    .filter((node) => (typeFilter === 'all' || node.type === typeFilter) && matchesSearch(node, query))
    .sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0) || a.name.localeCompare(b.name));

  useEffect(() => {
    if (pageNodeId) { savedScroll.current = scrollRef.current?.scrollTop ?? 0; }
  }, [pageNodeId]);

  function openNode(id: string) {
    if (pageNodeId && pageNodeId !== id) setHistory((stack) => [...stack.slice(-11), pageNodeId]);
    setPageNodeId(id);
  }
  function goBack() {
    const previous = history[history.length - 1];
    if (previous) { setHistory((stack) => stack.slice(0, -1)); setPageNodeId(previous); }
    else { setPageNodeId(null); requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: savedScroll.current })); }
  }

  /* ---------- nodo a página completa ---------- */
  if (pageNode) {
    const node = pageNode;
    const connections = getConnections(node.id);
    return <div className="inst">
      <button className="ph-back" onClick={goBack}>{t.phBack}{history.length ? ` · ${nodeById.get(history[history.length - 1])?.name}` : ''}</button>
      <div className="ph-nodepage" role="document" key={node.id}>
        <span className="tiny" style={{ color: palette[node.type].stroke }}>● {codeOf(node)} · {typeLabels[node.type]}</span>
        <h1>{node.name}</h1>
        <p className="inst-dossier-sub">{node.subtitle}</p>
        <dl className="inst-kv">
          <dt>{t.school}</dt><dd>{schools[node.school]}</dd>
          <dt>{t.year}</dt><dd className="mono">{node.publicationYear}</dd>
          <dt>{t.connections}</dt><dd className="mono">{connections.length}</dd>
        </dl>
        <p className="inst-prose">{node.description}</p>
        {node.question && <blockquote className="inst-quote"><span>{ui.detail.questionLabel}</span>{node.question}</blockquote>}
        {blueprints.has(node.id) && <button className="inst-cta solid" onClick={() => setBlueprintNodeId(node.id)}>{t.openBlueprint} · {blueprints.get(node.id)!.code}</button>}
        <section className="inst-sec">
          <h4>{t.relations} <span>{connections.length}</span></h4>
          {connections.map((item) => <button key={item.node.id} className="inst-rel" onClick={() => openNode(item.node.id)}>
            <span className="cdot" style={{ width: 8, height: 8, borderRadius: '50%', background: palette[item.node.type].fill, border: `1px solid ${palette[item.node.type].stroke}`, alignSelf: 'center' }} />
            <span className="who">{item.node.name}</span><span className="yr">{item.node.publicationYear}</span>
            <span className="what">{item.relation}{item.edge.reference ? ` · ${t.directSource}` : ` · ${t.editorialAssoc}`}</span>
            {item.context && <span className="ctx">{item.context}</span>}
          </button>)}
        </section>
        <section className="inst-sec">
          <h4>{ui.detail.startHere}</h4>
          <p className="inst-prose">{node.publication.title} <span className="mono" style={{ color: 'var(--fg3)', fontSize: 11 }}>· {node.publication.kind} / {node.publication.year}</span></p>
          <div className="inst-srcs"><a href={node.publication.url} target="_blank" rel="noreferrer">{t.publication}</a><a href={node.source} target="_blank" rel="noreferrer">{t.source}</a></div>
        </section>
      </div>
      {blueprintNode && <Blueprint node={blueprintNode} onClose={() => setBlueprintNodeId(null)} onGoNode={(id) => { setBlueprintNodeId(null); openNode(id); }} />}
    </div>;
  }

  /* ---------- la historia ---------- */
  return <div className="inst ph" ref={scrollRef}>
    <div className="ph-bar">
      <b>FORESIGHT <i>ATLAS</i></b>
      <nav>
        <button onClick={() => fieldRef.current?.scrollIntoView({ behavior: 'smooth' })}>{t.phField.toUpperCase()}</button>
        <button onClick={onExitClassic}>{t.classicView}</button>
      </nav>
    </div>

    <div className="ph-hero">
      <svg className="ph-hero-net" viewBox="0 0 960 690" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {edges.map((edge, i) => {
          const a = nodeShapes.find((shape) => shape.id === edge.source)!;
          const b = nodeShapes.find((shape) => shape.id === edge.target)!;
          return <line key={i} x1={a.x} y1={a.y * 0.88 + 16} x2={b.x} y2={b.y * 0.88 + 16} stroke="#3c5745" strokeWidth={1} opacity={0.7} />;
        })}
        {nodes.map((node) => <g key={node.id} onClick={() => openNode(node.id)} style={{ cursor: 'pointer' }}>
          <circle cx={node.x} cy={node.y * 0.88 + 16} r={node.radius + 18} fill="transparent" /><circle cx={node.x} cy={node.y * 0.88 + 16} r={node.radius * 0.95} fill={palette[node.type].fill} stroke={palette[node.type].stroke} strokeWidth={1.4} />
          {(degree.get(node.id) ?? 0) >= 4 && <text x={node.x} y={node.y * 0.88 + 16 + node.radius + 14} textAnchor="middle" className="inst-node-label">{node.name}</text>}
        </g>)}
      </svg>
      <div className="ph-hero-head">
        <span className="tiny">{t.introKicker}</span>
        <h1>{t.introTitleA} <em>{t.introTitleB}</em></h1>
        <p>{t.fieldSub}</p>
        <button className="ph-down" onClick={() => fieldRef.current?.scrollIntoView({ behavior: 'smooth' })}>{t.phStart}</button>
      </div>
    </div>

    <div className="ph-body">
      <section className="ph-sec" ref={fieldRef}>
        <h2 className="ph-h"><span>01</span>{t.phField}</h2>
        <div className="inst-campostat">
          <div className="row"><b className="big">{nodes.length}</b><span className="tiny">{t.nodesUpper}<br />{edges.length} {t.relations}</span></div>
          <div className="inst-blocks">{typeCounts.map(({ type, count }) => <i key={type} style={{ background: palette[type].stroke, width: `${(count / nodes.length) * 100}%` }} />)}</div>
          <ul className="inst-mparts">{typeCounts.map(({ type, count }) => <li key={type}><span className="sw" style={{ background: palette[type].stroke }} />{typePlurals[type]}<span className="v">{count}</span></li>)}</ul>
        </div>
        <p className="ph-lede">{t.plainFieldA} 1967 {t.plainFieldB} 2018{t.plainFieldC} {edges.filter((edge) => edge.reference).length} {t.plainFieldD} {edges.filter((edge) => !edge.reference).length} {t.plainFieldE}</p>
      </section>

      <section className="ph-sec">
        <h2 className="ph-h"><span>02</span>{t.phThreads}</h2>
        <ol className="ph-files">
          {threads.map((thread) => <li key={thread.id}>
            <button className={`ph-file ${threadId === thread.id ? 'on' : ''}`} aria-pressed={threadId === thread.id} onClick={() => setThreadId(threadId === thread.id ? null : thread.id)}>
              <span className="ph-file-tab">{thread.code} · {format(t.chainSteps, { count: thread.path.length })}</span>
              <span className="ph-file-body">
                <strong>{thread.title}</strong>
                <small>{thread.dek}</small>
              </span>
            </button>
          </li>)}
        </ol>
        {activeThread && <div className="ph-thread">
          <ol className="inst-chain">
            {activeThread.path.map((id, index) => {
              const node = nodeById.get(id)!;
              const next = activeThread.path[index + 1];
              const nextEdge = next ? edges.find((edge) => (edge.source === id && edge.target === next) || (edge.source === next && edge.target === id)) : undefined;
              return <li key={id}><span className="n">{String(index + 1).padStart(2, '0')}</span>
                <button className="step" onClick={() => openNode(id)}>
                  <h5>{node.name}</h5>
                  <p>{activeThread.steps[id]}</p>
                  {next && nextEdge && <span className="relto">{edgeContext(nextEdge)}</span>}
                </button></li>;
            })}
          </ol>
          <button className="inst-cta" onClick={onOpenFull}>{t.phFull} →</button>
        </div>}
      </section>

      <section className="ph-sec">
        <h2 className="ph-h"><span>03</span>{t.phBlueprints}</h2>
        {[...blueprints.values()].map((blueprint) => {
          const node = nodeById.get(blueprint.nodeId)!;
          return <button key={blueprint.nodeId} className="ph-bp" onClick={() => setBlueprintNodeId(blueprint.nodeId)}>
            <span className="tiny">{t.bpKicker} · {blueprint.code}</span>
            <strong>{node.name}</strong>
            <span>{node.subtitle}</span>
            <em>{t.openBlueprint} →</em>
          </button>;
        })}
      </section>

      <section className="ph-sec">
        <h2 className="ph-h"><span>04</span>{t.phExplore}</h2>
        <input className="ph-q" type="search" placeholder={t.searchPlaceholder} aria-label={t.searchLabel} value={query} onChange={(event) => setQuery(event.target.value)} />
        <div className="ph-chips" role="group" aria-label={t.types}>
          <button aria-pressed={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>{t.phAll}</button>
          {typeCounts.map(({ type }) => <button key={type} aria-pressed={typeFilter === type} onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}>
            <i style={{ background: palette[type].stroke }} />{typePlurals[type]}</button>)}
        </div>
        <p className="tiny">{format(t.phNodesShown, { count: listNodes.length, total: nodes.length })}</p>
        {listNodes.length === 0 && <p className="ph-none">{t.phNoResults}</p>}
        <div>
          {listNodes.map((node) => <button key={node.id} className="ph-row" onClick={() => openNode(node.id)}>
            <i style={{ background: palette[node.type].stroke }} />
            <span className="n">{node.name}<small>{node.subtitle}</small></span>
            <span className="d">{degree.get(node.id)}<small>{node.publicationYear}</small></span>
          </button>)}
        </div>
      </section>

      <p className="ph-note">{t.phFullHint}</p>
      <button className="ph-cta" onClick={onOpenFull}>{t.phFull}</button>
      <div className="ph-foot">
        <b>FORESIGHT <i>ATLAS</i></b>
        <span className="tiny">{format(t.dataLine, { nodes: nodes.length, edges: edges.length })}</span>
      </div>
    </div>

    {blueprintNode && <Blueprint node={blueprintNode} onClose={() => setBlueprintNodeId(null)} onGoNode={(id) => { setBlueprintNodeId(null); openNode(id); }} />}
  </div>;
}
