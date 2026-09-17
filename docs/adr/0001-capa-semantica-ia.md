# ADR-0001: Capa semántica de IA sobre el Foresight Atlas

**Estado:** Aceptado (2026-09-17), con las enmiendas de la sección final
**Fecha:** 2026-09-06
**Decide:** Chato (único mantenedor)

## Contexto

`foresight-atlas` v1 es un SPA React+Vite compilado con `vite-plugin-singlefile` a un
`dist/index.html` autocontenido (~446 KB), publicado en GitHub Pages en cada push a
`main`. Sin backend, sin cuentas, sin base de datos. El estado del usuario
(colecciones) vive en `localStorage`.

El dataset son 36 nodos y 62 aristas, con la estructura (`src/data/atlas.ts`: ids,
tipos, escuelas, coordenadas, aristas) separada del texto
(`src/i18n/content.{es,en,pt}.ts`). Trilingüe, español por defecto.

Se quiere añadir una ventana donde el usuario interactúe **semánticamente** con el
dataset: preguntar en lenguaje natural y obtener respuestas ancladas en el grafo.

Las fuerzas en tensión:

1. **La restricción de despliegue es dura.** Una sola URL canónica que sigue a `main`
   en GitHub Pages. Pages solo sirve estáticos: no puede guardar una API key ni
   ejecutar código de servidor.
2. **El corpus es diminuto.** 21 KB por idioma (~7.000 tokens). Toda la
   infraestructura de recuperación (embeddings, vector store, chunking, reranking)
   resolvería un problema que aquí no existe.
3. **El costo debe ser acotable.** Es un experimento público sin autenticación; un
   endpoint abierto a internet es una factura abierta.
4. **La respuesta correcta no es texto.** El valor del proyecto es el grafo. Una
   respuesta en prosa junto al grafo desperdicia lo que ya está construido.

## Decisión

Añadir una capa de IA con tres piezas, en este orden de importancia:

1. **El contexto es el atlas completo en el prompt del sistema**, no recuperación. Se
   serializa `atlas.ts` + `content.<lang>.ts` a un bloque compacto (ids, tipos,
   escuelas, años, descripciones, aristas con su relación y referencia) y se envía
   entero, con *prompt caching* de Anthropic sobre ese bloque. Cero embeddings, cero
   vector DB, cero pipeline de ingesta.

2. **La IA controla el grafo; no conversa al lado del grafo.** El modelo responde con
   *tool use* estructurado, no con prosa suelta. Herramientas mínimas:
   `resaltar_nodos(ids[])`, `enfocar_ruta(desde, hasta)`,
   `aplicar_filtros({tipo, escuela})`, `proponer_coleccion(nombre, ids[])`. La app
   ejecuta esas llamadas contra el estado que ya tiene en `App.tsx`. La prosa
   acompaña; el grafo es la respuesta.

3. **Toda afirmación se ancla en ids validados.** El modelo debe citar ids de nodos y
   aristas. La app valida cada id contra el atlas antes de renderizar y descarta los
   que no existen. Un nodo alucinado no llega a la pantalla; se degrada a "no
   encontré eso en el atlas".

Para el **transporte**, se adopta un **Cloudflare Worker como único endpoint de IA**,
con *bring-your-own-key* como escape hatch. Pages sigue siendo la URL canónica y el
frontend sigue siendo un archivo único.

## Opciones consideradas

### Opción A — 100% cliente, el usuario pone su propia API key

El navegador llama a la API de Anthropic directamente con
`anthropic-dangerous-direct-browser-access`. La key vive en `localStorage`.

| Dimensión | Evaluación |
|---|---|
| Complejidad | Baja — no se toca el despliegue |
| Costo para ti | Cero |
| Escalabilidad | Infinita (cada usuario paga lo suyo) |
| Encaje con el stack | Perfecto: sigue siendo un `index.html` |

**A favor:** no rompe nada. Sin backend, sin CORS propio, sin secretos, sin límites de
tasa. Se puede implementar en un día.

**En contra:** la audiencia son practicantes de prospectiva, no desarrolladores; pedir
una API key mata la adopción de la mayoría. Además pone al usuario a pegar una
credencial en una web, un hábito que no conviene enseñar.

### Opción B — Worker/Función serverless delgada que guarda la key

