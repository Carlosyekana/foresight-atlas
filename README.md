# Foresight Atlas

Un grafo de conocimiento interactivo que conecta autores, conceptos y métodos de los estudios de futuros. Permite seguir un hilo entre ideas, leer el perfil de cada nodo, guardar hallazgos en colecciones y exportar la vista actual.

**Trilingüe:** español (por defecto), inglés y portugués, con selector en la barra superior.

## Qué incluye

- **36 nodos y 62 conexiones** curados a mano: 14 autores, 22 conceptos y métodos.
- **Tres idiomas completos**: interfaz, nombres de conceptos, descripciones, preguntas y etiquetas de relación. La elección se recuerda en el navegador y actualiza el atributo `lang` del documento.
- **Grafo SVG interactivo** con zoom, paneo, arrastre de nodos, minimapa y vista enfocada sobre un nodo y sus vecinos.
- **Cada conexión explica su porqué**: una frase de contexto por arista en los tres idiomas, visible en el perfil de cada nodo.
- **Hilos**: 4 rutas de lectura curadas sobre conexiones reales (escenarios, crítica, sistemas, futuros experienciales).
- **Planos de métodos**: 4 diagramas técnicos despiezables (Análisis Causal por Capas, Seis Pilares, Tres Horizontes y Triángulo de Futuros) con piezas inspeccionables que enlazan de vuelta al grafo, en los tres idiomas.
- **Modo instrumento oscuro** — **es la portada del Atlas** (la vista clásica clara vive en `#/clasico`, enlazada desde ambas): el grafo a pantalla completa —**vivo** (los nodos derivan con fase propia y la cámara vuela a la entidad al seleccionarla), con **color vivo por escuela y forma por tipo** (● autores · ◆ métodos · ◎ conceptos) y líneas curvas coloreadas— con cuatro aparatos de lectura —red, órbita, escuelas y cronología—, relaciones inspeccionables y los Hilos como expedientes en papel. Tiene paridad con la vista clásica: **guardar entidades y relaciones** (las mismas colecciones), la **guía IA** con piel oscura y **«Sorpréndeme»**. En el teléfono (≤760 px) se convierte en una **historia vertical**: hero con el grafo de fondo y secciones numeradas (el campo, los Hilos, los planos y un índice táctil). La intro cinemática se muestra una vez por sesión y los enlaces profundos (`#/instrumento?node=cla&blueprint=1`, `?thread=critica`) van directos al punto. Nace de la ingeniería inversa documentada en [`docs/ingenieria-inversa/`](docs/ingenieria-inversa/01-ingenieria-inversa-bl00d-money.md) y del [ADR 0002](docs/adr/0002-modo-instrumento-oscuro-hilos-y-contexto-por-arista.md).
- **Vista de lista** ordenable por nombre o por número de conexiones.
- **Filtros** por tipo (autor / concepto / método) y por escuela de pensamiento, más búsqueda con sugerencias (`/` o `Cmd+K`).
- **Colecciones** guardadas en `localStorage` del navegador, sin cuenta ni backend.
- **Exportación** a SVG (imagen vectorial) o JSON (nodos, relaciones y referencias, distinguiendo vínculos con fuente directa de asociaciones editoriales).
- Accesibilidad: navegación por teclado, roles ARIA, respeto por `prefers-reduced-motion`.

## Preguntarle al atlas

Un panel lateral donde se pregunta en lenguaje natural y **el grafo responde**: resalta los nodos que sostienen la respuesta, dibuja recorridos entre ideas con pasos numerados, ajusta los filtros cuando la pregunta es una categoría y ofrece guardar los hallazgos como colección. La prosa acompaña; la respuesta es el grafo.

- **Solo sabe lo que hay en el atlas.** El atlas completo va en el prompt (cabe de sobra: ~7k tokens por idioma), así que no hay embeddings ni base vectorial. Cuando algo no está, lo dice y señala lo más cercano que sí está.
- **Toda cita se valida.** El modelo responde con ids; la app comprueba cada uno contra el atlas y descarta lo que no existe. Un nodo inventado no llega a la pantalla.
- **Responde en 1–2 segundos.** Gemini 3.5 Flash Lite, sin razonamiento interno: el atlas ya está en el prompt y la salida tiene esquema fijo.
- **La clave de Gemini nunca viaja al navegador.** Un Worker de Cloudflare la guarda, limita el uso por IP y por día, y devuelve un plan estructurado. Ver [`worker/README.md`](worker/README.md) para desplegarlo; sin la variable `VITE_ASK_ENDPOINT`, la app se compila sin la guía y todo lo demás funciona igual.

La decisión de arquitectura está razonada en [`docs/adr/0001-capa-semantica-ia.md`](docs/adr/0001-capa-semantica-ia.md).

