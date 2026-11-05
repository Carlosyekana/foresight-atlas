# Reanálisis de bl00d.money y refinamientos del instrumento (2026-11)

> Segunda pasada. La primera ([`01`](./01-ingenieria-inversa-bl00d-money.md)) no pudo leer el JS de la
> referencia. Esta sí: se descargó el HTML (≈1.7 MB), se separó en `app.js` (274 KB), CSS (63 KB) y
> datos (1.4 MB) y se leyó el motor. Además se observó el sitio vivo (modos, clic en entidad).
> Lo que sigue **corrige y completa** al doc 01.

## 1. Errata del doc 01

| Doc 01 decía | Realidad (medida en el JS) |
|---|---|
| «Sin framework detectable» | Carga `d3.min.js` y usa `d3-force` (layout), `d3-zoom` (cámara), `d3-scale/array`. Todo lo demás es JS propio inline. |
| Zoom semántico de 3 niveles | **4**: `01 SYSTEM · 02 ORGANIZATION · 03 TRANSACTION · 04 EVIDENCE`. Con foco, nunca baja de 02; umbrales de `k`: <.9, <1.8, <3. |
| Modo ORBIT «[inferido]» | Confirmado, y es **el modo al que se salta al hacer clic** en una entidad (desde NETWORK, CLUSTERS o FLOW). |
| Intro = fundido de UI | Es un **dial**: un anillo que se llena con 60 marcas mientras los nodos «entran» como cuentas (1.5 s) y luego **estallan** hacia la red (≈2.3 s, escalonado por rango: 7 ms × rango). |
| Datos como «JSON de varios MB» | Además lleva **posiciones precalculadas** (`D.pos`) con clave de validez; si no coinciden se recalcula la simulación (420 ticks). Arranque inmediato. |
| — | Existe un modo **HOLDINGS** bipartito (gestores ↔ empresas) y **CASES** con su propia simulación local. |

## 2. Mecánicas de la referencia que no estaban documentadas

1. **Clic = reorganización.** `select(n)` → `mode='orbit'` → `layoutOrbit(n)`: vecinos directos agrupados por
   tipo en sectores proporcionales (mín. .55 rad), radio `80 + total·9` (180–360), alternando +34 px; bucle de hasta 120
   pasadas que empuja radialmente (+9) cualquier etiqueta cuya caja choque con otra o con la del centro. Segundo nivel a
   `Rmax+190`, junto a su ancla. Alfa por nodo: foco/n1 = 1, n2 = .32, resto = .07.
2. **Etiquetas en píxeles de pantalla**, no escaladas: se ordenan (forzadas → por rango), se miden con `measureText` y
   las opcionales solo entran si caben y no pisan otra caja ni salen del carril entre riel y dossier. Las forzadas
   (foco, vecinos, hover) se dibujan siempre, truncadas con «…» si hace falta. **`NAMES · OFF` apaga solo las opcionales.**
3. **Segunda línea bajo cada vecino**: verbo de la relación + importe en mono (el importe en amarillo señal).
4. **Aristas con semántica**: curvas cuadráticas; punteadas si `st==='reported'`; flecha al 86 %; barra (⊣) si la
   relación es de oposición; grosor por importe en las activas; *chips* de valor sobre la línea con colocación sin colisión.
5. **Familia de relación** derivada por regex del verbo (`fam()`: own/money/politics/role/tech/contract) → 7 colores.
6. **Giro lento** de toda la red en reposo (θ += dt·0.0085 rad/s), pausado al apuntar un nodo; HUD muestra θ.
7. **Micro-nodos de evidencia** (hechos y fuentes) como puntos que cuelgan de cada relación: la base de datos «se ve».
8. **Partículas** sobre las rutas de dinero principales (apagadas con `prefers-reduced-motion`).
9. **Hash `#slug`** vía `history.replaceState` al seleccionar; limpio al deseleccionar.
10. **Cámara**: `fitT` encuadra dentro del carril (`W-224-360-60`), con variantes móvil/foco/holdings.
11. Formas por tipo (círculo, rombo, anillo, círculo con punto) y *glow* (`shadowBlur`) en nodos > 3.2 px.
12. Subida de pistas: formulario con función de borde y verificación anti-bot (claves públicas por diseño; **no se copian**).

## 3. Matriz de brechas → estado tras esta entrega

