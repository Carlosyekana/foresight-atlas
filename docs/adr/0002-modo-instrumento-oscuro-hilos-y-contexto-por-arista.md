# ADR 0002 — Modo instrumento oscuro, Hilos y contexto por arista

**Estado:** aceptada (2026-10-22) · **Origen:** ingeniería inversa de BL00D.MONEY
([informe completo](../ingenieria-inversa/01-ingenieria-inversa-bl00d-money.md),
matriz de traslado T1–T12).

## Contexto

El Atlas presentaba su grafo dentro de una tarjeta clara tipo herramienta, con entrada
fría (sin recorrido propuesto), relaciones descritas solo por un verbo y su mejor
narrativa encerrada en los paneles. Del artefacto analizado se extrajeron principios
—no su piel ni su contenido—: el grafo como mundo a pantalla completa, modos de layout
como preguntas, zoom semántico, relaciones inspeccionables con su prueba, y relatos
largos tratados como objetos («case files») que se abren sobre el mapa.

## Decisión

1. **Registro visual del modo nuevo: oscuro**, en el espíritu del bloodmap (mundo único,
   chrome flotante, voz mono para el metadato), traducido a la identidad del Atlas:
   fondo verde tinta, señal verde-lima, paleta por tipo existente.
2. **El objeto-relato se llama «Hilos»** (expedientes de lectura): rutas curadas sobre
   aristas reales. Estructura en `threadShapes` (`src/data/atlas.ts`); título, bajada y
   nota por paso en `content.{es,en,pt}.ts`, como todo texto del Atlas.
3. **Cada arista lleva una frase de contexto** (`edgeContexts`, clave `source--target`)
   en los tres idiomas: 62 relaciones × 3. Se muestra en el inspector de relación del
   modo instrumento, bajo cada conexión del panel clásico, en las fuentes del informe
   en papel de cada Hilo y en el prompt de la guía IA.
4. **El modo instrumento convive, no sustituye (todavía).** Vive en `#/instrumento`
   (`src/instrument/`) con puerta oscura desde la navegación clásica. Si desplaza a la
   vista actual como portada se decidirá tras usarlo y medirlo (fase 3 del informe).

## Consecuencias

- `getConnections` ahora devuelve también `context` y la `edge` completa; el
  `DetailPanel` clásico muestra el porqué de cada vínculo.
- El prompt de la guía crece (~2k tokens por idioma): las aristas llevan su contexto y
  se listan los Hilos como rutas válidas.
- Coste editorial asumido y recurrente: **toda arista o Hilo nuevo exige su texto en
  los tres idiomas** antes de publicarse (igual que ya pasa con los nodos).
- El build single-file sube a ~655 KB (gzip ~198 KB) con el modo instrumento, los
  textos y los planos. Si el modo se consolida, `Instrumento` deberá compartir el motor de
  `Graph.tsx` o cargarse bajo demanda.
- El *chrome* del modo instrumento va por `ui.inst` en los tres idiomas (hecho en
  fase 3, junto con los **Planos de métodos** `PLN-01…04`: diagramas despiezables
  cuyas piezas enlazan de vuelta a nodos del grafo; estructura en `blueprintShapes`,
  textos en `content.*.ts`). Pendiente conocido: la versión móvil tipo historia
  (patrón N12).
- Se mantiene SVG con nodos enfocables: no se adopta el canvas del artefacto, que es
  inaccesible por teclado con solo 36 nodos que representar.