Un Cloudflare Worker (o Vercel Function) expone `POST /ask`, guarda la key como
secreto, arma el prompt y hace streaming de vuelta al navegador. Pages sigue sirviendo
el frontend.

| Dimensión | Evaluación |
|---|---|
| Complejidad | Media-baja — ~150 líneas y un repo/directorio extra |
| Costo | El plan gratuito de Workers cubre el tráfico esperado; el costo real es el de tokens |
| Escalabilidad | Suficiente; el riesgo es abuso, no carga |
| Encaje con el stack | Bueno: dos orígenes, CORS explícito, el build único sobrevive |

**A favor:** funciona para cualquier visitante sin fricción. Centraliza el prompt y las
herramientas, así que se puede iterar el comportamiento sin recompilar el frontend.
Permite *prompt caching* del bloque del atlas, que con 7k tokens fijos es exactamente
el caso de uso.

**En contra:** rompe la propiedad de "un solo artefacto"; ahora hay dos cosas que
desplegar y que pueden desincronizarse. Endpoint público sin auth: obliga a Turnstile +
rate limiting por IP + tope diario de gasto, o la factura es de otro. Es la parte que
hay que hacer bien, no el prompt.

### Opción C — Migrar a Next.js en Vercel con RAG completo

Embeddings de los nodos, vector store, recuperación top-k, síntesis.

| Dimensión | Evaluación |
|---|---|
| Complejidad | Alta |
| Costo | Hosting + vector DB + embeddings + inferencia |
| Escalabilidad | Excesiva para 36 nodos |
| Encaje con el stack | Rompe Pages, rompe el single-file, rompe la URL canónica |

**A favor:** es el camino si algún día el atlas crece a miles de nodos o incorpora
textos completos de las fuentes.

**En contra:** hoy resuelve un problema inexistente. Con 7k tokens de corpus, la
recuperación solo puede *empeorar* la respuesta: introduce la posibilidad de omitir el
nodo relevante, algo que meter todo en el prompt no tiene. Es infraestructura pagando
por una degradación.

### Opción D — Modelo local en el navegador (WebLLM / transformers.js)

**A favor:** sin key, sin backend, sin costo, privacidad total.

**En contra:** descarga de cientos de MB en una app que hoy pesa 138 KB gzip. La
calidad de razonamiento sobre relaciones conceptuales de un modelo de ese tamaño no
sostiene la promesa. Solo tiene sentido una variante acotada: usar `transformers.js`
**únicamente para embeddings de búsqueda semántica** (~25 MB), sin generación. Eso
mejoraría la búsqueda actual sin ninguna IA generativa, y es una mejora que vale por
separado.

## Análisis de trade-offs

**El eje real es fricción de adopción contra riesgo de costo.** A y B están en extremos
opuestos y ambos son defendibles; C y D no compiten hoy.

La resolución propuesta es **no elegir**: el Worker es el camino por defecto, con un
cupo diario global modesto (p. ej. N respuestas/día en total). Cuando se agota, la UI
ofrece "usa tu propia key" y cae a la Opción A sin cambiar nada más del código — el
cliente arma el mismo prompt y las mismas herramientas, solo cambia la URL de destino.
El costo queda acotado por diseño y la puerta nunca se cierra del todo. El trabajo
extra frente a implementar solo B es pequeño porque el ensamblado del prompt es
compartido.

**El segundo trade-off es prosa contra acciones.** Una ventana de chat que devuelve
párrafos es más fácil y se siente peor: compite con el grafo por la atención y no
aporta nada que el usuario no pudiera obtener de un chatbot genérico. Las herramientas
estructuradas cuestan más de definir pero convierten la IA en un modo de navegación
—"muéstrame el camino de Inayatullah a Backcasting", "¿qué nodos hablan de agencia?"—
que es lo único que justifica que esta IA viva *aquí* y no en otra pestaña.

**El tercero es la separación estructura/texto que ya existe** y que resulta ser
exactamente lo que esta capa necesita: los ids son idioma-independientes, así que el
modelo razona sobre ids y responde en el idioma activo cargando solo
`content.<lang>.ts`. El anclaje por id es gratis gracias a una decisión de diseño
anterior.

## Consecuencias

**Se vuelve más fácil**

