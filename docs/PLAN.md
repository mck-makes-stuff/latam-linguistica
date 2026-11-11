# Plan del proyecto: *Un concepto, muchas palabras*

Documento de trabajo · noviembre de 2026

## 0. Decisiones tomadas

| Tema | Decisión |
|---|---|
| Unidad geográfica | **País** (19 países hispanohablantes de América Latina, Puerto Rico incluido). Los datos guardan la región cuando la fuente la da (p. ej. «Yucatán», «Cuyo»), para poder pasar a **zonas dialectales** más adelante sin rehacer los datos. |
| Punto de comparación | **España**, en un recuadro aparte. No es la norma de referencia: es una variedad más. |
| Rasgos | **Léxico** (qué palabra se usa para cada concepto). La gramática (voseo) y la fonética (seseo, yeísmo) quedan fuera de esta fase. |
| Público | **Académico**: cada dato del mapa enlaza a su fuente, distingue niveles de fiabilidad y explica el método. |
| Idioma | Todo el sitio en español. |
| Estética (fase 1) | Paleta neutra: blanco, crema y tostado. El color llega en la fase 2. |
| Alojamiento | GitHub Pages desde la rama `main` (carpeta raíz), sin paso de compilación. |
| Cambios de fuentes | Brasil y Haití se retiraron de la lista de fuentes (no son hispanohablantes); se sustituyeron por **Puerto Rico** y **España**. |

---

## 1. Plan de investigación

### 1.1 Preguntas

1. **¿Qué rasgos léxicos son más identificables?** ¿Qué palabras distinguen a un país y cuáles comparten muchos?
2. **¿Cómo comunicar mejor el mensaje** de que la diversidad del español es riqueza y no error?

### 1.2 Enfoque: de la idea a la palabra (onomasiológico)

Un mapa de palabras sueltas («¿dónde se dice *chévere*?») muestra puntos aislados. Un mapa de **conceptos** («¿cómo se dice *pajita* en cada país?») cubre todo el continente, porque **todos** los países tienen alguna palabra para ese concepto. Por eso la unidad principal del sitio es el **concepto**, y las palabras sueltas se consultan con el buscador.

### 1.3 Fuentes por niveles de fiabilidad

| Nivel | Tipo | Fuentes | Uso en el sitio |
|---|---|---|---|
| **A** | Lexicografía académica y corpus | *Diccionario de americanismos* (ASALE, 2010) · *DLE* (RAE/ASALE) · **VARILEX** (Ueda, Univ. de Tokio: encuestas de léxico por ciudad) · **CORPES XXI** (RAE, corpus filtrable por país) · *Corpus del Español: Web/Dialects* (Davies) | Verificar y dar **frecuencia**. Es la meta para el sitio publicado. |
| **B** | Wiki lexicográfica con plantillas de región | Wikcionario en español: categorías `ES:<país>` y la plantilla `{{ámbito}}` en cada acepción | **Columna vertebral actual**: se puede procesar automáticamente y verificar por acepción. |
| **C** | Divulgación y medios | Marca Chile, Quillbot, Psicología y Mente, CiberCuba, Visión Lingüística, tango.blue | Confirman que la palabra **circula como rasgo identitario**. No confirman la acepción. |
| **D** | Diccionarios colaborativos y sitios comerciales | jergozo.com, diccionariolibre.com, sitios de turismo y de cursos | Volumen e indicios. Nunca prueban un dato por sí solos. |

Regla para que un dato entre en el mapa: **una acepción con región en una fuente A o B, más al menos una fuente independiente**. Lo demás aparece «en revisión».

### 1.4 Lo que ya está hecho (véase `INVESTIGACION.md`)

- Descargados los **24 territorios** del Wikcionario (19 de Latinoamérica + España, EE. UU., Guinea Ecuatorial, Río de la Plata y Caribe): **11 328 regionalismos americanos** únicos.
- Descargados los **7 apéndices** del Wikcionario: Nicaragua, Costa Rica, Panamá, El Salvador, Colombia, Amazonía peruana y *Variantes regionales*.
- Extraídas las palabras de las **21 fuentes web aportadas**, más la serie uniforme de jergozo para los 20 países. Sólo se guardan las palabras encabezado y el enlace, sin definiciones (derechos de autor).
- Una **semilla de 23 conceptos** con variantes candidatas, verificadas automáticamente por acepción.

### 1.5 Recomendaciones para la pregunta 1: dónde enfocar la investigación

