import { useState } from 'react';
import type { AtlasNode } from '../data/atlas';
import { useI18n, type AtlasBlueprint } from '../i18n';

/**
 * Plano — exploded technical drawing of a method, translating the BL00D.MONEY
 * Arsenal pattern (blueprint sheet, numbered callouts, explode toggle).
 * Four drawing kinds, one sheet. Selecting a part highlights it in both the
 * drawing and the parts list; parts can jump back to their node on the map.
 */

const ACC = '#b7f04a';
const LN = '#d9e8dc';
const DIM = 'rgba(217,232,220,.45)';

function Callout({ x, y, n, active }: { x: number; y: number; n: number; active: boolean }) {
  return <g>
    <circle cx={x} cy={y} r={11} fill={active ? ACC : '#0b2e2a'} stroke={active ? ACC : LN} strokeWidth={1} />
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={10} fontFamily="'IBM Plex Mono', monospace" fill={active ? '#0b2e2a' : LN}>{n}</text>
  </g>;
}

function Drawing({ blueprint, active, exploded, onSelect }: { blueprint: AtlasBlueprint; active: number; exploded: boolean; onSelect: (index: number) => void }) {
  const { ui } = useI18n();
  const t = ui.inst;
  const parts = blueprint.parts;
  const gap = exploded ? 26 : 0;
  const move = (dx: number, dy: number) => ({ transform: `translate(${exploded ? dx : 0}px, ${exploded ? dy : 0}px)`, transition: 'transform .8s cubic-bezier(.6,0,.2,1), opacity .4s' });

  if (blueprint.kind === 'layers') {
    // CLA: four bands widening as they deepen, like strata.
    return <svg className="inst-bp-svg" viewBox="0 0 620 400" role="img" aria-label="CLA">
      {parts.map((part, index) => {
        const y = 46 + index * (74 + gap);
        const inset = 120 - index * 32;
        const isActive = active === index;
        return <g key={part.title} style={move(0, 0)} opacity={active === -1 || isActive ? 1 : 0.45} onClick={() => onSelect(index)}>
          <polygon points={`${inset},${y} ${620 - inset - 60},${y} ${620 - inset - 90},${y + 52} ${inset + 30},${y + 52}`} fill={isActive ? 'rgba(183,240,74,.14)' : 'rgba(217,232,220,.05)'} stroke={isActive ? ACC : LN} strokeWidth={isActive ? 1.6 : 1.1} style={{ cursor: 'pointer' }} />
          <line x1={620 - inset - 60} y1={y} x2={566} y2={y} stroke={DIM} strokeDasharray="3 3" />
          <Callout x={578} y={y} n={index + 1} active={isActive} />
          <text x={310} y={y + 30} textAnchor="middle" fontSize={12} letterSpacing={2} fill={isActive ? ACC : LN} fontFamily="'IBM Plex Mono', monospace">{part.title.toUpperCase()}</text>
        </g>;
      })}
      <text x={24} y={30} fontSize={9} fill={DIM} fontFamily="'IBM Plex Mono', monospace" letterSpacing={2}>{t.bpDepth}</text>
    </svg>;
  }

  if (blueprint.kind === 'pillars') {
    return <svg className="inst-bp-svg" viewBox="0 0 620 400" role="img" aria-label="Six Pillars">
      <line x1={30} y1={330} x2={590} y2={330} stroke={LN} strokeWidth={1.4} />
      <line x1={30} y1={60} x2={590} y2={60} stroke={DIM} strokeDasharray="14 4 2 4" />
      {parts.map((part, index) => {
        const w = 64;
        const x = 52 + index * (w + 24 + (exploded ? 8 : 0)) - (exploded ? index * 4 : 0);
        const h = 170 + index * 14;
        const y = 330 - h - (exploded ? index * 7 : 0);
        const isActive = active === index;
        return <g key={part.title} opacity={active === -1 || isActive ? 1 : 0.45} onClick={() => onSelect(index)} style={{ cursor: 'pointer', transition: 'opacity .4s' }}>
          <rect x={x} y={y} width={w} height={h} fill={isActive ? 'rgba(183,240,74,.14)' : 'rgba(217,232,220,.05)'} stroke={isActive ? ACC : LN} strokeWidth={isActive ? 1.6 : 1.1} style={{ transition: 'all .8s cubic-bezier(.6,0,.2,1)' }} />
          <rect x={x - 5} y={y - 12} width={w + 10} height={10} fill="none" stroke={isActive ? ACC : LN} />
          <Callout x={x + w / 2} y={356} n={index + 1} active={isActive} />
        </g>;
      })}
    </svg>;
  }

  if (blueprint.kind === 'horizons') {
    const curves = [
      'M 40 120 C 200 128, 340 180, 580 300',
      'M 40 310 C 210 300, 300 190, 420 205 C 490 214, 540 260, 580 300',
      'M 40 330 C 240 322, 400 240, 580 92',
    ];
    const offsets = [[0, -16], [0, 0], [0, 16]];
    return <svg className="inst-bp-svg" viewBox="0 0 620 400" role="img" aria-label="Three Horizons">
      <line x1={40} y1={352} x2={590} y2={352} stroke={DIM} />
      <line x1={40} y1={40} x2={40} y2={352} stroke={DIM} />
      {curves.map((d, index) => {
        const isActive = active === index;
        return <g key={d} style={move(offsets[index][0], offsets[index][1])} opacity={active === -1 || isActive ? 1 : 0.4} onClick={() => onSelect(index)}>
          <path d={d} fill="none" stroke={index === 2 ? ACC : LN} strokeWidth={isActive ? 2.6 : 1.6} strokeDasharray={index === 1 ? '6 5' : undefined} style={{ cursor: 'pointer' }} />
          <path d={d} fill="none" stroke="transparent" strokeWidth={18} style={{ cursor: 'pointer' }} />
        </g>;
      })}
      <Callout x={560} y={318} n={1} active={active === 0} />
      <Callout x={372} y={178} n={2} active={active === 1} />
      <Callout x={560} y={80} n={3} active={active === 2} />
      <text x={48} y={32} fontSize={9} fill={DIM} fontFamily="'IBM Plex Mono', monospace" letterSpacing={2}>{t.bpPresence}</text>
      <text x={540} y={372} fontSize={9} fill={DIM} fontFamily="'IBM Plex Mono', monospace" letterSpacing={2}>{t.bpTime}</text>
    </svg>;
  }

  // triangle
  const verts: [number, number][] = exploded ? [[310, 52], [92, 332], [528, 332]] : [[310, 84], [128, 310], [492, 310]];
  return <svg className="inst-bp-svg" viewBox="0 0 620 400" role="img" aria-label="Futures Triangle">
    <polygon points={verts.map((v) => v.join(',')).join(' ')} fill="rgba(217,232,220,.04)" stroke={DIM} strokeDasharray="5 5" style={{ transition: 'all .8s cubic-bezier(.6,0,.2,1)' }} />
    {verts.map(([x, y], index) => {
      const isActive = active === index;
      return <g key={index} opacity={active === -1 || isActive ? 1 : 0.45} onClick={() => onSelect(index)} style={{ cursor: 'pointer' }}>
        <circle cx={x} cy={y} r={44} fill={isActive ? 'rgba(183,240,74,.14)' : '#0b2e2a'} stroke={isActive ? ACC : LN} strokeWidth={isActive ? 1.8 : 1.2} style={{ transition: 'all .8s cubic-bezier(.6,0,.2,1)' }} />
        <Callout x={x} y={y} n={index + 1} active={isActive} />
      </g>;
    })}
    <circle cx={310} cy={235} r={3} fill={DIM} />
  </svg>;
}