- Iterar el comportamiento de la IA: el prompt vive en el Worker, se despliega solo.
- Anclar y verificar: cada respuesta apunta a ids que existen o no se muestra.
- Crecer el atlas: añadir nodos no requiere reindexar nada.

**Se vuelve más difícil**

- El despliegue deja de ser un solo `git push`. Hay que versionar el contrato entre
  frontend y Worker.
- Aparece superficie de abuso donde antes no había ninguna.
- El `dist/index.html` deja de funcionar abriéndolo desde el disco *para la parte de
  IA* (el resto sigue igual). Vale la pena que la UI lo diga en vez de fallar en
  silencio.

**Habrá que revisitar**

- El umbral de recuperación: si el atlas pasa de ~200 nodos o incorpora textos fuente
  completos, la Opción C vuelve a la mesa. Antes, no.
- Si el cupo diario se agota constantemente, la pregunta es de producto (¿quién paga?),
  no de arquitectura.

## Plan de acción

1. [x] Serializador `atlasToPrompt(lang)` en `src/ai/prompt.ts`, compartido por cliente y
   Worker. El bloque queda en ~7k tokens por idioma.
2. [x] Contrato request/response en `src/ai/contract.ts`, con `sanitizePlan` que descarta
   ids inexistentes y rutas con saltos que no son aristas.
3. [x] Worker en Cloudflare (`worker/`): secreto de key, CORS solo a orígenes permitidos,
   límite por IP (10/min) y tope diario global en KV (`DAILY_CAP`). Sin streaming ni
   Turnstile (ver enmiendas).
4. [x] Panel lateral en la app (`AskPanel.tsx`): ejecución del plan sobre el estado de
   `App.tsx` (resaltar, ruta, filtros, colección), validación de ids, auto-encuadre del
   grafo sobre la respuesta.
5. [ ] Fallback bring-your-own-key cuando el cupo se agota. Preparado (el prompt vive en
   `src/ai/`, importable desde el cliente) pero no expuesto en la UI.
6. [x] i18n de la nueva UI en los tres `ui.*.ts`; Wild Cards, Backcasting y Horizon
   Scanning se mantienen en inglés también en el prompt.
7. [ ] Batería de ~15 preguntas de regresión con ids esperados.

## Notas abiertas

- **El cupo diario y quién paga** es la única variable que puede tumbar la Opción B. Si
  la respuesta es "cero riesgo de factura", la Opción A pura es una arquitectura
  perfectamente honesta y se entrega en un día.
- **La búsqueda semántica local con `transformers.js`** (sin IA generativa) es una
  mejora independiente y barata a la búsqueda actual, fuera del alcance de este ADR.

## Enmiendas al implementar (2026-09-17)

- **Proveedor: Gemini en lugar de Anthropic.** Decisión del mantenedor al construir.
  Se usa `models.generateContent` con salida JSON validada por esquema
  (`responseSchema`). El modelo es una variable del Worker (`GEMINI_MODEL`,
  inicialmente `gemini-3.5-flash`); Gemini 2.5 Flash sigue disponible como opción.
  El *prompt caching* implícito de los modelos 2.5+ cubre el bloque fijo del atlas
  sin configuración.
- **Un plan JSON por respuesta en vez de varias llamadas a herramientas.** Las cuatro
  herramientas del ADR se conservan como campos de un único objeto (`highlight`,
  `path`, `filters`, `collection`). Misma intención —la IA controla el grafo—, pero
  una sola respuesta estructurada es más determinista que orquestar llamadas
  paralelas, y la app la ejecuta de una vez.
- **Sin streaming en v1.** Un plan estructurado llega entero o no llega; con Flash la
  latencia observada es de 1–3 s, y la UI muestra un estado de espera. Streaming del
  texto queda como mejora si la latencia sube.
- **Sin Turnstile en v1.** El límite por IP y el tope diario acotan el costo por diseño;
  Turnstile añade una dependencia de configuración en el panel de Cloudflare. Se
  añadirá si aparece abuso real.
- **La URL canónica no cambia.** Pages sigue sirviendo el frontend; el Worker es un
  segundo despliegue con su propio runbook (`worker/README.md`). Sin la variable
  `VITE_ASK_ENDPOINT` el build no incluye la guía, así que `main` nunca queda roto
  por el Worker.