1. **Conceptos de alta diversidad y cobertura total.** Los mejores conceptos para el mapa cumplen tres condiciones: (a) todos los países tienen una variante documentada, (b) hay muchas variantes distintas y (c) cada país tiene una variante dominante, no cinco. Los candidatos más fuertes en los datos actuales son *frijol* (18 de 19 países), *coche* (18), *niño* (17 países y 13 variantes), *autobús*, *palomitas*, *genial*, *pajita* y *camiseta* (véase `INVESTIGACION.md` §2.1). El script `procesar.py` calcula la cobertura de cada concepto; conviene ampliar la semilla a unos 40 conceptos y quedarse con los 15–20 que la puntúen mejor.
2. **Marcadores nacionales fuertes.** Son palabras que el Wikcionario marca para un solo país *y* que una lista independiente del mismo país también recoge (p. ej. *chamo* en Venezuela, *fome* en Chile, *mae* en Costa Rica). Son las más «identificables», ideales para un modo de juego o de adivinanza. La lista sale en `docs/analisis/resumen.md` §6.
3. **Palabras compartidas por muchos países y ausentes en España.** Son los **americanismos generales** (§3 y §7 del análisis). Sirven para mostrar lo que une a América Latina, frente a la idea de que «el español de verdad» es el de España.
4. **Falsos amigos entre países.** Una misma forma con significados distintos según el país: *guagua* (autobús en el Caribe, bebé en los Andes), *coger*, *pololo*, *chucho*. Son muy eficaces para comunicar y ya se detectan con el análisis por acepción.
5. **Corregir el sesgo de documentación.** Argentina y Chile tienen 6–7 veces más entradas en el Wikcionario que Panamá o Paraguay. Eso refleja la actividad de los editores, no la riqueza léxica. Antes de cualquier afirmación cuantitativa hay que normalizar y contrastar con VARILEX y CORPES XXI, sobre todo para Centroamérica, Paraguay y la República Dominicana.
6. **Prioridad de fuentes A para el siguiente paso:** VARILEX ya está organizado por concepto y ciudad, igual que este sitio, y debería ser la fuente principal de verificación. CORPES XXI aporta la frecuencia por país, lo que permite decir cuál es la palabra *dominante* y no sólo cuáles *existen*.

### 1.6 Recomendaciones para la pregunta 2: cómo comunicar el mensaje

1. **Encuadre pluricéntrico explícito.** El español tiene muchas normas cultas, no una. Evitar «correcto/incorrecto» y «español neutro»; preferir «se dice», «se registra» y «es habitual en». España aparece como un recuadro más, no como referencia.
2. **Empezar por un concepto cotidiano**, no por un mapa vacío. La portada abre con *palomitas*, que tiene unas diez palabras distintas y resulta sorprendente a primera vista.
3. **Mostrar el origen de las palabras.** Muchas variantes vienen de lenguas indígenas (*palta* y *choclo* del quechua; *elote* y *popote* del náhuatl; *pororó* del guaraní) o de la inmigración (*pibe* y *laburo* del italiano). Una capa de **etimología** convierte la diversidad en historia y no en rareza.
4. **Transparencia como argumento.** Para un público académico, mostrar la evidencia, su nivel (A–D) y lo que *no* sabemos («en revisión») refuerza la credibilidad del mensaje.
5. **Interacción personal.** Un modo «¿cómo lo dices tú?» en el que el visitante elige sus palabras y el mapa muestra con qué países coincide. Esto convierte la diversidad en algo propio. Más adelante podría recoger datos con consentimiento.
6. **Falsos amigos como gancho** (véase §1.5, punto 4): son memorables y muestran que ninguna variedad es «la normal».
7. **Citación fácil.** Cada vista tiene una URL propia (`#concepto=pajita&pais=CHL`) y la página de metodología incluye una cita sugerida.

### 1.7 Fases de investigación

| Fase | Trabajo | Resultado |
|---|---|---|
| R1 (hecha) | Recolección automática: Wikcionario y fuentes web | `data/crudo/`, `data/procesado/`, `docs/analisis/` |
| R2 | Revisión manual de los 23 conceptos: confirmar o descartar cada variante «en revisión» | Semilla depurada |
| R3 | Verificación con VARILEX y DAMER; frecuencias con CORPES XXI | Campo `frecuencia` y fuentes de nivel A |
| R4 | Ampliar a unos 40 conceptos y elegir los 15–20 de mayor cobertura | Conjunto final |
| R5 | Capa de etimología (lengua de origen de cada variante) | Campo `origen` |

