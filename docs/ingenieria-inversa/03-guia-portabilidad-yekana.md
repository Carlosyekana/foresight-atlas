# Guía de portabilidad → Yekana (entidades y conexiones)

Objetivo: llevar el «instrumento» (explorador oscuro de entidades/relaciones) a Yekana sin arrastrar nada
específico del Atlas. Lo portable es el **motor** (`src/instrument/engine/`, TypeScript puro, sin dependencias);
lo que se reescribe es el contenido, los tokens y el cableado de UI.

## 1. Qué copiar

| Archivo | Qué hace | Dependencias |
|---|---|---|
| `engine/layout.ts` | `orbitLayout`, `clusterLayout`, `gridCenters`, `timelineLayout`, `dialLayout`, `rotateAround`, `bfsDistances`, `unitHash` | ninguna |
| `engine/labels.ts` | `planLabels` (colocación voraz con colisión en pantalla), `textBox`, `truncateTo` | ninguna |
| `engine/camera.ts` | `fitView`, `centerOn`, `toScreen`, `zoomLevel`, `clampK` | tipo `Point` de layout |

Contrato mínimo de datos: `{id, type, name}` para nodos y `{source, target}` para aristas. Todo lo demás
(escuela, año, referencia) lo inyecta quien llama mediante callbacks (`groupOf`, `yearOf`, `labelWidth`).

## 2. Modelo mental

- **Mundo** 960×690 con `<g transform="translate(W/2 H/2) scale(k) translate(-W/2+x -H/2+y)">`.
  `pantalla = W/2 + k·(p − W/2 + view.x)`; `view` en unidades de mundo.
- **Carril libre** = región entre riel y dossier (medida del DOM, en unidades del viewBox). Encuadrar *el carril*, no el lienzo.
- **Etiquetas fuera del grupo escalado**, en coordenadas de pantalla: tamaño constante y descarte por colisión.
- **Modo = pregunta**: red (¿qué hay?), órbita (¿qué rodea a esto?), agrupación (¿qué bandos?), cronología (¿cuándo?).
- **Clic = el nodo pasa al centro** (órbita) y la URL lo recuerda (`?node=`).

## 3. Receta de integración

1. Copia `engine/`. Define tus `typeOrder` (orden de sectores) y calcula `degree`.
2. Layout por modo → `Map<id, Point>`; anima con un tween propio (easeInOutCubic, 880 ms).
3. Al seleccionar: `orbitLayout({centerId, nodes, edges, typeOrder, degree, labelWidth})` y
   `fitView(orbit.framePoints, lane, WORLD, {pad: 140, maxK: 1.5})`.
4. Opacidad por anillo con `orbit.tier`: 0/1 → 1, 2 → .34, 3 → .07.
5. Candidatos de etiqueta: `forced` = selección, hover, vecinos, ruta; opcionales por grado. `planLabels(..., {bounds: lane})`.
6. Aristas: punteada si no tiene fuente directa; flecha source→target al 84 % en las activas.
7. Zoom: `zoomLevel(k, hayFoco)` → 4 niveles con nombre; añade cadenas i18n.
8. Sincroniza el hash con `history.replaceState` (no `location.hash`: evita `hashchange` y entradas de historial).

## 4. Qué adaptar en Yekana

- **Tokens**: `--bg #0a120d`, señal `#b7f04a`, mono IBM Plex Mono para metadatos/cifras, tabular-nums.
  Colores: Atlas codifica *escuela = color* y *tipo = forma*; Yekana debe elegir su propio par (p. ej. tipo de entidad = color, estado de verificación = trazo).
- **Verbos de relación**: la referencia deriva «familias» por regex (`own/money/politics/role/tech/contract`). Mejor un campo explícito `family` en el dato.
- **Estado de prueba**: reutilizar `reference` presente/ausente → sólido/punteado; si Yekana tiene más grados (`documented/reported/alleged`), mapearlos a trazo.
- **Fuente de verdad**: texto fuera de la estructura, trilingüe, como el Atlas (`content.*.ts` indexados por id).

## 5. Límites y trampas

- **Escala**: SVG con `setPositions` por frame re-renderiza todo. Hasta ~150 nodos es fluido; con cientos, pasar a **canvas 2D**
  (la referencia lo hace) manteniendo el motor igual: solo cambia el render. Mínimo: separar el estado animado en un `useRef`
  y pintar imperativamente.
- **Hit-testing**: con `setPointerCapture` el `click` se redirige al SVG; resolver el objetivo al apretar y actuar al soltar (ya resuelto en `Instrumento.tsx`).
- **`prefers-reduced-motion`**: apaga deriva, giro, intro y vuelos de cámara.
- **Determinismo**: nada de `Math.random` en layouts (usa `unitHash`); si no, la órbita «tiembla» al re-renderizar.
- **Teléfono**: DOM propio (≤760 px), no el mapa encogido (`Phone.tsx`).
- **Medir el carril** requiere el DOM montado: medir en efecto y en `resize`.
- **Derechos**: se adoptan patrones, no textos ni marca de la referencia; no copiar sus claves públicas ni su identidad.

## 6. Verificación mínima antes de portar

Copia también `scripts/check-engine.ts` (`npm run check:engine`) y adáptalo a tus datos. Comprueba:

- Script que, para cada entidad como centro, compruebe: sin NaN, sin cajas de etiqueta solapadas en el primer anillo, `planLabels` no pierde forzadas.
- Probar el nodo de mayor grado y uno aislado (grado 0 → órbita vacía, debe seguir encuadrando el centro).
- Probar enlace profundo `?node=` en frío, con y sin intro.
