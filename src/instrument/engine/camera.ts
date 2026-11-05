/**
 * Cámara del instrumento — pura. Modelo idéntico al `<g transform>` del SVG:
 *
 *   pantalla = W/2 + k·(mundo − W/2 + view.x)        (igual en Y con H/2)
 *
 * `view.x/y` están en unidades de mundo (no de pantalla), así el zoom ancla bien
 * en cualquier punto sin recalcular traslaciones.
 */
import type { Point } from './layout';

export interface View { k: number; x: number; y: number }
export interface World { w: number; h: number }
/** Rectángulo visible (sin rail ni dossier ni cabecera) en unidades del viewBox. */
export interface Lane { left: number; right: number; top: number; bottom: number }

export const K_MIN = 0.3;
export const K_MAX = 2.8;
export const clampK = (k: number) => Math.min(K_MAX, Math.max(K_MIN, k));

export function toScreen(point: Point, view: View, world: World): Point {
  return { x: world.w / 2 + view.k * (point.x - world.w / 2 + view.x), y: world.h / 2 + view.k * (point.y - world.h / 2 + view.y) };
}

export interface FitOptions { pad?: number; padX?: number; padY?: number; minK?: number; maxK?: number }

/**
 * Vista que encuadra `points` dentro de `lane`, centrados. Es lo que evita que el
 * foco quede tapado por el dossier o pegado al riel: se encuadra el carril libre,
 * no el lienzo entero.
 */
export function fitView(points: readonly Point[], lane: Lane, world: World, options: FitOptions = {}): View {
  const { pad = 70, minK = K_MIN, maxK = 2.2 } = options;
  const padX = options.padX ?? pad; const padY = options.padY ?? pad;
  if (!points.length) return { k: 0.92, x: 0, y: 0 };
  const xs = points.map((p) => p.x); const ys = points.map((p) => p.y);
  const x0 = Math.min(...xs); const x1 = Math.max(...xs); const y0 = Math.min(...ys); const y1 = Math.max(...ys);
  const laneW = lane.right - lane.left; const laneH = lane.bottom - lane.top;
  const k = Math.min(maxK, Math.max(minK, Math.min(laneW / (x1 - x0 + padX * 2), laneH / (y1 - y0 + padY * 2))));
  const cx = (x0 + x1) / 2; const cy = (y0 + y1) / 2;
  const aimX = (lane.left + lane.right) / 2; const aimY = (lane.top + lane.bottom) / 2;
  return { k, x: (aimX - world.w / 2) / k - (cx - world.w / 2), y: (aimY - world.h / 2) / k - (cy - world.h / 2) };
}

/** Vista que lleva `point` al centro del carril sin cambiar más que lo necesario de zoom. */
export function centerOn(point: Point, k: number, lane: Lane, world: World): View {
  return fitView([point], lane, world, { minK: k, maxK: k });
}

/**
 * Nivel de lectura del zoom (0..3). El zoom deja de ser un porcentaje y pasa a ser
 * una altura de lectura: sistema → constelación → nodo → fuente.
 * Con una entidad enfocada nunca baja de «nodo»; «fuente» es zoom profundo.
 */
export function zoomLevel(k: number, focused: boolean): 0 | 1 | 2 | 3 {
  if (k >= 2.2) return 3;
  if (focused || k >= 1.35) return 2;
  if (k >= 0.95) return 1;
  return 0;
}
