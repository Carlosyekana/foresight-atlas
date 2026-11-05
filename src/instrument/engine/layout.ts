/**
 * Motor de layouts del instrumento — funciones PURAS, sin React ni DOM.
 *
 * Cada layout recibe datos y devuelve `Map<id, Point>` en coordenadas de «mundo».
 * No sabe nada del Atlas: se copia tal cual a otro proyecto (p. ej. Yekana) y se
 * alimenta con sus propias entidades. Ver docs/ingenieria-inversa/03-guia-portabilidad-yekana.md
 */

export type Point = { x: number; y: number };

export interface LayoutNode { id: string; type: string; name: string }
export interface LayoutEdge { source: string; target: string }

/** Hash estable (FNV-1a) → [0,1). Sustituye a Math.random: el layout no «tiembla» al re-renderizar. */
export function unitHash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}

/** Distancia en saltos desde `center` (BFS no dirigido). Los inalcanzables no aparecen. */
export function bfsDistances(edges: readonly LayoutEdge[], center: string): Map<string, number> {
  const adjacency = new Map<string, string[]>();
  const link = (a: string, b: string) => { (adjacency.get(a) ?? adjacency.set(a, []).get(a)!).push(b); };
  edges.forEach((edge) => { link(edge.source, edge.target); link(edge.target, edge.source); });
  const dist = new Map<string, number>([[center, 0]]);
  const queue = [center];
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    for (const next of adjacency.get(current) ?? []) {
      if (!dist.has(next)) { dist.set(next, dist.get(current)! + 1); queue.push(next); }
    }
  }
  return dist;
}

/* ------------------------------------------------------------------ ÓRBITA */

export interface OrbitCaption { type: string; count: number; x: number; y: number }
export interface OrbitLayout {
  positions: Map<string, Point>;
  /** 0 = centro · 1 = vecinos directos · 2 = vecinos de vecinos · 3 = resto (fantasma). */
  tier: Map<string, 0 | 1 | 2 | 3>;
  /** Radios de las guías punteadas (mundo). */
  rings: number[];
  /** Rótulos «TIPO · n» de cada sector del primer anillo. */
  captions: OrbitCaption[];
  /** Puntos que deben quedar a la vista al encuadrar: centro + vecinos directos. */
  framePoints: Point[];
  center: Point;
}

export interface OrbitOptions {
  centerId: string;
  nodes: readonly LayoutNode[];
  edges: readonly LayoutEdge[];
  /** Orden de los sectores del primer anillo. */
  typeOrder: readonly string[];
  /** Grado de cada nodo (para ordenar dentro de un sector). */
  degree: ReadonlyMap<string, number>;
  center?: Point;
  /** Ancho estimado (px) de la etiqueta de un nodo; evita que las etiquetas del primer anillo se pisen. */
  labelWidth?: (id: string) => number;
}

const TAU = Math.PI * 2;

/**
 * Anillos alrededor de una entidad, como el modo ORBIT de bl00d.money:
 * vecinos directos agrupados por tipo en sectores proporcionales a su número,
 * radio creciente con la cantidad y empuje radial hasta que ninguna etiqueta
 * choca con otra ni con la del centro; vecinos de vecinos más afuera,
 * pegados al sector de su ancla; el resto, un anillo exterior fantasma.
 */
