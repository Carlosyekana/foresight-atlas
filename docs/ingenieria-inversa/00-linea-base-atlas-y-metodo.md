# Ingeniería inversa — artefacto web de referencia → Foresight Atlas

> **Estado:** línea base completa · **pendiente:** la URL del artefacto de referencia
> **Alcance acordado:** informe de ingeniería inversa + plan de aplicación + prototipo navegable
> **Foco acordado:** cómo el artefacto *presenta y narra* la información (por encima de lo puramente visual)
> **Restricción acordada:** el grafo interactivo sigue siendo el centro de Foresight Atlas

Cuando llegue la URL, este documento se completa con las secciones 4–6 (hallazgos del
artefacto, matriz de traslado y plan por fases) y se construye el prototipo. Lo que sigue
ya está hecho: el método que se va a aplicar y la línea base contra la que se comparará.

---

## 1. Método de ingeniería inversa (7 capas)

Cada hallazgo del artefacto se documentará con **evidencia** (captura, fragmento de
HTML/CSS/JS, medición o comportamiento reproducible), nunca solo con impresiones.

| # | Capa | Qué se extrae | Evidencia típica |
|---|------|---------------|------------------|
| 1 | **Inventario técnico** | Stack detectable, estructura del DOM, fuentes, librerías, assets, peso, peticiones de red | `<head>`, nombres de clases/archivos, cabeceras, timings |
| 2 | **Arquitectura de información** | Modelo mental, rutas/pantallas, jerarquía, qué es primario vs. secundario, cómo se entra y cómo se sale | Mapa de pantallas, árbol de navegación |
| 3 | **Sistema narrativo** ⭐ | Cómo revela la información: orden, ritmo, divulgación progresiva, titular→evidencia→detalle, pasos guiados/scrollytelling, qué permanece visible como contexto, microcopy | Secuencia paso a paso de la experiencia anotada |
| 4 | **Sistema de diseño** | Tokens: color, tipografía (familias, escala, pesos), espaciado, radios, sombras, densidad, retícula | Tabla de tokens medidos (CSS custom properties / computed styles) |
| 5 | **Interacción y movimiento** | Affordances, estados (hover/focus/activo/vacío/carga), feedback, duración y easing de animaciones, gestos, teclado, atajos | Catálogo de microinteracciones con valores |
| 6 | **Modelo de contenido** | Unidades mínimas de información, longitud y tono de textos, cómo cita fuentes, relación texto↔visual | Esquema inferido de datos |
| 7 | **Accesibilidad y rendimiento** | Semántica, ARIA, contraste, `prefers-reduced-motion`, responsive, rendimiento percibido | Auditoría rápida + contraste medido |

⭐ = capa prioritaria según el foco acordado.

**Regla de traslado:** no se copia la piel, se extrae el *principio*. Cada patrón del
artefacto se formula como «principio subyacente → traducción al lenguaje del Atlas»
(ver matriz en la sección 5), respetando derechos del material original: se adoptan
patrones de presentación, no textos, ilustraciones ni marca del artefacto.

---

## 2. Línea base: cómo presenta información Foresight Atlas hoy

### 2.1 Arquitectura (una pantalla-herramienta, no narrativa secuencial)

```
┌──────────────┬────────────────────────────────────────────────────────┐
│ Sidebar 240px│ Topbar 64px · breadcrumb · idioma · exportar           │
│  Marca       ├────────────────────────────────────────────────────────┤
│  EXPLORAR    │ Page heading (~139px) · titular + descripción +       │
│   Grafo      │   «Sorpréndeme» (nodo aleatorio)                        │
│   Autores    ├────────────────────────────────────────────────────────┤
│   Conceptos  │ Tabs Grafo/Lista · resumen «36 nodos · 62 conexiones»  │
│  COLECCIONES ├───────────────────────────────┬────────────────────────┤
│  …           │ Toolbar: buscar (⌘K) · filtros│ DetailPanel 292px      │
│              │ ┌───────────────────────────┐ │  perfil del nodo       │
│  Ayuda       │ │  GRAFO SVG (dot grid)     │ │                        │
│  Workspace   │ │  leyenda · zoom · minimapa│ │                        │
│              │ └───────────────────────────┘ │                        │
│              │ Status bar 33px               │                        │
└──────────────┴───────────────────────────────┴────────────────────────┘
                 AskPanel (la guía IA) sustituye al DetailPanel
```

- **5 páginas** (`graph | authors | concepts | reading | collection`) que en realidad
  son **filtros guardados sobre el mismo espacio de trabajo**: grafo o lista-directorio.
- **Onboarding escondido en un modal** («Sobre este atlas»): pasos numerados 01–0n,
  nota editorial y fuentes. La primera pantalla no enseña a leer el grafo; lo muestra.
- El nodo inicial es fijo (`inayatullah`) y el detalle arranca abierto en escritorio.

### 2.2 Sistema narrativo actual (lo que ya hace bien)

El Atlas ya tiene una tesis narrativa fuerte, aunque concentrada en el panel de detalle
y en la guía IA, no en la pantalla principal:

1. **El grafo es la respuesta** (AskPanel): la prosa acompaña; los nodos que sostienen
   la respuesta se resaltan, el resto retrocede, la vista se encuadra sola sobre ellos
   (`Graph.tsx`: auto-fit a `emphasisIds`) y los recorridos se dibujan con pasos
   numerados 1→n tanto en el panel (`<ol class="ask-path">`) como sobre el grafo.