---

## 2. Plan de programación

### 2.1 Tecnología

- **HTML, CSS y JavaScript (módulos ES)** sin *framework* ni compilación, para que GitHub Pages sirva los archivos tal cual.
- **D3 v7.9.0** para la proyección y el dibujo del SVG, y **topojson-client 3.1.0** para la geometría, ambos desde jsDelivr con versión fija.
- **Python 3 con la biblioteca estándar** para la recolección y el procesamiento, sin dependencias que instalar.
- **Geometría:** Natural Earth 1:50m (vía world-atlas 2.0.2), recortada a las Américas más España. Pesa unos 240 KB.

### 2.2 Estructura de archivos

```
latam-linguistica/
├── index.html                  Mapa principal
├── acerca.html                 Metodología, fuentes, cita sugerida   (pendiente)
├── css/estilo.css              Variables de diseño (paleta, tipografía) y componentes
├── js/
│   ├── main.js                 Arranque: conecta datos, estado, mapa y panel
│   ├── datos.js                Carga de JSON e índices (país → variantes)
│   ├── estado.js               Estado único + sincronización con la URL (#concepto=…)
│   ├── mapa.js                 Proyección, dibujo, recuadro de España, etiquetas
│   └── panel.js                Fichas: concepto, país, palabra
├── data/
│   ├── conceptos_semilla.json  ✎ EDITABLE: conceptos, glosas y variantes candidatas
│   ├── fuentes_web.json        ✎ EDITABLE: fuentes web por país y su nivel
│   ├── crudo/                  Descargas (las páginas web no se suben a git)
│   │   ├── categorias/         Wikcionario: palabras por país
│   │   ├── apendices/          Wikcionario: apéndices de país
│   │   ├── entradas/           Wikcionario: entradas de cada variante (caché)
│   │   └── web/                HTML de las fuentes web (.gitignore)
│   ├── procesado/              ⚙ GENERADO: lo que lee el sitio
│   │   ├── conceptos.json      Conceptos → variantes → países + evidencia
│   │   ├── lemas.json          Palabra → países (buscador)
│   │   └── lemas_web.json      Encabezados extraídos de cada fuente web
│   └── geo/americas.topo.json  ⚙ GENERADO: geometría
├── scripts/
│   ├── cosechar_wikcionario.py Descarga categorías y apéndices
│   ├── descargar_web.py        Descarga fuentes web (con paginación)
│   ├── extraer_web.py          Una regla de extracción por sitio
│   ├── procesar.py             Verifica variantes por acepción → conceptos.json
│   ├── analizar.py             Estadísticas e informe → docs/analisis/
│   └── preparar_geo.py         Recorta la geometría
└── docs/
    ├── PLAN.md                 Este documento
    ├── INVESTIGACION.md        Fuentes anotadas y hallazgos
    └── analisis/               Informe y tablas CSV generados
```

### 2.3 Flujo de datos

```
 Wikcionario API ──► cosechar_wikcionario.py ──► crudo/categorias, crudo/apendices ─┐
 Fuentes web ──────► descargar_web.py ─► crudo/web ─► extraer_web.py ─► lemas_web.json ┤
                                                                                     ├─► analizar.py ─► docs/analisis/ + lemas.json
 conceptos_semilla.json (curado) ─────► procesar.py (+ caché de entradas) ──────────┴─► conceptos.json
                                                                                              │
                                                                         index.html + js/ ◄───┘
```

### 2.4 Modelo de datos (`conceptos.json`)

```json
{
  "id": "pajita", "concepto": "pajita para beber", "campo": "objetos cotidianos",
  "definicion": "Tubo delgado para sorber líquidos.",
  "variantes": [
    { "forma": "popote", "paises": ["MEX"], "estado": "verificado", "general": false,
      "paises_web": [],
      "evidencia": [{ "pais": "MEX", "fuente": "Wikcionario", "url": "…", "sentido": "…" }] }
  ],
  "sugerencias": ["…sinónimos hallados en el Wikcionario que aún no están en la semilla…"]
}
```

Campos previstos para las fases siguientes: `frecuencia` (CORPES XXI, por país), `origen` (lengua de origen), `region` (subnacional) y `nivel` (A–D) en cada evidencia.