export default function Blueprint({ node, onClose, onGoNode }: { node: AtlasNode; onClose: () => void; onGoNode: (id: string) => void }) {
  const { ui, blueprints, nodeById } = useI18n();
  const t = ui.inst;
  const blueprint = blueprints.get(node.id);
  const [active, setActive] = useState(0);
  const [exploded, setExploded] = useState(false);
  if (!blueprint) return null;
  const part = blueprint.parts[active];

  return <section className="inst-blueprint" role="dialog" aria-modal="true" aria-label={`${t.bpKicker}: ${node.name}`}>
    <div className="inst-bp-head">
      <span className="tiny">{t.bpKicker} · {blueprint.code}</span>
      <span className="inst-bp-seg" role="group" aria-label={t.bpExploded}>
        <button aria-pressed={!exploded} onClick={() => setExploded(false)}>{t.bpAssembled}</button>
        <button aria-pressed={exploded} onClick={() => setExploded(true)}>{t.bpExploded}</button>
      </span>
      <button className="tiny inst-bp-x" onClick={onClose}>{t.closeUpper}</button>
    </div>
    <div className="inst-bp-body">
      <div className="inst-bp-left">
        <h2>{node.name}</h2>
        <p className="inst-bp-sub">{node.subtitle} · {node.publicationYear}</p>
        <div className="inst-bp-draw"><Drawing blueprint={blueprint} active={active} exploded={exploded} onSelect={setActive} /></div>
        <p className="inst-hint">{t.bpHint}</p>
      </div>
      <div className="inst-bp-right">
        <h3 className="tiny">{t.bpParts} · {blueprint.parts.length}</h3>
        <ol className="inst-bp-parts">
          {blueprint.parts.map((item, index) => <li key={item.title}>
            <button aria-pressed={active === index} onClick={() => setActive(index)}>
              <i>{String(index + 1).padStart(2, '0')}</i><span>{item.title}</span>
            </button>
          </li>)}
        </ol>
        {part && <article className="inst-bp-detail" key={part.title}>
          <h4>{part.title}</h4>
          <p>{part.body}</p>
          {part.example && <p className="inst-bp-example"><span>{t.bpExample}</span>{part.example}</p>}
          {part.link && nodeById.get(part.link) && <button className="inst-cta" onClick={() => { onGoNode(part.link!); onClose(); }}>{t.bpGoNode}: {nodeById.get(part.link)!.name} →</button>}
        </article>}
      </div>
    </div>
  </section>;
}