## Stack

React 19 · TypeScript · Vite 7 · Tailwind CSS 4 · Framer Motion · lucide-react · Cloudflare Workers + Gemini para la guía

La compilación usa `vite-plugin-singlefile`, así que `dist/index.html` es un **único archivo autocontenido** (~672 KB, ~201 KB gzip) que funciona abriéndolo directamente o subiéndolo a cualquier hosting estático.

## Desarrollo

```bash
npm install
npm run dev        # servidor de desarrollo en http://localhost:5173
npm run typecheck  # verificación de tipos
npm run build      # genera dist/index.html
npm run preview    # sirve el build
```

## Estructura

```
src/
  App.tsx                 estado de la aplicación, navegación, filtros, modales
  components/
    Graph.tsx             grafo SVG: layout, zoom/paneo/pinch, minimapa, rutas
  instrument/
    Instrumento.tsx       modo instrumento oscuro: modos, HUD, inspector, Hilos
    Blueprint.tsx         planos despiezables de métodos (patrón «arsenal»)
    Phone.tsx             la historia móvil: scroll narrado en ≤760 px
    instrumento.css       sistema visual del instrumento (todo bajo .inst)
    AskPanel.tsx          la guía: conversación, fichas de nodos, recorridos
    DetailPanel.tsx       perfil del nodo seleccionado y sus conexiones
    Modal.tsx             diálogo accesible con foco atrapado
    NodeMark.tsx          marca visual por tipo de nodo
  ai/
    contract.ts           petición y plan compartidos con el Worker; validación de ids
    prompt.ts             el atlas serializado al prompt del sistema
    client.ts             llamada al Worker desde el navegador
  data/atlas.ts           estructura: ids, posiciones, tipos, enlaces e Hilos
  data/collections.ts     colecciones y relaciones guardadas (compartidas por ambas vistas)
  i18n/
    index.tsx             contexto de idioma y ensamblado del atlas
    types.ts              forma de los diccionarios
    content.{es,en,pt}.ts texto del atlas: nombres, descripciones, relaciones
    ui.{es,en,pt}.ts      texto de la interfaz
  index.css               sistema de estilos
worker/                   endpoint de IA (Cloudflare Worker); ver worker/README.md
```

La **estructura** del grafo y su **texto** están separados a propósito: [`src/data/atlas.ts`](src/data/atlas.ts) no contiene ni una cadena legible, solo ids, coordenadas, tipos y aristas. Todo lo que se lee vive en `src/i18n/`, indexado por esos mismos ids.

### Añadir un nodo

1. Agrega su forma a `nodeShapes` en [`src/data/atlas.ts`](src/data/atlas.ts) (id, tipo, escuela, posición, radio, año y URL de la publicación).
2. Agrega sus aristas a `edges`, usando una `relation` de las ya definidas en `relationKeys`.
3. Agrega su texto con el mismo id en los tres archivos `content.*.ts`, incluida la frase de contexto de cada arista nueva en `edgeContexts` (clave `origen--destino`).

TypeScript exige el paso 3: si falta el id en algún idioma, la compilación falla. No se puede publicar un nodo a medio traducir.

### Añadir un idioma

Duplica `content.*.ts` y `ui.*.ts`, tradúcelos y regístralos en `languages` (en `types.ts`) y en los mapas de `i18n/index.tsx`. No hay que tocar ningún componente.

### Notas de traducción

Los nombres de autores nunca se traducen. Los títulos de publicaciones se mantienen en su idioma original, porque son citas. Los nombres de metodologías ampliamente reconocidas por su denominación en inglés —**Wild Cards**, **Backcasting**, **Horizon Scanning**— también se dejan sin traducir, porque así las nombran quienes las practican en español y portugués. Los términos con traducción asentada sí se traducen: Análisis Causal por Capas, Planificación por Escenarios, Tres Horizontes. Los nombres de conceptos y métodos sí se traducen, y la búsqueda indexa los nombres de **todos** los idiomas: alguien leyendo el atlas en español encuentra igual un nodo escribiendo el término en inglés que ya conoce.

## Nota editorial

Este es un punto de partida curado, no una historia exhaustiva ni neutral de la prospectiva. Un vínculo con un autor indica una contribución, no la invención exclusiva de una idea. Algunas relaciones entre conceptos son asociaciones temáticas editoriales y no afirmaciones históricas. Las agrupaciones por escuela son de navegación, no identidades fijas. Cada perfil enlaza a material fuente, y la exportación JSON marca qué relaciones tienen referencia directa.

## Licencia

MIT — ver [LICENSE](LICENSE). El contenido editorial del atlas enlaza a fuentes de terceros que conservan sus propios derechos.
