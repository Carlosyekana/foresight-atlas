/** Comprobación del motor: `npm run check:engine`. Sin dependencias de test. */
import { nodeShapes, edges } from '../src/data/atlas';
import { orbitLayout } from '../src/instrument/engine/layout';
import { planLabels } from '../src/instrument/engine/labels';
import { fitView } from '../src/instrument/engine/camera';

const nodes = nodeShapes.map((s) => ({ id: s.id, type: s.type, name: s.id.replace(/-/g, ' ').toUpperCase() }));
const degree = new Map<string, number>();
edges.forEach((e) => { degree.set(e.source, (degree.get(e.source) ?? 0) + 1); degree.set(e.target, (degree.get(e.target) ?? 0) + 1); });
const hit = (a: number[], b: number[]) => a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1];
let problems = 0; const fail = (m: string) => { problems++; console.error('✗', m); };

for (const n of nodes) {
  const o = orbitLayout({ centerId: n.id, nodes, edges, typeOrder: ['author', 'concept', 'method'], degree });
  if (o.positions.size !== nodes.length) fail(`faltan posiciones: ${n.id}`);
  for (const [id, p] of o.positions) if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) fail(`NaN ${n.id}/${id}`);
  const n1 = nodes.filter((m) => o.tier.get(m.id) === 1);
  const boxes = n1.map((m) => { const p = o.positions.get(m.id)!; const x = p.x - o.center.x; const y = p.y - o.center.y; const w = m.name.length * 6.3 + 12; return x < -8 ? [x - w - 8, y - 13, w, 28] : [x + 8, y - 13, w, 28]; });
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) if (hit(boxes[i], boxes[j])) fail(`solape ${n.id}: ${n1[i].id}/${n1[j].id}`);
  const v = fitView(o.framePoints, { left: 220, right: 600, top: 80, bottom: 600 }, { w: 960, h: 690 }, { padX: 170, padY: 120, maxK: 1.5 });
  if (![v.k, v.x, v.y].every(Number.isFinite)) fail(`fitView inválido ${n.id}`);
}
const cands = Array.from({ length: 40 }, (_, i) => ({ id: `n${i}`, x: 100 + (i % 8) * 40, y: 100 + Math.floor(i / 8) * 8, r: 6, text: `NOMBRE LARGO ${i}`, fontPx: 10, priority: i, forced: i < 12 }));
const placed = planLabels(cands, { bounds: { left: 0, right: 400, top: 0, bottom: 300 }, charWidth: (f) => f * 0.65 });
if (placed.filter((p) => p.forced).length !== 12) fail('se perdió una etiqueta forzada');
const opt = placed.filter((p) => !p.forced);
for (let i = 0; i < opt.length; i++) for (let j = i + 1; j < opt.length; j++) if (hit([opt[i].box.x, opt[i].box.y, opt[i].box.w, opt[i].box.h], [opt[j].box.x, opt[j].box.y, opt[j].box.w, opt[j].box.h])) fail('solape de opcionales');
console.log(problems ? `${problems} problema(s)` : `OK · ${nodes.length} órbitas, etiquetas y cámara`);
process.exit(problems ? 1 : 0);
