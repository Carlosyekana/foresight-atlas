/**
 * Colocación de etiquetas en ESPACIO DE PANTALLA — pura, sin DOM.
 *
 * Problema que resuelve: si el texto vive dentro del grupo SVG escalado por el zoom,
 * crece y se solapa. bl00d.money dibuja los nombres en píxeles constantes y descarta
 * los opcionales que chocan; aquí se hace lo mismo con una pasada voraz:
 *   1. los *forzados* (selección, vecinos, ruta) se colocan siempre, probando varios lados;
 *   2. los opcionales entran por prioridad solo si caben y no pisan nada.
 */

export interface Box { x: number; y: number; w: number; h: number }
export interface Bounds { left: number; right: number; top: number; bottom: number }

export interface LabelCandidate {
  id: string;
  /** Posición del nodo ya en pantalla. */
  x: number; y: number;
  /** Radio del nodo en pantalla. */
  r: number;
  text: string;
  /** Segunda línea opcional (p. ej. el verbo de la relación). */
  sub?: string;
  fontPx: number;
  /** Menor = antes. Solo ordena; el desempate entre iguales es el orden de entrada. */
  priority: number;
  forced?: boolean;
  /** Lado preferido; si no cabe se prueba el contrario y por último debajo. */
  side?: 'l' | 'r';
}

export interface PlacedLabel {
  id: string;
  text: string; sub?: string;
  x: number; y: number;
  anchor: 'start' | 'end' | 'middle';
  fontPx: number;
  forced: boolean;
  box: Box;
}

export interface PlanOptions {
  bounds: Bounds;
  /** Ancho de un carácter a `fontPx` (monoespaciada: fontPx * 0.6 + tracking). */
  charWidth: (fontPx: number) => number;
  /** Cajas ya ocupadas (rótulos de anillo, controles…). */
  blocked?: readonly Box[];
  gap?: number;
}

const overlaps = (a: Box, b: Box, pad = 2) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

export function truncateTo(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`;
}

export function planLabels(candidates: readonly LabelCandidate[], options: PlanOptions): PlacedLabel[] {
  const { bounds, charWidth, blocked = [], gap = 7 } = options;
  const taken: Box[] = [...blocked];
  const placed: PlacedLabel[] = [];
  const ordered = candidates
    .map((candidate, index) => ({ candidate, index }))
    .sort((a, b) => Number(!!b.candidate.forced) - Number(!!a.candidate.forced) || a.candidate.priority - b.candidate.priority || a.index - b.index);

  for (const { candidate: c } of ordered) {
    if (c.x < bounds.left - 40 || c.x > bounds.right + 40 || c.y < bounds.top - 20 || c.y > bounds.bottom + 20) continue; // fuera del carril: ni se intenta
    const cw = charWidth(c.fontPx);
    const lines = c.sub ? 2 : 1;
    const h = c.fontPx + 3 + (lines - 1) * (c.fontPx * 0.9 + 2);
    const prefer = c.side ?? 'r';
    const tries: Array<'l' | 'r' | 'b'> = [prefer, prefer === 'r' ? 'l' : 'r', 'b'];
    let chosen: PlacedLabel | null = null;

    for (const side of tries) {
      const room = side === 'r' ? bounds.right - (c.x + c.r + gap) : side === 'l' ? c.x - c.r - gap - bounds.left : Math.min(c.x - bounds.left, bounds.right - c.x) * 2;
      const fullChars = Math.max(c.text.length, c.sub?.length ?? 0);
      const maxChars = Math.floor(room / cw);
      // Un forzado se trunca para caber; un opcional solo entra si cabe entero.
      if (!c.forced && maxChars < fullChars) continue;
      if (maxChars < 4) continue;
      const text = truncateTo(c.text, maxChars);
      const sub = c.sub ? truncateTo(c.sub, maxChars) : undefined;
      const w = Math.max(text.length, sub?.length ?? 0) * cw;
      const box: Box = side === 'r' ? { x: c.x + c.r + gap, y: c.y - h / 2 - 1, w, h }
        : side === 'l' ? { x: c.x - c.r - gap - w, y: c.y - h / 2 - 1, w, h }
        : { x: c.x - w / 2, y: c.y + c.r + gap, w, h };
      if (taken.some((other) => overlaps(box, other))) continue;
      chosen = {
        id: c.id, text, sub, forced: !!c.forced, fontPx: c.fontPx, box,
        anchor: side === 'r' ? 'start' : side === 'l' ? 'end' : 'middle',
        x: side === 'r' ? box.x : side === 'l' ? box.x + w : c.x,
        y: box.y + c.fontPx,
      };
      break;
    }

    // Un forzado nunca desaparece: si nada quedó libre, va en su lado preferido aunque pise algo.
    if (!chosen && c.forced) {
      const maxChars = Math.max(4, Math.floor((prefer === 'r' ? bounds.right - c.x - c.r - gap : c.x - c.r - gap - bounds.left) / cw));
      const text = truncateTo(c.text, maxChars);
      const w = text.length * cw;
      const box: Box = prefer === 'r' ? { x: c.x + c.r + gap, y: c.y - h / 2 - 1, w, h } : { x: c.x - c.r - gap - w, y: c.y - h / 2 - 1, w, h };
      chosen = { id: c.id, text, sub: c.sub ? truncateTo(c.sub, maxChars) : undefined, forced: true, fontPx: c.fontPx, box, anchor: prefer === 'r' ? 'start' : 'end', x: prefer === 'r' ? box.x : box.x + w, y: box.y + c.fontPx };
    }
    if (chosen) { placed.push(chosen); taken.push(chosen.box); }
  }
  return placed;
}

/** Caja aproximada de un texto centrado en (x, y): para reservar espacio a rótulos que no pasan por el planificador. */
export function textBox(x: number, y: number, text: string, fontPx: number, charWidth: (fontPx: number) => number): Box {
  const w = text.length * charWidth(fontPx);
  return { x: x - w / 2, y: y - fontPx, w, h: fontPx + 4 };
}
