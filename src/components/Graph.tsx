import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Maximize2, Minimize2, Minus, Network, Plus, Scan, X } from 'lucide-react';
import { palette, schoolPalette, type AtlasEdge, type AtlasNode } from '../data/atlas';
import { useI18n } from '../i18n';

export interface GraphSettings {
  labels: boolean;
  connections: boolean;
  highlight: boolean;
}

interface GraphProps {
  nodes: AtlasNode[];
  edges: AtlasEdge[];
  selectedId: string | null;
  onSelect: (node: AtlasNode) => void;
  focusId: string | null;
  onClearFocus: () => void;
  settings: GraphSettings;
  svgRef: RefObject<SVGSVGElement | null>;
  onReset: () => void;
  expanded: boolean;
  onExpand: () => void;
  /** Nodes an answer rests on. Everything else recedes while it is set. */
  emphasisIds?: string[];
  /** Ordered route to draw over the graph. Consecutive ids are joined by atlas edges. */
  pathIds?: string[];
}

const W = 960;
const H = 690;
type Point = { x: number; y: number };
type View = Point & { k: number };

function initialView(): View {
  return { x: 0, y: 0, k: window.innerWidth < 600 ? 1.65 : 1 };
}

function svgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const rect = svg.getBoundingClientRect();
  const scale = Math.min(rect.width / W, rect.height / H);
  return {
    x: (clientX - rect.left - (rect.width - W * scale) / 2) / scale,
    y: (clientY - rect.top - (rect.height - H * scale) / 2) / scale,
  };
}

function curve(a: Point, b: Point, index: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  const bend = Math.min(length * 0.13, 40) * (index % 2 ? 1 : -1);
  const cx = (a.x + b.x) / 2 - dy / length * bend;
  const cy = (a.y + b.y) / 2 + dx / length * bend;
  return { d: `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`, x: (a.x + 2 * cx + b.x) / 4, y: (a.y + 2 * cy + b.y) / 4 };
}