export function orbitLayout(options: OrbitOptions): OrbitLayout {
  const { centerId, nodes, edges, typeOrder, degree } = options;
  const center = options.center ?? { x: 480, y: 345 };
  const labelWidth = options.labelWidth ?? ((id: string) => (nodes.find((n) => n.id === id)?.name.length ?? 8) * 6.3 + 12);
  const dist = bfsDistances(edges, centerId);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const tier = new Map<string, 0 | 1 | 2 | 3>();
  nodes.forEach((node) => tier.set(node.id, (Math.min(dist.get(node.id) ?? 3, 3) as 0 | 1 | 2 | 3)));

  const ring1 = nodes.filter((node) => tier.get(node.id) === 1);
  const groups = typeOrder
    .map((type) => ({ type, members: ring1.filter((node) => node.type === type).sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0)) }))
    .filter((group) => group.members.length);
  const total = ring1.length || 1;
  const baseRadius = Math.max(150, Math.min(330, 70 + total * 11));

  // Sectores proporcionales al número de miembros (mín. 0.5 rad), normalizados a una vuelta.
  const rawSpans = groups.map((group) => Math.max(0.5, (group.members.length / total) * TAU));
  const spanScale = TAU / (rawSpans.reduce((sum, span) => sum + span, 0) || TAU);
  let cursor = -Math.PI / 2;
  const slots: { id: string; angle: number; radius: number }[] = [];
  const sectorMid = new Map<string, number>();
  groups.forEach((group, gi) => {
    const span = rawSpans[gi] * spanScale;
    group.members.forEach((node, i) => slots.push({ id: node.id, angle: cursor + (span * (i + 0.5)) / group.members.length, radius: baseRadius + (i % 2) * 34 }));
    sectorMid.set(group.type, cursor + span / 2);
    cursor += span;
  });

  // Empuje radial: cajas de etiqueta (28 px de alto) contra la del centro y entre sí.
  const boxOf = (slot: { id: string; angle: number; radius: number }): [number, number, number, number] => {
    const x = Math.cos(slot.angle) * slot.radius; const y = Math.sin(slot.angle) * slot.radius;
    const w = labelWidth(slot.id);
    return x < -8 ? [x - w - 8, y - 13, w, 28] : [x + 8, y - 13, w, 28];
  };
  const hit = (a: number[], b: number[]) => a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1];
  const centerBox = [8, -16, (byId.get(centerId)?.name.length ?? 10) * 9 + 40, 26];
  for (let pass = 0; pass < 120; pass++) {
    let moved = false;
    const boxes = slots.map(boxOf);
    for (let i = 0; i < slots.length; i++) if (hit(boxes[i], centerBox)) { slots[i].radius += 9; moved = true; boxes[i] = boxOf(slots[i]); }
    for (let i = 0; i < slots.length; i++) for (let j = i + 1; j < slots.length; j++) {
      if (hit(boxes[i], boxes[j])) { slots[j].radius += 9; moved = true; boxes[j] = boxOf(slots[j]); }
    }
    if (!moved) break;
  }

  const positions = new Map<string, Point>();
  const toPoint = (angle: number, radius: number): Point => ({ x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius });
  positions.set(centerId, { ...center });
  const slotAngle = new Map<string, number>();
  slots.forEach((slot) => { positions.set(slot.id, toPoint(slot.angle, slot.radius)); slotAngle.set(slot.id, slot.angle); });
  const maxRadius = slots.reduce((max, slot) => Math.max(max, slot.radius), baseRadius);

  // Segundo nivel: junto al sector de su ancla, con jitter determinista.
  const outer = maxRadius + 170;
  const ring2 = nodes.filter((node) => tier.get(node.id) === 2);
  ring2.forEach((node) => {
    const anchor = edges
      .map((edge) => (edge.source === node.id ? edge.target : edge.target === node.id ? edge.source : null))
      .find((other) => other && tier.get(other) === 1);
    const angle = (anchor ? slotAngle.get(anchor) ?? 0 : unitHash(node.id) * TAU) + (unitHash(node.id) - 0.5) * 0.5;
    positions.set(node.id, toPoint(angle, outer + Math.floor(unitHash(`${node.id}:r`) * 3) * 30));
  });

  // Resto: anillo fantasma exterior, repartido por orden estable.
  const ring3 = nodes.filter((node) => tier.get(node.id) === 3);
  ring3.forEach((node, i) => positions.set(node.id, toPoint((i / (ring3.length || 1)) * TAU - Math.PI / 2, outer + 150)));

  const captions: OrbitCaption[] = groups.map((group) => {
    const angle = sectorMid.get(group.type)!;
    const at = toPoint(angle, maxRadius + 62);
    return { type: group.type, count: group.members.length, x: at.x, y: at.y };
  });

  return {
    positions, tier, rings: [baseRadius, outer], captions, center,
    framePoints: [positions.get(centerId)!, ...ring1.map((node) => positions.get(node.id)!)],
  };
}

/* ------------------------------------------------------------------ AGRUPACIÓN */