### 2.5 Lógica del programa

1. `main.js` carga la geometría, los conceptos y el índice de palabras en paralelo.
2. `estado.js` guarda un único objeto `{modo, concepto, pais, palabra}`. Cada cambio reescribe la URL y avisa a los suscriptores. Al cargar, se lee la URL, así que cualquier vista se puede enlazar.
3. **Modo concepto:** se calcula país → variantes. `mapa.js` colorea cada país (fase 1: intensidad según el número de variantes; fase 2: un color por variante) y rotula la variante principal. `panel.js` muestra la ficha con la evidencia.
4. **Modo palabra:** el buscador normaliza la consulta (sin tildes ni mayúsculas), la busca en `lemas.json` y resalta los países.
5. **Clic en un país:** abre su ficha con las variantes y los enlaces a las fuentes.

### 2.6 Funciones previstas

| Prioridad | Función |
|---|---|
| Alta | Página `acerca.html` (método, niveles de fuente, limitaciones, cita sugerida) · leyenda por variante (fase 2) · vista móvil |
| Media | Modo «¿cómo lo dices tú?» · capa de etimología · falsos amigos · comparar dos países |
| Baja | Zonas dialectales · exportar datos (CSV) · versión en inglés |

### 2.7 Calidad y publicación

- `scripts/validar.py` (pendiente) comprobará que cada variante del mapa tenga evidencia y una URL válida, y que no haya códigos de país desconocidos.
- **Publicación:** Settings → Pages → *Deploy from a branch* → `main` / raíz. La URL será https://mck-makes-stuff.github.io/latam-linguistica/.
- **Para ver el sitio en local:** `python3 -m http.server 8766`.
- **Accesibilidad:** el SVG lleva título, el panel usa `aria-live` y el contraste de la paleta cumple WCAG AA. En la fase 2, el color no debe ser el único canal: las etiquetas de texto se mantienen.

---

## 3. Plan de diseño

### 3.1 Principios

- **Sobrio y moderno:** mucho blanco, tipografía con carácter y sin decoración superflua.
- **El dato es el protagonista:** el mapa ocupa el espacio principal y el panel lateral explica.
- **El color tiene significado:** en la fase 1 todo es neutro, así que cuando llegue el color en la fase 2 significará algo (una variante).

### 3.2 Paleta (fase 1)

| Variable | Hex | Uso |
|---|---|---|
| `--blanco` | `#ffffff` | Mapa, tarjetas |
| `--crema` | `#f8f3ea` | Fondo de página |
| `--crema-2` | `#f0e7d8` | Paneles, etiquetas |
| `--arena` | `#e4d5bc` | Países sin dato |
| `--tostado` | `#c9ad84` | Acento |
| `--tostado-2` | `#a2845b` | Enlaces, hover |
| `--tinta` | `#3a3029` | Texto (contraste AA sobre crema) |
| `--dato-1…4` | `#e1cfae` → `#8f7148` | Escala monocroma provisional |

En la fase 2 sólo cambian las variables `--dato-*`: el mapa pasará a una paleta **categórica** (un color por variante) sobre la misma base crema, comprobando el contraste y la distinción para daltonismo.

### 3.3 Tipografía

- **Fraunces** (serif moderna) para los títulos: tono editorial y académico.
- **Inter** para la interfaz y el texto: muy legible en tamaños pequeños.

### 3.4 Composición

- **Escritorio:** mapa (unos ⅔ del ancho) y panel lateral fijo de 360 px.
- **Móvil (<900 px):** una sola columna, con el panel debajo del mapa y márgenes de 16 px.
- **Mapa:** proyección cónica equivalente centrada en 75° O; los países sin hispanohablantes en tono casi blanco; fronteras blancas finas; el país activo con contorno en `--tinta`.
- **Recuadro de España:** arriba a la derecha, sobre el Atlántico, con fondo crema y el rótulo «España (comparación)».
- **Etiquetas:** la variante principal sobre cada país, con halo blanco para que se lea encima de cualquier relleno.

### 3.5 Próximos pasos de diseño

1. Revisar el mapa en pantalla (escritorio y móvil) y ajustar los tamaños de etiqueta en los países pequeños (Centroamérica y el Caribe), quizá con líneas guía.
2. Diseñar la página `acerca.html` con el mismo sistema.
3. Fase 2: elegir la paleta categórica de 8–10 tonos y validar su contraste y su legibilidad para daltonismo.
