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
4. **El modo instrumento convive, no sustituye.** Vive en `#/instrumento`
   (`src/instrument/`) con puerta oscura desde la navegación clásica.
   **Enmienda (2026-10-22): pasa a ser la portada.** La raíz del sitio abre el
   instrumento (en el teléfono, su historia); la vista clásica clara queda en
   `#/clasico`, enlazada en ambos sentidos. La guía IA, las colecciones y la
   exportación siguen viviendo en la vista clásica: es el taller; el instrumento
   es la sala de lectura. La intro cinemática se muestra una vez por sesión y
   nunca ante un enlace profundo.

## Consecuencias

- `getConnections` ahora devuelve también `context` y la `edge` completa; el
  `DetailPanel` clásico muestra el porqué de cada vínculo.
- El prompt de la guía crece (~2k tokens por idioma): las aristas llevan su contexto y
  se listan los Hilos como rutas válidas.
- Coste editorial asumido y recurrente: **toda arista o Hilo nuevo exige su texto en
  los tres idiomas** antes de publicarse (igual que ya pasa con los nodos).
- El build single-file sube a ~686 KB (gzip ~205 KB) con el modo instrumento, los
  textos, los planos y la historia móvil. Si el modo se consolida, `Instrumento` deberá compartir el motor de
  `Graph.tsx` o cargarse bajo demanda.
- El *chrome* del modo instrumento va por `ui.inst` en los tres idiomas (hecho en
  fase 3, junto con los **Planos de métodos** `PLN-01…04`: diagramas despiezables
  cuyas piezas enlazan de vuelta a nodos del grafo; estructura en `blueprintShapes`,
  textos en `content.*.ts`). La **historia móvil** (patrón N12) también está hecha:
  en ≤760 px, `Phone.tsx` sustituye el instrumento por un scroll narrado (hero con
  el grafo de fondo, secciones numeradas, dossiers a página completa) con el
  instrumento completo a un toque.
- Se mantiene SVG con nodos enfocables: no se adopta el canvas del artefacto, que es
  inaccesible por teclado con solo 36 nodos que representar.
- **Enmienda (2026-10-22), tras la primera revisión de uso**: al convertirse en
  portada, el instrumento alcanza paridad con la clásica y recupera dos patrones de
  la referencia que faltaban.
  - *Sistema vivo*: los nodos derivan de forma continua con fase propia (el bucle
    pinta a ~24 fps en reposo; `prefers-reduced-motion` lo apaga), las aristas de
    una ruta (Hilo o guía) fluyen y el anillo del nodo activo pulsa. Al
    seleccionar, la cámara **vuela y acerca** la entidad; el zoom con rueda
    conserva el punto bajo el cursor (su fórmula anterior no lo hacía y el grafo
    «se escapaba» al acercar).
  - *Color diverso*: el nodo lleva **dos codificaciones**. En la clásica: relleno
    pastel por tipo y **anillo por escuela**. En el instrumento oscuro (como la
    referencia): **relleno vivo por escuela** con halo (`schoolPalette`, 6 tonos)
    y **forma por tipo** (● autor con iniciales · ◆ método · ◎ concepto); las
    líneas se curvan y heredan el color de la escuela de origen.
  - *Guardar en el instrumento*: las colecciones son un solo almacén
    (`src/data/collections.ts`) que comparten clásica, instrumento e historia
    móvil; además se pueden guardar **relaciones** desde el inspector
    (`foresight-atlas-saved-edges-v1`, se dibujan en dorado).
  - *Guía IA y «Sorpréndeme»* también en el instrumento (y en la historia móvil):
    se reutiliza `AskPanel` con piel oscura y sus planes se aplican al grafo
    (filtros, destacados, ruta, guardar colección).