export interface ClusterOptions {
  nodes: readonly LayoutNode[];
  /** Grupo de cada nodo. */
  groupOf: (node: LayoutNode) => string;
  /** Orden y centros de los grupos (en mundo). */
  centers: ReadonlyMap<string, Point>;
  /** Filas/columnas se resuelven fuera; aquí solo el empaquetado de cada grupo. */
  baseRadius?: number; perMember?: number; squash?: number;
}

/** Cada grupo en su territorio: los miembros forman un anillo alrededor del centro del grupo. */
export function clusterLayout(options: ClusterOptions): Map<string, Point> {
  const { nodes, groupOf, centers, baseRadius = 46, perMember = 6, squash = 0.82 } = options;
  const map = new Map<string, Point>();
  centers.forEach((center, group) => {
    const members = nodes.filter((node) => groupOf(node) === group);
    const radius = baseRadius + members.length * perMember;
    members.forEach((node, i) => {
      const angle = (i / members.length) * TAU - Math.PI / 2;
      map.set(node.id, { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius * squash });
    });
  });
  return map;
}

/** Centros de una rejilla `cols` × n para repartir grupos sin posiciones a mano. */
export function gridCenters(groups: readonly string[], cols: number, area: { x0: number; x1: number; y0: number; y1: number }): Map<string, Point> {
  const rows = Math.ceil(groups.length / cols);
  const map = new Map<string, Point>();
  groups.forEach((group, i) => {
    const col = i % cols; const row = Math.floor(i / cols);
    map.set(group, {
      x: area.x0 + ((col + 0.5) / cols) * (area.x1 - area.x0),
      y: area.y0 + ((row + 0.5) / rows) * (area.y1 - area.y0),
    });
  });
  return map;
}

/* ------------------------------------------------------------------ CRONOLOGÍA */

export interface TimelineOptions {
  nodes: readonly LayoutNode[];
  /** Año de cada nodo; los que no lo tengan caen en `start`. */
  yearOf: (node: LayoutNode) => number | null;
  /** Carril (eje Y) por tipo. */
  lanes: Readonly<Record<string, number>>;
  start: number; end: number;
  x0?: number; x1?: number; stackGap?: number;
}

/** Eje X = año, un carril por tipo; los coincidentes en año+carril se apilan centrados. */
export function timelineLayout(options: TimelineOptions): { positions: Map<string, Point>; xOf: (year: number) => number } {
  const { nodes, yearOf, lanes, start, end, x0 = 80, x1 = 890, stackGap = 44 } = options;
  const xOf = (year: number) => x0 + ((Math.min(end, Math.max(start, year)) - start) / (end - start)) * (x1 - x0);
  const counts = new Map<string, number>();
  const keyOf = (node: LayoutNode) => `${yearOf(node) ?? start}-${node.type}`;
  nodes.forEach((node) => counts.set(keyOf(node), (counts.get(keyOf(node)) ?? 0) + 1));
  const seen = new Map<string, number>();
  const positions = new Map<string, Point>();
  nodes.forEach((node) => {
    const key = keyOf(node);
    const i = seen.get(key) ?? 0; seen.set(key, i + 1);
    positions.set(node.id, { x: xOf(yearOf(node) ?? start), y: (lanes[node.type] ?? 0) + (i - (counts.get(key)! - 1) / 2) * stackGap });
  });
  return { positions, xOf };
}

/* ------------------------------------------------------------------ DIAL (intro) */

/** Todos los nodos en un anillo, ordenados por (tipo, grado): la «cuenta atrás» antes del estallido. */
export function dialLayout(nodes: readonly LayoutNode[], typeOrder: readonly string[], degree: ReadonlyMap<string, number>, center: Point, radius: number): { positions: Map<string, Point>; order: string[] } {
  const order = [...nodes]
    .sort((a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type) || (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0))
    .map((node) => node.id);
  const positions = new Map<string, Point>();
  order.forEach((id, i) => {
    const angle = (i / order.length) * TAU - Math.PI / 2;
    positions.set(id, { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius });
  });
  return { positions, order };
}

/** Gira un punto alrededor de `center` (la deriva global de la red en reposo). */
export function rotateAround(point: Point, center: Point, angle: number): Point {
  const cos = Math.cos(angle); const sin = Math.sin(angle);
  const dx = point.x - center.x; const dy = point.y - center.y;
  return { x: center.x + dx * cos - dy * sin, y: center.y + dx * sin + dy * cos };
}