2. **Anatomía del perfil** (DetailPanel) — divulgación en capas muy editorial:
   eyebrow de tipo → nombre → subtítulo → escuela → descripción → «Enfocar» →
   conexiones con *etiqueta de relación en lenguaje natural* («desarrolló»,
   «se apoya en»… solo 4 visibles, resto tras «Ver todas») → «Empieza aquí»
   (publicación con lomo de libro) → **pregunta para pensar** (`node.question`,
   con filete lateral) → fuente externa → CTA fijo «Guardar en colección».
3. **Microcopy con metáfora de hilo/capítulo**: «Sigue el hilo», «Tu próximo capítulo»,
   «hallazgos por explorar», «Sorpréndeme». El tono es de lectura, no de dashboard.
4. **Contexto persistente**: al enfocar un nodo, sus vecinos se redistribuyen en órbita
   y una píldora recuerda qué se está explorando; el minimapa ancla la posición.

### 2.3 Tokens de diseño medidos (`src/index.css`, `src/data/atlas.ts`)

| Token | Valor |
|---|---|
| Tipografía UI | DM Sans 400–700 |
| Tipografía display | Manrope 400–800 (marca 23px/-1.05px, H1 34px/-1.45px, H2 perfil 21px) |
| Escala de texto | Muy pequeña y densa: 8–12px en la mayoría de la UI (labels 8–9px con tracking 1.2–1.65px en mayúsculas) |
| Verde principal | `#345b43` · oscuro `#2b4735` · tinta `#354238` |
| Superficies | `#ffffff`, sidebar `#f8faf5`, líneas `#e6e9e1`, lienzo del grafo `#fafbf7` |
| Paleta por tipo | Autor lavanda `#e5dcf4/#786095` · Concepto verde `#d9e8dd/#517b60` · Método ámbar `#f3e3cc/#a3814d` (fill/stroke/ink/soft) |
| Retícula del lienzo | Puntos radiales cada 20px (`radial-gradient #d4ddcf80 .6px`) |
| Geometría | Radios 4–8px, bordes 1px, sombras casi imperceptibles (`0 3px 8px #35492b02`) |
| Movimiento | Framer Motion: entradas `opacity/y 10px` en 0.5s (heading), 0.25s en detalle/chat; hovers 0.18–0.2s; respeta `prefers-reduced-motion` |
| Layout | Sidebar fija 240px, panel 292px, workspace `calc(100dvh - 290px)` mín. 510px |
| Iconografía | lucide-react, trazo 1.3–1.9 |

### 2.4 Modelo de contenido

- 36 nodos (14 autores, 22 conceptos/métodos) y 62 aristas con 17 tipos de relación
  verbalizados. Estructura y texto separados por diseño: `atlas.ts` solo tiene ids,
  coordenadas y tipos; todo el texto vive en `i18n/content.{es,en,pt}.ts` y TypeScript
  impide publicar un nodo sin traducir. **Cualquier patrón nuevo que exija texto debe
  nacer trilingüe.**
- Cada nodo ya trae los ingredientes de una narrativa: `subtitle`, `description`,
  `question` (pregunta reflexiva), `publication` (título/año/tipo/URL) y `source`.

### 2.5 Fricciones actuales a contrastar con el artefacto

Hipótesis a validar contra los patrones del referente (no conclusiones):

1. **Entrada fría:** quien llega ve una herramienta completa, no una historia; nada en
   la primera pantalla propone un *recorrido* («empieza por aquí, luego…») fuera del
   modal de ayuda o de preguntarle a la guía.
2. **Jerarquía plana:** el titular de página («Los futuros, conectados.») no cambia con
   el estado; al seleccionar/filtrar/enfocar, la narrativa superior no cuenta qué está
   pasando ni por qué importa lo que se ve.
3. **Densidad tipográfica extrema:** gran parte del significado viaja en texto de
   8–10px (leyenda, status, relaciones), legible pero con poco aire editorial.
4. **El eje temporal está en los datos pero no en la experiencia:** cada nodo tiene
   año de publicación (1967–2018) y la UI nunca lo usa para ordenar ni contar la
   evolución del campo.
5. **Las escuelas (6) son un filtro, no un mapa:** no hay color/territorio ni lectura
   de conjunto («estas son las grandes conversaciones del campo»).
6. **La vista de lista es un directorio**, no una segunda lectura: ordena A–Z o por
   conexiones, sin agrupar ni resumir.

---

## 3. Resultado

Las 7 capas se ejecutaron sobre **https://bl00d.money/** y están documentadas, junto con la
matriz de traslado (T1–T12) y el plan por fases, en
[`01-ingenieria-inversa-bl00d-money.md`](./01-ingenieria-inversa-bl00d-money.md).

El modo instrumento vive en `src/instrument/` tras `#/instrumento`, con puerta desde la
navegación clásica. Nota de peso: con el modo y los textos nuevos el build single-file
sube de ~446 KB a ~623 KB (gzip ~185 KB); si se consolida, hay que decidir entre
fusionarlo con la vista principal (compartiendo `Graph.tsx`) o cargarlo bajo demanda
abandonando el single-file estricto (ver ADR 0002).