export default function Graph({ nodes, edges, selectedId, onSelect, focusId, onClearFocus, settings, svgRef, onReset, expanded, onExpand, emphasisIds = [], pathIds = [] }: GraphProps) {
  const { ui, typeLabels, typePlurals } = useI18n();
  const [view, setView] = useState<View>(initialView);
  const [positions, setPositions] = useState<Record<string, Point>>({});
  const [hovered, setHovered] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ start: Point; view: View; nodeId: string | null; node: Point; moved: boolean } | null>(null);
  const pointers = useRef(new Map<number, Point>());
  const pinch = useRef<{ distance: number; center: Point; view: View } | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setView(focusId ? { x: 0, y: 0, k: 1 } : initialView());
    setPositions({});
    setHovered(null);
    setHoveredEdge(null);
  }, [focusId]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    // Anchor wheel zoom to the pointer, including SVG letterboxing.
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const point = svgPoint(svg, event.clientX, event.clientY);
      setView((current) => {
        const k = Math.min(2.6, Math.max(0.45, current.k * Math.exp(-event.deltaY * 0.0014)));
        const ratio = k / current.k;
        return { k, x: point.x - W / 2 - (point.x - W / 2 - current.x) * ratio, y: point.y - H / 2 - (point.y - H / 2 - current.y) * ratio };
      });
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [svgRef]);

  const layout = useMemo(() => {
    const result = new Map<string, Point>();
    const neighbors = nodes.filter((node) => node.id !== focusId);
    nodes.forEach((node) => {
      if (positions[node.id]) result.set(node.id, positions[node.id]);
      // Reserve a quiet strip beneath the network for navigation controls.
      else if (!focusId) result.set(node.id, { x: node.x, y: node.y * 0.88 + 16 });
      else if (node.id === focusId) result.set(node.id, { x: W / 2, y: H / 2 - 12 });
      else {
        const angle = neighbors.findIndex((neighbor) => neighbor.id === node.id) / neighbors.length * Math.PI * 2 - Math.PI / 2;
        result.set(node.id, { x: W / 2 + Math.cos(angle) * 274, y: H / 2 - 12 + Math.sin(angle) * 223 });
      }
    });
    return result;
  }, [nodes, focusId, positions]);

  const activeId = hovered || selectedId;
  const connected = useMemo(() => {
    const result = new Set<string>();
    if (activeId) result.add(activeId);
    edges.forEach((edge) => {
      if (edge.source === activeId) result.add(edge.target);
      if (edge.target === activeId) result.add(edge.source);
    });
    return result;
  }, [edges, activeId]);

  const emphasis = useMemo(() => new Set(emphasisIds), [emphasisIds]);

  // An answer should be seen, not hunted for: fit the view to the nodes it rests on.
  useEffect(() => {
    if (!emphasisIds.length) return;
    const points = emphasisIds.map((id) => layout.get(id)).filter((point): point is Point => !!point);
    if (!points.length) return;
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const box = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    const k = Math.min(1.6, Math.max(0.6, Math.min(W / (box.w + 260), H / (box.h + 220))));
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    setView({ k, x: (W / 2 - cx) * k, y: (H / 2 - cy) * k });
    // Only re-fit when the set of emphasized nodes changes, not when a node is dragged.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emphasisIds.join('|')]);
  const pathPoints = useMemo(() => pathIds.map((id) => ({ id, point: layout.get(id) })).filter((item): item is { id: string; point: Point } => !!item.point), [pathIds, layout]);

  function zoom(amount: number) {
    setView((current) => {
      const k = Math.min(2.6, Math.max(0.45, current.k + amount));
      return { k, x: current.x * k / current.k, y: current.y * k / current.k };
    });
  }

  function resetView() {
    setView({ x: 0, y: 0, k: 1 });
    setPositions({});
  }

  const focusNode = nodes.find((node) => node.id === focusId);

  return (
    <div className={`graph-canvas ${dragging ? 'is-dragging' : ''}`}>
      <div className="graph-legend" aria-label={ui.graph.legend}>
        {(['author', 'concept', 'method'] as const).map((type) => <span key={type}><i style={{ background: palette[type].fill, borderColor: palette[type].stroke }} />{typePlurals[type]}</span>)}
      </div>
      {focusNode && <div className="focus-context"><span>{ui.graph.exploring} <strong>{focusNode.name}</strong></span><button className="icon-button" onClick={onClearFocus} aria-label={ui.graph.returnToGraph}><X size={14} /></button></div>}

      <p id="graph-instructions" className="sr-only">{ui.graph.instructions}</p>
      <svg ref={svgRef} className="network-svg" viewBox={`0 0 ${W} ${H}`} tabIndex={0} role="group" aria-describedby="graph-instructions" aria-label={ui.graph.ariaLabel}
        onKeyDown={(event) => {
          if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom(0.15); }
          if (event.key === '-') { event.preventDefault(); zoom(-0.15); }
          if (event.key === '0') { event.preventDefault(); resetView(); }
          if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            event.preventDefault();
            setView((current) => ({ ...current, x: current.x + (event.key === 'ArrowLeft' ? 40 : event.key === 'ArrowRight' ? -40 : 0), y: current.y + (event.key === 'ArrowUp' ? 40 : event.key === 'ArrowDown' ? -40 : 0) }));
          }
        }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          const point = svgPoint(event.currentTarget, event.clientX, event.clientY);
          pointers.current.set(event.pointerId, point);
          event.currentTarget.setPointerCapture(event.pointerId);
          if (pointers.current.size === 2) {
            const [a, b] = [...pointers.current.values()];
            pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y) || 1, center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, view };
            drag.current = null;
            setDragging(true);
            return;
          }
          if (pointers.current.size > 2) return;
          const element = (event.target as Element).closest('[data-node]');
          const nodeId = element?.getAttribute('data-node') || null;
          drag.current = { start: point, view, nodeId, node: nodeId ? layout.get(nodeId)! : { x: 0, y: 0 }, moved: false };
        }}
        onPointerMove={(event) => {
          if (!pointers.current.has(event.pointerId)) return;
          const point = svgPoint(event.currentTarget, event.clientX, event.clientY);
          pointers.current.set(event.pointerId, point);
          if (pinch.current && pointers.current.size >= 2) {
            const [a, b] = [...pointers.current.values()];
            const start = pinch.current;
            const k = Math.min(2.6, Math.max(0.45, start.view.k * Math.hypot(a.x - b.x, a.y - b.y) / start.distance));
            const ratio = k / start.view.k;
            setView({ k, x: (a.x + b.x) / 2 - W / 2 - (start.center.x - W / 2 - start.view.x) * ratio, y: (a.y + b.y) / 2 - H / 2 - (start.center.y - H / 2 - start.view.y) * ratio });
            return;
          }
          if (!drag.current) return;
          const dx = point.x - drag.current.start.x;
          const dy = point.y - drag.current.start.y;
          if (Math.hypot(dx, dy) > 4) { drag.current.moved = true; setDragging(true); }
          if (!drag.current.moved) return;
          if (drag.current.nodeId) {
            const id = drag.current.nodeId;
            const position = { x: drag.current.node.x + dx / view.k, y: drag.current.node.y + dy / view.k };
            setPositions((current) => ({ ...current, [id]: position }));
          } else setView({ ...drag.current.view, x: drag.current.view.x + dx, y: drag.current.view.y + dy });
        }}
        onPointerUp={(event) => {
          pointers.current.delete(event.pointerId);
          if (pinch.current) {
            pinch.current = null;
            drag.current = null;
          }
          if (drag.current && !drag.current.moved && drag.current.nodeId) {
            const node = nodes.find((item) => item.id === drag.current!.nodeId);
            if (node) onSelect(node);
          }
          drag.current = null;
          setDragging(false);
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => { drag.current = null; pinch.current = null; pointers.current.clear(); setDragging(false); }}
        onDoubleClick={(event) => {
          if (!(event.target as Element).closest('[data-node]')) resetView();
        }}>
        <defs>
          <pattern id="graph-dots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.7" fill="#d3dccf" opacity="0.65" /></pattern>
          <radialGradient id="lavender-glow"><stop offset="0%" stopColor="#e9dff5" stopOpacity="0.53" /><stop offset="100%" stopColor="#e9dff5" stopOpacity="0" /></radialGradient>
          <radialGradient id="sage-glow"><stop offset="0%" stopColor="#e0ebdc" stopOpacity="0.64" /><stop offset="100%" stopColor="#e0ebdc" stopOpacity="0" /></radialGradient>
          <radialGradient id="sand-glow"><stop offset="0%" stopColor="#f3e9d8" stopOpacity="0.5" /><stop offset="100%" stopColor="#f3e9d8" stopOpacity="0" /></radialGradient>
        </defs>
        <rect width={W} height={H} fill="#fafbf7" />
        <rect width={W} height={H} fill="url(#graph-dots)" />
        <g transform={`translate(${W / 2 + view.x} ${H / 2 + view.y}) scale(${view.k}) translate(${-W / 2} ${-H / 2})`}>
          {nodes.length > 20 && !focusId && <g aria-hidden="true"><ellipse cx="458" cy="252" rx="235" ry="223" fill="url(#lavender-glow)" /><ellipse cx="770" cy="281" rx="215" ry="295" fill="url(#sage-glow)" /><ellipse cx="181" cy="385" rx="220" ry="275" fill="url(#sand-glow)" /></g>}
          {settings.connections && edges.map((edge, index) => {
            const a = layout.get(edge.source);
            const b = layout.get(edge.target);
            if (!a || !b) return null;
            const path = curve(a, b, index);
            const isActive = edge.source === activeId || edge.target === activeId;
            const isHovered = hoveredEdge === index;
            return <g key={`${edge.source}-${edge.target}`} onMouseEnter={() => setHoveredEdge(index)} onMouseLeave={() => setHoveredEdge(null)}>
              <path d={path.d} fill="none" stroke={isActive && settings.highlight ? '#ad93c5' : '#b9c9b9'} strokeWidth={isHovered ? 2.2 : isActive && settings.highlight ? 1.65 : 1.05}
                strokeOpacity={isHovered || isActive && settings.highlight ? 0.86 : 0.65} strokeDasharray={edge.relation === 'is related to' ? '4 5' : undefined} />
              <path d={path.d} fill="none" stroke="transparent" strokeWidth="11"><title>{`${nodes.find((node) => node.id === edge.source)?.name} ${edge.relation} ${nodes.find((node) => node.id === edge.target)?.name}`}</title></path>
              {isHovered && !dragging && <text x={path.x} y={path.y - 6} textAnchor="middle" fill="#56614e" fontSize="12" fontFamily="DM Sans, sans-serif" stroke="#fafbf7" strokeWidth="6" paintOrder="stroke" pointerEvents="none">{edge.relation}</text>}
            </g>;
          })}
          {nodes.map((node, index) => {
            const point = layout.get(node.id)!;
            const color = palette[node.type];
            const selected = node.id === selectedId;
            const emphasized = emphasis.has(node.id);
            const dimmed = emphasis.size > 0 ? !emphasized : settings.highlight && activeId && connected.size > 1 && !connected.has(node.id);
            return <motion.g key={node.id} transform={`translate(${point.x} ${point.y})`} className={`graph-node ${selected ? 'selected' : ''}`} data-node={node.id}
              initial={{ opacity: 0 }} animate={{ opacity: dimmed ? (emphasis.size > 0 ? 0.38 : 0.73) : 1 }} transition={{ duration: reduceMotion ? 0 : 0.3, delay: reduceMotion ? 0 : index * 0.009 }}
              role="button" tabIndex={0} aria-label={`${node.name}, ${typeLabels[node.type]}. ${ui.graph.nodeHint}`} aria-pressed={selected}
              onMouseEnter={() => setHovered(node.id)} onMouseLeave={() => setHovered(null)}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(node); } }}>
              <title>{node.name}: {node.subtitle}</title>
              <circle r={node.radius + 10} fill="transparent" />
              {emphasized && !selected && <circle r={node.radius + 7} fill="none" stroke={color.ink} strokeWidth="1.4" strokeOpacity="0.55" strokeDasharray="3 4" pointerEvents="none" />}
              {selected && <>
                <circle r={node.radius + 8} fill={color.soft} stroke={color.stroke} strokeWidth="1" strokeOpacity="0.6" />
                <motion.circle r={node.radius + 13} fill="none" stroke={color.stroke} strokeWidth="1" initial={{ opacity: 0.2 }}
                  animate={{ opacity: reduceMotion ? 0.35 : [0.15, 0.55, 0.15] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }} />
              </>}
              <circle className="node-core" r={node.radius} fill={selected ? node.type === 'author' ? '#a488c2' : node.type === 'concept' ? '#81a88b' : '#c8a672' : color.fill} stroke={selected ? color.ink : schoolPalette[node.school].ink} strokeWidth={selected ? 1.3 : 2} />
              {node.type === 'author'
                ? <text textAnchor="middle" dominantBaseline="central" fill={selected ? '#ffffff' : color.ink} fontSize={node.radius * 0.64} fontWeight="600" fontFamily="Manrope, sans-serif" pointerEvents="none">{node.initials}</text>
                : node.type === 'method'
                  ? <path d="M0 -6.5 6.5 0 0 6.5 -6.5 0Z" fill="none" stroke={selected ? '#ffffff' : color.ink} strokeWidth="1.2" pointerEvents="none" />
                  : <g fill="none" stroke={selected ? '#ffffff' : color.ink} strokeWidth="1.15" strokeLinecap="round" pointerEvents="none"><path d="M0 -7C0 -2 -2 0 -7 0C-2 0 0 2 0 7C0 2 2 0 7 0C2 0 0 -2 0 -7Z" /><path d="M6 -8v4m-2-2h4" /></g>}
              {settings.labels && <text className="graph-node-label" textAnchor="middle" y={node.radius + 20} fill={selected ? '#564169' : node.type === 'author' ? '#655972' : '#596a59'}
                fontSize={selected ? 15.5 : 14} fontFamily="DM Sans, sans-serif" fontWeight={selected ? '600' : '450'} stroke="#fafbf7" strokeWidth="3.5" paintOrder="stroke" strokeLinejoin="round" pointerEvents="none">
                {(node.lines || [node.name]).map((line, i) => <tspan key={line} x="0" dy={i ? 17 : 0}>{line}</tspan>)}
              </text>}
            </motion.g>;
          })}
          {pathPoints.length > 1 && <g className="graph-path" pointerEvents="none" aria-hidden="true">
            {pathPoints.slice(1).map((item, index) => { const a = pathPoints[index].point; const b = item.point; const seg = curve(a, b, edges.findIndex((edge) => (edge.source === pathPoints[index].id && edge.target === item.id) || (edge.target === pathPoints[index].id && edge.source === item.id))); return <path key={`${pathPoints[index].id}-${item.id}`} d={seg.d} fill="none" stroke="#345b43" strokeWidth="3" strokeOpacity="0.85" strokeLinecap="round" />; })}
            {pathPoints.map((item, index) => { const r = (nodes.find((node) => node.id === item.id)?.radius ?? 18) * 0.72; return <g key={item.id} transform={`translate(${item.point.x + r} ${item.point.y - r})`}><circle r="8.5" fill="#345b43" stroke="#fafbf7" strokeWidth="2" /><text textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontSize="9" fontWeight="700" fontFamily="Manrope, sans-serif">{index + 1}</text></g>; })}
          </g>}
        </g>
      </svg>

      {nodes.length === 0 && <div className="graph-empty"><Network size={35} strokeWidth={1.2} /><h3>{ui.graph.emptyTitle}</h3><p>{ui.graph.emptyBody}</p><button className="button button-secondary" onClick={onReset}>{ui.actions.resetFilters}</button></div>}

      <div className="graph-controls">
        <div className="zoom-controls"><button aria-label={ui.graph.zoomOut} onClick={() => zoom(-0.15)} disabled={view.k <= 0.45}><Minus size={16} /></button><button className="zoom-value" onClick={resetView} title={ui.graph.resetZoom}>{Math.round(view.k * 100)}%</button><button aria-label={ui.graph.zoomIn} onClick={() => zoom(0.15)} disabled={view.k >= 2.6}><Plus size={16} /></button></div>
        <button className="graph-control-button" aria-label={ui.graph.fitToView} title={ui.graph.fitToView} onClick={resetView}><Scan size={17} /></button>
        <button className="graph-control-button" aria-label={expanded ? ui.graph.exitExpand : ui.graph.expand} title={expanded ? ui.graph.exitExpand : ui.graph.expand} onClick={onExpand}>{expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
      </div>
      <span className="graph-gesture-hint">{ui.graph.gestureDrag} <i /> {ui.graph.gestureZoom}</span>
      <button className="minimap" aria-label={ui.graph.minimap} title={ui.graph.minimap} onClick={(event) => {
        if (event.detail === 0) { resetView(); return; }
        const mini = event.currentTarget.querySelector('svg');
        const matrix = mini?.getScreenCTM();
        if (!mini || !matrix) return;
        const point = mini.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
        const world = point.matrixTransform(matrix.inverse());
        setView((current) => ({ ...current, x: (W / 2 - world.x) * current.k, y: (H / 2 - world.y) * current.k }));
      }}>
        <svg viewBox={`-30 -20 ${W + 60} ${H + 40}`} aria-hidden="true">
          {edges.map((edge) => { const a = layout.get(edge.source); const b = layout.get(edge.target); return a && b ? <line key={`${edge.source}-${edge.target}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#d5ddd0" strokeWidth="5" /> : null; })}
          {nodes.map((node) => { const point = layout.get(node.id)!; return <circle key={node.id} cx={point.x} cy={point.y} r={node.id === selectedId ? 18 : 11} fill={schoolPalette[node.school].ink} />; })}
          <rect x={W / 2 + (-W / 2 - view.x) / view.k} y={H / 2 + (-H / 2 - view.y) / view.k} width={W / view.k} height={H / view.k} fill="#648768" fillOpacity="0.03" stroke="#8aa488" strokeWidth="10" rx="20" />
        </svg>
      </button>
    </div>
  );
}