| # | Mecánica | Estado previo en Atlas | Ahora |
|---|---|---|---|
| G1 | Clic = órbita | Solo zoom; la órbita era un modo manual | ✅ desde RED; enlaces `?node=` abren en órbita |
| G2 | Encuadre en el carril libre | Ancla fija al 40 % → nodo pegado al riel; ÓRBITA sin reencuadre (bug) | ✅ `fitView` sobre `.inst-rail`/`.inst-dossier` medidos |
| G3 | Etiquetas en pantalla + colisión | Texto dentro del grupo escalado: crecía y se solapaba | ✅ `engine/labels.ts` |
| G4 | OFF no apaga forzadas | OFF ocultaba todo | ✅ forzadas siempre |
| G5 | Verbo bajo el vecino | No | ✅ |
| G6 | Punteada = no verificada | No | ✅ punteada = asociación editorial; leyenda en el riel |
| G7 | Flecha de dirección | No | ✅ en aristas activas |
| G8 | Anillos y rótulos «TIPO · n» | Elipses fijas [185,305,395] | ✅ radios reales del layout |
| G9 | Alfa por anillo (1 / .34 / .07) | Atenuado binario .16 | ✅ |
| G10 | 4 niveles de zoom | 3 (y «Constelación» en minúsculas) | ✅ + nivel `FUENTE` ES/EN/PT |
| G11 | Hash sincronizado | Solo lectura al cargar | ✅ `replaceState` |
| G12 | Giro lento | Solo deriva por nodo | ✅ pausa al hover; respeta reduced-motion |
| G13 | Intro dial → estallido | Tagline | ✅ dial silencioso, tesis al estallar; clic salta |
| G14 | Chips de valor sobre líneas | — | ⏳ el inspector cubre el caso; pendiente |
| G15 | Holdings bipartito, micro-nodos, partículas | — | ⏳ sin equivalente de contenido en el Atlas |
| G16 | Posiciones precalculadas | Posiciones ya estáticas en `atlas.ts` | n/a |

**Decisiones propias (desviaciones)**: la selección solo entra en órbita desde RED y no desde ESCUELAS/CRONOLOGÍA
(el modo es una pregunta elegida por el lector); con un Hilo o ruta de la guía activos tampoco, porque la red completa
es el contexto de lectura.

## 4. Defectos del prototipo hallados y corregidos

- ÓRBITA no reencuadraba la cámara: el centro quedaba bajo el dossier.
- La cámara anclaba al 40 % del lienzo → el nodo terminaba junto al riel.
- Etiquetas dentro del SVG escalado: crecían con el zoom y se pisaban.
- `Math.random` ausente, pero la órbita anterior era fija; ahora el jitter es determinista (`unitHash`).
- «Constelación» sin mayúsculas.
- Cabecera de `Instrumento.tsx` con «Pendiente: localizar…» obsoleta; `exitPrototype` → `goClassic`.

## 5. Pendientes: estado

- ✅ Órbitas densas: `fitView` acepta `padX/padY` (170/120); la órbita de 15 vecinos cabe en el carril. Coste: zoom menor (×0.42) y algunos nombres truncados con «…» en el borde izquierdo.
- ✅ Chips de relación (G14): en el nivel 04 FUENTE el verbo de cada relación del nodo activo aparece sobre la línea, solo donde hay sitio.
- ✅ Tests: `npm run check:engine` (73 órbitas, etiquetas forzadas, encuadre válido).
- ◐ Rendimiento: reposo a ~15 fps y sin trabajo con la pestaña oculta. El re-render completo por frame sigue; para cientos de entidades hace falta canvas (doc 03).
- ➖ Holdings, micro-nodos de evidencia y partículas: no aplican al contenido del Atlas; documentados como referencia para Yekana.
- ➖ Cifras 36/62 en el cuerpo de los docs 00/01: se conservan como registro histórico, con errata al inicio.
- ⚠️ Animaciones (intro, vuelos de cámara) verificadas solo en estado final: el panel oculto limita `requestAnimationFrame`. Revisar a mano.

## 6. Archivos tocados

`src/instrument/engine/{layout,labels,camera}.ts` (nuevos) · `src/instrument/Instrumento.tsx` ·
`src/instrument/instrumento.css` · `src/i18n/{types,ui.es,ui.en,ui.pt}.ts` (clave `zoomSource`, mayúsculas) · `scripts/check-engine.ts` · `package.json`.
