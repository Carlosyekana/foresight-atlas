# Ingeniería inversa — BL00D.MONEY → hallazgos y plan para Foresight Atlas

> **Artefacto:** [bl00d.money](https://bl00d.money/) · *«The Genocide Economy, Mapped — Who is
> profiting from Israel's genocidal campaign on the Middle East? A sourced map of the money,
> weapons and people.»* (meta description) · Dominio registrado el 2026-10-01; propio pie del
> artefacto: `DATA BUILT 05.10.2026`.
> **Foco acordado:** cómo presenta y narra la información · **Restricción:** en Foresight Atlas el
> grafo sigue siendo el centro · **Línea base del Atlas:** ver
> [`00-linea-base-atlas-y-metodo.md`](./00-linea-base-atlas-y-metodo.md).

### Método y límites de la evidencia

Se inspeccionaron el HTML completo que sirve el origen (una sola página autocontenida), todo su
CSS inline —que el autor comenta con intención de diseño, p. ej. *«Layout: one full-bleed network
canvas; thin index rail left, dossier right, mode strip bottom. Single dark world by design.»*—,
la estructura del body, el esquema del JSON de datos embebido y el texto renderizado de la
pantalla inicial. El JS de aplicación va tras un JSON de datos de varios MB dentro del mismo
archivo y no fue recuperable íntegro por las herramientas de fetch; donde un comportamiento se
infiere de clases/estados CSS en vez de leerse en el JS, se marca **[inferido]**.

---

## 1. Resumen ejecutivo

**BL00D.MONEY es un instrumento de investigación disfrazado de mapa.** Un único canvas oscuro a
pantalla completa dibuja la red dinero→armas→personas; sobre él flotan, sin cajas, un riel de
filtros a la izquierda, un *dossier* a la derecha y una tira de modos abajo. Su tesis narrativa:

> **No se lee una base de datos: se abre un expediente.** Cada entidad tiene número de caso
> (`COM-00001`), cada relación es una prueba con extracto literal de la fuente y grado de
> verificación (`documented` / `reported`), y las lecturas largas son «case files»: documentos
> de papel —con clip, sellos y pestañas de archivador— que se despliegan sobre el mapa.

Tres decisiones explican casi todo lo que se siente al usarlo, y las tres son trasladables al
Atlas sin copiar su temática ni su tono:

1. **El grafo no está en una tarjeta: es el mundo.** No hay `workspace-shell` con borde ni barra
   de título de página; el chrome flota y se desvanece (transición de opacidad de 1.4 s) durante
   una intro cinemática con botón `»` para saltarla.
2. **Los mismos datos se reorganizan en varios «aparatos de lectura».** Una tira inferior cambia
   el layout del grafo —`NETWORK · ORBIT · CLUSTERS · FLOW · HOLDINGS · TIMELINE` (este último
   deshabilitado con un honesto *«Next round»*)— y el zoom tiene nombre semántico:
   la pantalla inicial anuncia `ZOOM 01 — SYSTEM · ×0.72`.
3. **La relación es la unidad narrativa, no el nodo.** Cada arista trae contexto en una frase,
   importe/porcentaje, fecha y evidencia citable; clicarla abre un inspector flotante. El dossier
   resume además en lenguaje llano («plain») y puede mostrar el *camino* entre dos entidades.

---

## 2. Inventario técnico

| Aspecto | Evidencia |
|---|---|
| Entrega | **Un solo HTML** tras Cloudflare; `<head>` solo carga dos familias de Google Fonts. Sin framework detectable, sin bundles externos en el head; Cloudflare Web Analytics es el único tercer host. |
| Render del grafo | `<canvas id="net" role="img" aria-label="Network map…">` 2D a pantalla completa, `cursor:grab`, clase `.hovering→pointer`. El Atlas usa SVG: en §9 se argumenta por qué *no* migrar a canvas con 36 nodos. |
| Datos | `<script type="application/json" id="data">` embebido en la página (entidades, relaciones, fuentes, armas/casos — esquema en §6). Varios MB: la página *es* la base de datos. |
| Identificadores | Estilo expediente policial: entidades `COM-00001`, `PER-…`, `CTY-00001`, `WPN-00002`; relaciones `REL-V0113`; fuentes `SRC-W0150` con `tier`. |
| Plataforma | `color-scheme:dark`, `viewport-fit=cover` + `env(safe-area-inset-*)` en header/modos; `overscroll-behavior:contain` en overlays; scrollbars ocultas globalmente. |
| Vistas | Una pantalla-mapa + overlays a pantalla completa (`#index`, `#caselist`, `#tips`, `#report`, `#arsenal`) + **un árbol DOM distinto para teléfono** (`#phone`, ≤760 px). |

## 3. Arquitectura de información

```
                        header (flota, pointer-events selectivos)
        BL00D.MONEY          / Search entity…          MAP INDEX ABOUT SUBMIT
┌──────────────┬──────────────────────────────────────┬─────────────────────┐
│ #rail 224px  │  ZOOM 01 — SYSTEM · ×0.72            │  #photo (clip, sello)│
│  Tipos ●n    │  NAMES · OFF | KEY | ALL             │ ┌──────────────────┐│
│  Familias    │  ← BACK                              │ │ #dossier 360px    ││
│  de flujo    │                                      │ │  (gradiente →     ││
│ ┌─drawer───┐ │        CANVAS .net (el mundo)        │ │   transparente)   ││
│ │CASE FILES│ │                                      │ │  WORLD al inicio  ││
│ │▔▔fichas▔▔│ │                       + − ◎ □        │ └──────────────────┘│
│ └──────────┘ │                                      │  X · Y / θ / built   │
│  Leyenda     │  crumbs…        ●NETWORK ○ORBIT …    │                      │
└──────────────┴──────────────────────────────────────┴─────────────────────┘
   #paper asoma        #insp = inspector de relación (flotante, 380px)
   desde el riel       #report / #arsenal / #index / #tips = overlays
```

- **Una sola pantalla**; todo lo demás es overlay que «scrollea bajo el header» —con un truco
  explícito: `#app:has(#tips:not([hidden])) header{background:var(--bg)}` para darle suelo.
- **El estado por defecto del dossier es `WORLD`** (el sistema completo, con su cifra total y su
  desglose), no una entidad arbitraria. La primera lectura es el todo; el nodo llega después.
- **Historial de exploración real:** `#crumbs` (abajo a la izquierda) + botón `← BACK` para
  volver al nodo anterior. Explorar deja rastro y se puede desandar.

## 4. Sistema narrativo — los 12 patrones que hacen el trabajo

Es la capa prioritaria del encargo. Cada patrón: qué hace, su evidencia y el principio que lo sostiene.

**N1 · Intro cinemática, UI que aparece.** `#app.intro` pone riel, dossier, modos, controles y
hasta el header a `opacity:0` con `transition:opacity 1.4s`; solo queda la red y un botón circular
`»` (*Skip intro*). *Principio: primero la tesis visual (la magnitud del sistema), después los
instrumentos. La interfaz se gana la atención tras el golpe de escala.*

**N2 · El chrome flota; nada tiene caja.** El dossier ni siquiera es un panel:
`background:linear-gradient(90deg, transparent, rgba(8,8,8,.86) 14%)` —el texto emerge del
mapa. *Principio: un solo mundo continuo; leer no te saca del grafo.*

**N3 · Zoom semántico nombrado + HUD de instrumento.** `#zoomlbl` anuncia `ZOOM 01 — SYSTEM ·
×0.72`; `#meta` muestra coordenadas del mundo, ángulo del modo (`NETWORK · θ -0.5°`) y fecha de
construcción de los datos. *Principio: el usuario siempre sabe a qué altura está mirando y el
aparato declara su procedencia. El zoom deja de ser un % y pasa a ser un nivel de lectura.*

**N4 · Modos = preguntas, no vistas.** `NETWORK` (¿quién está conectado?), `ORBIT` (¿quién rodea
a este?) **[inferido]**, `CLUSTERS` (¿qué bandos hay?), `FLOW` (¿por dónde pasa el dinero?),
`HOLDINGS` (¿quién posee a quién?, con matriz `.mx` en el dossier), `TIMELINE` deshabilitado.
Cada modo reorganiza el mismo grafo; el botón activo se invierte (fondo claro). *Principio:
cambiar el layout es cambiar la pregunta que el grafo responde.*

**N5 · Densidad de nombres bajo control del lector.** `NAMES · OFF | KEY | ALL`: con cientos de
nodos, etiquetar todo es ruido; etiquetar solo los clave es cartografía. *Principio: la
legibilidad es un dial, no una decisión fija del diseñador.*

**N6 · La cifra que abre, con desglose en bloques.** El dossier `WORLD` y los casos abren con
`.moneystat`: número enorme (30 px, peso 300, amarillo señal), una barra de bloques segmentados
por parte (`.blocks`, `.mparts` con total tabular) y nota al pie. *Principio: titular numérico →
composición → matiz. Primero el «cuánto», luego el «de qué partes».*

**N7 · Relaciones con evidencia, inspeccionables.** Cada relación: familia con color propio,
verbo, `amt`/`pct` tabulares, **una frase de contexto** (`.ctx`), estado `documented/reported` y
evidencias con **extracto literal** (`ev[].ex`) de la fuente. Clicar una arista abre `#insp`
(380 px): `A → B` en dos líneas, el extracto con filete y el enlace. *Principio: la arista es una
afirmación y toda afirmación muestra su prueba en el mismo gesto que la enuncia.*

**N8 · Resumen en lenguaje llano + camino.** `.plain` formula la situación en una frase legible
(con los números en mono amarillo) y `.path` lista el camino entre entidades como botones
monoespaciados subrayados. *Principio: el sistema traduce su propia estructura a una oración;
el lector no tiene que «leer el grafo» para enterarse.*

**N9 · Case files: el relato largo es un objeto físico.** En el riel, un cajón (`.drawer`) de
fichas con pestañas escalonadas «como un catálogo de tarjetas» (comentario del autor): cada
`.file` inclina su pestaña con `perspective rotateX(7deg)` y un `--off` propio. La lista completa
(`#caselist`) son carpetas de papel `#e7e2d3` con pestaña recortada (`clip-path`), titular,
bajada de 3 líneas, metadatos y barra de progreso; al hover se levantan 3 px. El informe
(`#report`) es una hoja de 880 px sobre el mapa oscurecido: cabecera de expediente con retícula de
campos, titular con *highlight* de rotulador (`linear-gradient(transparent 58%, signal 58%)`),
cifras clave en bloques de color alternado, letra capitular con sombra amarilla, gráficos cuyas
barras crecen al hacer scroll (`.rv`, `scaleX 0→1` en 0.9 s), cadena numerada de pasos (`.chain`),
fuentes numeradas y una pestaña vertical pegajosa (`.spine`) que sobresale como separador.
*Principio: el mapa acusa; el expediente demuestra. Dos registros (instrumento oscuro / papel)
para dos actos de lectura (explorar / juzgar).*

**N10 · Metáforas físicas con física.** La foto del implicado (`.card` color manila, rotada
−1.5°, con clip dibujado en CSS y sello rojo rotado −8°) se **esconde tras el dossier**
(`.tucked{transform:translateX(128px)}`). Un papel (`#paper`, 200×260) asoma 20 px desde el riel
y al hover/foco **se desliza fuera** invitando a abrir el expediente completo. *Principio: los
objetos se comportan como en un archivador real; la affordance es el gesto de sacar la ficha.*

**N11 · Un sub-mundo temático con su propio lenguaje (Arsenal).** El catálogo de armas es un
plano técnico azul (`#0f3260`, retícula 24 px) conmutables a tinta o papel (`.st-ink/.st-paper`):
SVG de ingeniería con cotas, y botón **explode** que despieza el arma (`.bp.ex .part` se traslada
con delays escalonados y aparecen *callouts* con fabricante clicable). Debajo, la cronología de
eventos: fecha mono, titular, **la cifra de víctimas en grande** (`.toll b 20px`) y la foto-evidencia
fijada con un pin y una línea de referencia discontinua. El botón que lleva ahí pulsa con un
resplandor de 3.6 s. *Principio: cada tipo de contenido merece su retórica visual completa, no una
plantilla única; el despiece técnico convierte la cadena de suministro en algo que se toca.*

**N12 · El teléfono no es el mapa encogido.** ≤760 px hay un DOM aparte (`#phone`): un scroll
largo donde el mapa es solo el fondo del hero, luego secciones numeradas, las carpetas de casos,
un índice buscable por filas táctiles y el dossier como página con botón volver. Un aviso
(`#phnote`) sugiere además abrirlo en escritorio. *Principio: en móvil se lee una historia; el
instrumento completo se reserva a pantallas que lo soportan —y se dice.*

Patrones menores que completan el sistema: buscador centrado con prefijo `/` en amarillo y
resultados agrupados por tipo; `INDEX` como tabla ordenable (la segunda lectura, exhaustiva y
sin retórica); `SUBMIT` para enviar pistas con normas de seguridad (la base de datos se declara
abierta a corrección); todo estado pulsable usa `aria-pressed` y el activo se marca con `●` en
amarillo señal.

## 5. Sistema de diseño (tokens medidos)

| Token | BL00D.MONEY | Foresight Atlas hoy (línea base) |
|---|---|---|
| Mundo | Oscuro único `--bg:#080808`, panel `#0e0e0d` | Claro editorial `#f8faf5/#ffffff` |
| Señal | `--signal:#e8ff00` (amarillo ácido) — foco, activos, cifras, highlight | Verde `#345b43`, selección `#dee9d7` |
| Papel | `#ecebe4 / #e7e2d3`, tinta `#141412`, rojo sello `#c8102e` | — (no existe registro «papel») |
| Tipos de entidad | 9 colores `--c-person #a7d8e0 · company #e8ff00 · gov #4f9dff · country #b48cff · fund #ff5c2b · weapon #e5322d · contract #e2e2da · org #6fd38a · agg #8b8b86` | 3 (lavanda/verde/ámbar pastel) |
| Familias de relación | 7 colores `--f-own #ff5c2b · contract #e5322d · money #ffc93c · politics #6fd38a · oppose #ff3b8d · role #a7d8e0 · tech #4f9dff` | 17 verbos sin familia visual |
| Tipografía | Hanken Grotesk 300–600 + **IBM Plex Mono** para todo metadato/cifra/etiqueta | DM Sans + Manrope display |
| Escala | Titulares 26–56 px peso 300–500; metadatos mono 8.5–11 px en mayúsculas, tracking .06–.16em; prosa 13.5–15.5 px/1.55–1.62 | Titulares 21–34 px; UI 8–12 px |
| Geometría | Radio 0 casi siempre (999px solo en modos/chips), filetes 1px `#1f1f1e/#343434` | Radios 4–8 px, filetes `#e6e9e1` |
| Cifras | `font-variant-numeric:tabular-nums` en todo importe/contador | Parcial |
| Movimiento | UI fade 1.4 s · papel 0.45 s `cubic-bezier(.2,.8,.2,1)` · foto 0.5 s · barras 0.9 s · reveal 0.45 s/+10 px · pulso 3.6 s · despiece 0.9 s con `--d` por pieza | 0.18–0.5 s, fade/slide suaves |

## 6. Modelo de contenido (esquema inferido del JSON)

- **Entidad:** `id` de expediente, `name`, `type`, `role` *(el cargo en una línea: «Arms maker;
  its Tomahawk struck a school in Minab, Iran»)*, `country`, `slug`, `profile` (prosa larga que
  suele cerrar con los beneficios obtenidos y, en países, con un veredicto: *«Charge: …»*),
  `profile_src[]`, `profile_status: documented|reported`.
- **Relación:** `a`, `b`, `rel` (verbo snake_case), `amt`, `cur`, `pct`, `date`, **`ctx`** (la
  frase que la hace inteligible), `st`, `t` (familia: money/edge/election…), **`ev[]`** con
  fuente y **extracto literal**.
- **Fuente:** `id SRC-…`, `url`, `title`, `pub`, `date`, `tier` (`reputable_media`/`secondary`).
- **Casos y armas [inferido de las clases]:** titular/bajada, cifras clave, cadena de pasos,
  gráficos, participantes como chips; armas con especificaciones, fabricantes por pieza y
  eventos con víctimas y foto-evidencia.

La voz es de fiscalía: cada `role` es una acusación y cada perfil termina en lo ganado. Del
artefacto se traslada el *aparato probatorio*, no la voz.

## 7. Accesibilidad y riesgos — lo que NO hay que copiar

- ✅ Hace bien: `:focus-visible` en amarillo señal, `aria-pressed` sistemático,
  `prefers-reduced-motion` que apaga transiciones y el pulso, safe-areas, `aria-live` en el dossier.
- ⚠️ El canvas es `role="img"` con una sola etiqueta: la red entera es inaccesible por teclado/lector
  (el Atlas, en SVG con nodos enfocables, ya está por delante — no retroceder).
- ⚠️ Metadatos a 8.5–10 px y `--fg3:#5c5c5a` sobre `#080808` (~3:1): atmosfera a costa de legibilidad.
- ⚠️ Archivo único de varios MB con toda la base de datos: primera carga y mantenimiento caros.
- ⚠️ El eskeumorfismo (clips, sellos, papel) es su firma temática —archivo policial—; transplantado
  literal al Atlas sonaría a atrezo. Se traduce el principio (objeto-relato), no el disfraz.
- ⚠️ Tono acusatorio y temática: intocables. Y su UI asume escritorio (en el teléfono renuncia al
  instrumento): el Atlas, más pequeño, sí puede sostener el grafo en móvil.

---

## 8. Matriz de traslado → Foresight Atlas

| # | Patrón (BL00D) | Principio | Traducción al Atlas (grafo-centro) | En el prototipo | Esfuerzo |
|---|---|---|---|---|---|
| T1 | N2 mundo full-bleed | Un solo mundo continuo | Modo instrumento a pantalla completa: el SVG deja la tarjeta `workspace-shell`; riel y dossier flotan con gradientes; desaparecen topbar/heading de 290 px en este modo | ✅ | M |
| T2 | N4 modos-pregunta | El layout es la pregunta | Tira inferior: **RED · ÓRBITA** (BFS por anillos desde el nodo) **· ESCUELAS** (6 territorios) **· CRONOLOGÍA** (x = año de publicación 1967→2018, carriles por tipo) — el Atlas puede entregar la TIMELINE que BL00D dejó en «Next round» | ✅ los 4 | M |
| T3 | N3 zoom semántico + HUD | Saber a qué altura se lee | `ZOOM 01 — SISTEMA / 02 — CONSTELACIÓN / 03 — NODO · ×k` según escala y foco; `#meta` con nodos visibles, modo y «datos: 36 nodos · 62 relaciones» | ✅ | B |
| T4 | N5 NAMES OFF/KEY/ALL | Legibilidad como dial | `NOMBRES · NO \| CLAVE \| TODOS` (clave = grado ≥4, seleccionado y vecinos) | ✅ | B |
| T5 | N6 dossier-WORLD por defecto | Primero el todo | Sin selección, el dossier es «EL CAMPO»: gran cifra (36 nodos), desglose en bloques por tipo/escuela y los hilos para empezar. Sustituye al arranque con Inayatullah precargado | ✅ | B |
| T6 | N7 relación inspeccionable | Toda afirmación, su prueba | Aristas clicables (hit-area ancha) → inspector flotante `A —verbo→ B` + **estado que el Atlas ya tiene** (`reference` = fuente directa / sin ella = asociación editorial, hoy solo visible al exportar) + enlace. Fase 2: `ctx` de una frase por arista | ✅ (sin ctx) | B/M |
| T7 | N8 plain + path | El sistema se traduce a una oración | En el dossier del nodo: frase generada «**Inayatullah** desarrolló **3 métodos** y explora **4 ideas**…» + reutilizar la ruta numerada que AskPanel ya sabe dibujar | ✅ frase | B |
| T8 | N9/N10 case files → **Hilos** | El relato largo es un objeto que se saca del cajón | «Expedientes de lectura» = 4 hilos curados (rutas reales entre nodos) en un cajón de fichas del riel; activarlos tiñe la ruta en el grafo y convierte el dossier en **cadena de pasos 01→n**; el «informe» es una hoja papel con cifras clave, cadena y fuentes | ✅ | M |
| T9 | crumbs + BACK | Explorar deja rastro | Pila de historial: migas abajo-izquierda + `← VOLVER`; la exploración se puede desandar (hoy el Atlas no tiene «atrás») | ✅ | B |
| T10 | N1 intro | Primero el sistema, luego los instrumentos | Intro breve y saltable (`»`): solo la red y la tesis «Los futuros, conectados.» 2 s, el chrome entra con fundido — respetando `prefers-reduced-motion` | ✅ | B |
| T11 | N11 sub-mundo Arsenal | Cada contenido, su retórica | Futuro: los **métodos** como «planos» — despiece interactivo de p. ej. los Seis Pilares o CLA por capas con callouts a nodos | ❌ fase 3 | A |
| T12 | N12 móvil-historia | En móvil se lee, no se pilota | ≤760 px: hero con el grafo de fondo + hilos en scroll + índice por filas; dossier a página completa | ◐ básico | M |
| — | voz mono/instrumento | Metadato con voz propia | IBM Plex Mono solo para HUD/cifras/ids (`AUT-014`) conviviendo con Manrope/DM Sans; ids de expediente derivados del tipo+orden | ✅ | B |

## 9. Plan de aplicación por fases

**Fase 0 — Prototipo (hecho en esta entrega).** Vista aislada tras `#/instrumento` con T1–T10 y T12
básico sobre los datos reales, sin tocar la experiencia actual. Sirve para decidir las tres
preguntas de §10 con algo en la mano.

**Fase 1 — Instrumento sobre la app actual (sin datos nuevos).**
1. `Graph.tsx`: prop `mode: 'network'|'orbit'|'schools'|'timeline'` con interpolación de posiciones
   (800–900 ms, `cubic-bezier(.2,.8,.2,1)`), reutilizando el layout orbital que ya existe para el foco.
2. HUD (`zoomlbl`, `meta`), tira de modos y control de nombres como componentes sobre el canvas.
3. Historial: pila en `App.tsx` (`history: string[]`, `back()`), migas y atajo de teclado.
4. Aristas con hit-area e inspector flotante con estado de fuente (datos ya presentes en `edges`).
5. Dossier «EL CAMPO» como estado sin selección en `DetailPanel`.
→ Todo pasa por las claves de `ui.{es,en,pt}.ts`; presupuesto: sin librerías nuevas.

**Fase 2 — Hilos y contexto editorial (coste de contenido, trilingüe).**
1. Tipo `Thread` en `data/atlas.ts` (id, ruta de nodos) + textos en `content.*.ts`
   (titular, bajada, frase por paso). Empezar con los 4 del prototipo.
2. `ctx` por arista: 62 frases × 3 idiomas — la partida editorial más cara; hacerla por oleadas
   (primero las aristas de los hilos) y exponerla también al prompt de la guía (`ai/prompt.ts`),
   para que AskPanel pueda citar el porqué de cada vínculo, no solo el verbo.
3. Hoja-informe del hilo (`#report` a la Atlas): cifras clave, cadena, fuentes directas vs.
   editoriales — reutiliza el `Modal` accesible actual como base.

**Fase 3 — Profundidad.**
1. «Planos» de métodos (T11) para CLA/Tres Horizontes/Seis Pilares con despiece por capas.
2. Decidir si el modo instrumento sustituye a la pantalla actual o convive como vista
   («Explorar» vs. «Instrumento»); medir con tareas: *seguir un hilo hasta el final*, *encontrar
   qué une a dos autores*, *decir de qué época es una idea* — tiempo y aciertos antes/después.
3. Guardarraíles: build single-file ≤ ~500 KB, contraste AA en textos de 10 px (subir el mínimo
   del HUD a 10 px y el gris a ≥4.5:1), SVG siempre (teclado), `prefers-reduced-motion` en intro
   y transiciones de modo.

## 10. Decisiones tomadas (2026-10-22) — ver ADR 0002

1. **Registro visual: oscuro**, en el espíritu del bloodmap, traducido a verde tinta del Atlas.
2. **El objeto-relato se llama «Hilos»** (expedientes de lectura).
3. **`ctx` por arista: sí.** Escrito para las 62 relaciones en ES/EN/PT (`edgeContexts`).

Formalizadas en [`docs/adr/0002`](../adr/0002-modo-instrumento-oscuro-hilos-y-contexto-por-arista.md).
Estado tras implementarlas: fase 0 ✅ (prototipo, ahora en `src/instrument/`), fase 1 ✅ en lo
sustancial (modos, HUD, historial, inspector, dossier-campo y puerta desde la vista clásica;
el modo instrumento mantiene su propio SVG en vez de integrarse en `Graph.tsx` — deuda anotada
en el ADR), fase 2 ✅ (Hilos como datos trilingües, `ctx` completo, contexto también en el
panel clásico y en el prompt de la guía). Fase 3 (parcial) ✅: chrome del instrumento
localizado vía `ui.inst` y «planos» de métodos (T11) para CLA, Seis Pilares, Tres
Horizontes y Triángulo de Futuros, enlazados también desde el panel clásico; y la
historia móvil (T12): en ≤760 px el instrumento es un scroll narrado con el grafo
como fondo del hero (`src/instrument/Phone.tsx`). Queda una sola decisión abierta:
si el instrumento desplaza a la vista clara como portada.

---

*Nota de método y derechos: se adoptan patrones de presentación e interacción, principios
generales de diseño. No se reutiliza contenido, textos ni identidad del artefacto; su base de
datos solo se muestreó para inferir el esquema.*
