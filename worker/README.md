# Worker: `foresight-atlas-ask`

El único endpoint de IA del atlas. Recibe una pregunta, arma el prompt con el atlas completo en el idioma activo, llama a Gemini y devuelve un **plan** que la app ejecuta sobre el grafo: nodos a resaltar, ruta, filtros y colección propuesta. La clave de Gemini vive aquí como secreto; nunca llega al navegador.

```
navegador ──POST /ask──▶ Worker ──▶ Gemini (generateContent, salida JSON con esquema)
                          │  CORS solo a orígenes permitidos
                          │  ≤ 16 KB por petición, contrato validado
                          │  10 preguntas / min por IP (Rate Limiting binding)
                          │  DAILY_CAP respuestas / día en total (KV)
                          └─ registro estructurado, sin texto de las preguntas
```

El código del prompt y del contrato es **compartido con el frontend** (`../src/ai/`). El Worker importa los tres diccionarios del atlas, así que añadir un nodo al atlas lo añade automáticamente a lo que la guía sabe: no hay índice que regenerar.

## Despliegue inicial (una sola vez)

Requisitos: cuenta de Cloudflare (plan gratuito basta) y una clave de Gemini de [Google AI Studio](https://aistudio.google.com/apikey).

```bash
cd worker
npm install
npx wrangler login                       # abre el navegador; autoriza tu cuenta
npx wrangler kv namespace create ASK_COUNTER
```

El último comando imprime un `id`. Pégalo en `wrangler.jsonc` en lugar de `REPLACE_WITH_KV_NAMESPACE_ID`. Luego:

```bash
npx wrangler secret put GEMINI_API_KEY   # pega la clave cuando la pida; no queda en ningún archivo
npx wrangler deploy
```

`deploy` imprime la URL pública, del estilo `https://foresight-atlas-ask.<tu-cuenta>.workers.dev`.

## Conectar el frontend

La app solo muestra el botón «Preguntarle al atlas» si conoce el endpoint en tiempo de compilación.

1. En GitHub: **Settings → Secrets and variables → Actions → Variables → New repository variable**
   - Name: `VITE_ASK_ENDPOINT`
   - Value: la URL del Worker, sin barra final.
2. Haz push a `main` (o relanza el workflow). El siguiente build de Pages ya lleva la guía activa.

Para desarrollo local, el mismo valor va en un archivo `.env.local` en la raíz del proyecto:

```
VITE_ASK_ENDPOINT=https://foresight-atlas-ask.<tu-cuenta>.workers.dev
```

## Ajustes

Todo lo no secreto está en `wrangler.jsonc` → `vars`. Después de cambiarlo, `npx wrangler deploy`.

| Variable | Qué controla | Valor inicial |
|---|---|---|
| `THINKING` | Razonamiento interno antes de responder; esta tarea no lo necesita y costaba segundos. Acepta un número (`thinkingBudget` de la era 2.5), una palabra de nivel (`thinkingLevel` de los 3.x) o `""` para omitir el campo. **Los modelos son estrictos**: `gemini-3.5-flash-lite` rechaza las dos formas con 400 y solo funciona con `""`. Si cambias de modelo, vuelve a comprobarlo. | `""` |
| `GEMINI_MODEL` | Modelo de Gemini. `gemini-3.5-flash-lite` responde en 1–2 s y tiene la cuota gratuita más amplia. `gemini-3.6-flash` es el que Google recomienda en general, pero se congestiona más. **`gemini-2.5-flash` devuelve 404 a claves nuevas** («no longer available to new users»). | `gemini-3.5-flash-lite` |
| `DAILY_CAP` | Respuestas por día UTC entre todos los visitantes. Es el techo de costo. `0` desactiva el tope. | `150` |
| `ALLOWED_ORIGINS` | Orígenes que pueden llamar al Worker, separados por coma. Si cambias el dominio de Pages, cámbialo aquí. | Pages + localhost |

El límite por IP (10 preguntas por minuto) está en `ratelimits` del mismo archivo.

### Cuando el modelo no responde

El Worker distingue tres situaciones y la app las explica en el idioma activo:

| Del lado de Gemini | Código | Qué hace el Worker |
|---|---|---|
| `503 UNAVAILABLE` «high demand» | `busy` | Reintenta una vez con espera, dentro de un presupuesto total de 25 s. Si persiste, pide reintentar. |
| `429 RESOURCE_EXHAUSTED` | `quota_exhausted` | No reintenta; la cuota no se libera en segundos. |
| `404` modelo inexistente | `upstream` | No reintenta; es un error de configuración. |

Los límites del plan gratuito se consultan por proyecto en [AI Studio → Rate limits](https://aistudio.google.com/rate-limit). Son estrechos: unas pocas decenas de peticiones diarias por modelo bastan para agotarlos probando. Si la guía responde «saturado» de forma persistente, es capacidad de Google, no el Worker — los registros lo dicen literalmente.

## Desarrollo local

```bash
cp .dev.vars.example .dev.vars           # y pon una clave real dentro
npm run dev                              # http://localhost:8787
```

`wrangler dev` usa un KV y un limitador locales; no toca producción. Para probar la interfaz **sin** clave de Gemini hay un simulador del endpoint en la conversación de desarrollo original; cualquier servidor que responda `POST /ask` con `{ "plan": {...} }` y CORS sirve.

## Observabilidad

Los registros están activados (`observability.enabled`) y se ven en el panel de Cloudflare → Workers → `foresight-atlas-ask` → Logs. Cada respuesta deja una línea JSON con idioma, tamaño de la pregunta, nodos resaltados, tokens consumidos y tiempo — pero **nunca el texto de la pregunta**.

## Contrato

`../src/ai/contract.ts` define la petición y el plan. `CONTRACT_VERSION` debe coincidir entre el frontend compilado y el Worker desplegado; si cambias la forma del plan, súbelo y despliega los dos.
