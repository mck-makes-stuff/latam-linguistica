# Investigación: fuentes anotadas y hallazgos

Estado a 11 de noviembre de 2026. Las cifras proceden de los scripts de `scripts/` y se regeneran con ellos.

- Todas las fuentes con su enlace y su número de palabras: [`FUENTES.md`](FUENTES.md)
- Todas las palabras (palabra, país, fuente, enlace, nivel): [`analisis/todas_las_palabras.csv`](analisis/todas_las_palabras.csv)
- Tablas completas del análisis: [`analisis/resumen.md`](analisis/resumen.md)

---

## 1. Fuentes anotadas

### Nivel A: lexicografía académica y corpus (verificación; aún por incorporar)

- **Asociación de Academias de la Lengua Española (2010). *Diccionario de americanismos* (DAMER).** https://www.asale.org/damer/
  Unos 70 000 americanismos con marcas de país. Es la referencia normativa para verificar que una acepción es propia de un país. Se consulta en línea; no hay descarga masiva, así que la revisión es manual, concepto por concepto.
- **RAE y ASALE. *Diccionario de la lengua española* (DLE), 23.ª ed. actualizada.** https://dle.rae.es/
  Sus marcas geográficas (*Am.*, *Méx.*, *Arg.*…) sirven de contraste. Conviene recordar que tiende a marcar como regional lo americano y como no marcado lo peninsular: es un sesgo que el sitio debe explicar, no reproducir.
- **Ueda, H. y Ruiz Tinoco, A. (2003). *VARILEX: Variación léxica del español en el mundo*. Iberoamericana/Vervuert.** Proyecto actual **VARILEX-R** (Ueda y Moreno-Fernández): https://hcias.uni-heidelberg.de/en/research-at-the-hcias/ongoing-projects-at-the-hcias/variacion-lexica-en-espanol-del-mundo-varilex-r
  Encuestas onomasiológicas (concepto → palabra) por ciudad, con más de 1 100 conceptos. **Es la fuente más afín a este sitio** y la prioridad número uno para verificar. Descripción del método: Ueda, «The VARILEX Project», *Linguistica Atlantica*: https://journals.lib.unb.ca/index.php/la/article/view/22632
- **RAE. *Corpus del Español del Siglo XXI* (CORPES XXI).** https://apps2.rae.es/CORPES/
  Permite filtrar por país y obtener frecuencias normalizadas. Sirve para decidir qué variante es la **dominante** en cada país, no sólo cuáles existen.
- **Davies, M. *Corpus del Español: Web/Dialects*.** https://www.corpusdelespanol.org/
  Unos 2 000 millones de palabras de la web clasificadas por país. Complementa al CORPES con registros informales.
- **PRESEEA (Proyecto para el Estudio Sociolingüístico del Español de España y de América).** https://preseea.uah.es/
  Corpus oral por ciudades. Útil para la variación social dentro de cada país, en una fase posterior.

### Nivel B: Wikcionario en español (base de datos actual)

- **Categorías `Categoría:ES:<país>`.** Se descargaron 24 territorios: 19 de Latinoamérica más España, EE. UU., Guinea Ecuatorial, Río de la Plata y Caribe. Hay **11 328 regionalismos americanos** únicos. Licencia CC BY-SA 4.0.
  *Fortaleza:* cada acepción lleva la plantilla `{{ámbito|País}}`, lo que permite verificar por **sentido** y no sólo por palabra (*guagua* = autobús en Cuba, la República Dominicana y Puerto Rico, pero = bebé en Chile, Perú, Ecuador y Bolivia).
  *Debilidad:* la cobertura es muy desigual (Argentina, 3533 palabras; Panamá, 315), y las formas generales (*aguacate*, *maní*, *piscina*) no llevan marca, así que el país que usa la forma general «desaparece» del mapa.
- **Apéndices de país:** Nicaraguanismos, Costarriqueñismos, Panameñismos, Salvadoreñismos, Colombianismos, Modismos de la Amazonía peruana y *Variantes regionales*. Son listas editoriales, más antiguas y menos estructuradas que las categorías.

### Niveles C y D: fuentes web aportadas (21 enlaces) y serie jergozo

Véase la tabla completa en [`FUENTES.md`](FUENTES.md). Valoración por fuente:

| País | Fuente | Nivel | Observaciones |
|---|---|:---:|---|
| Argentina | tango.blue (lunfardo) | C | 114 voces del lunfardo, glosadas en inglés. Representa un registro histórico y porteño, no el habla general argentina. |
| Bolivia | FluentU | D | 44 entradas. Blog comercial en inglés; mezcla quechuismos y coloquialismos. |
| Chile | Marca Chile | C | 145 modismos. Organismo oficial de imagen país: fiable como muestra de lo que se considera identitario. |
| Colombia | Quillbot | C | 97 palabras clasificadas por campo. Bloquea las descargas automáticas: se copiaron a mano desde el navegador. |
| Costa Rica | Nada Incluido | D | 223 entradas. Blog de viajes con equivalencias peninsulares. |
| Cuba | VisitCuba · CiberCuba | D · C | 10 + 77 entradas. CiberCuba reseña un diccionario de cubanismos. |
| R. Dominicana | Colonial Tours | D | 490 entradas. Agencia de turismo; lista larga pero sin método declarado. |
| Ecuador | LinguaLinkup | D | 70 entradas, en inglés. |
| El Salvador | jergozo | D | Unas 4800 entradas colaborativas. Mucho volumen y mucho ruido. |
| Guatemala | Chapinísima | — | **No es una lista de palabras** sino el índice de un blog: no se extrajo nada. Se recomienda sustituirla (véase §3). |
| Honduras | Scribd | — | Scribd no sirve el texto sin sesión iniciada: no se extrajo nada. Hay que conseguir el documento por otra vía o sustituirlo. |
| México | Visión Lingüística | C | Tabla de 182 formas que compara el norte con el centro y el sur. Es la **única fuente con variación interna**: útil para la futura fase de zonas. |
| Nicaragua | Wikcionario (apéndice) | B | 688 entradas. |
| Panamá | Wiktionary (inglés) | B | 306 entradas. Glosario editado; buena calidad. |
| Paraguay | diccionariolibre | D | 612 entradas colaborativas. Incluye guaranismos y préstamos del jopara. |
| Perú · Venezuela | Psicología y Mente | C | 122 y 127 expresiones. Divulgación; sobre todo fraseología. |
| Uruguay | jergozo | D | Unas 1000 entradas. |
| Puerto Rico · España | jergozo | D | Añadidos al retirar Brasil y Haití. **Falta una fuente C o A para Puerto Rico:** el *Tesoro lexicográfico del español de Puerto Rico* (Academia Puertorriqueña de la Lengua Española) sería la ideal. |
| Todos | jergozo (serie uniforme) | D | Se descargó el diccionario de cada uno de los 20 países con el mismo método, para comparar con un criterio homogéneo. Es colaborativo: sólo vale como indicio. |

**Derechos de autor:** de las fuentes C y D sólo se guardan las palabras encabezado y el enlace. Las páginas descargadas no se suben al repositorio.

---

## 2. Hallazgos para la pregunta 1: ¿qué rasgos son más identificables?

### 2.1 Conceptos con mejor cobertura (de `procesar.py`, variantes verificadas por acepción)

| Concepto | Países con variante (de 19) | Variantes distintas | Comentario |
|---|---:|---:|---|
| frijol | 18 | 7 | *poroto* (Cono Sur), *caraota* (Venezuela), *frejol* (Perú, Ecuador). Excelente para el mapa. |
| coche | 18 | 5 | *carro* frente a *auto*: un contraste norte–sur claro. |
| niño | 17 | 13 | El de mayor diversidad: *chamaco*, *patojo*, *cipote*, *chamo*, *guagua*, *gurí*, *botija*… |
| autobús | 12 | 8 | *guagua*, *camión*, *bondi*, *micro*, *buseta*, *chiva*. |
| palomitas | 11 | 11 | *pochoclo*, *pororó*, *cotufa*, *canchita*, *crispeta*, *poporopo*, *canguil*, *cocaleca*. |
| genial | 11 | 9 | *chévere*, *chido*, *bacán*, *macanudo*, *chimba*, *pulento*. |
| pajita | 10 | 6 | *popote*, *pitillo*, *bombilla*, *sorbete*, *pajilla*. |
| camiseta | 10 | 7 | *playera*, *remera*, *polera*, *franela*. |
| aguacate, cacahuete, piscina, guisante | 2–9 | 2 | La forma general (*aguacate*, *maní*, *piscina*) no lleva marca en el Wikcionario. Hacen falta VARILEX o CORPES. |

**Conclusión:** los conceptos que mejor funcionan son los que **cada** país nombra con una palabra propia y marcada (*frijol*, *niño*, *autobús*, *palomitas*). Donde un grupo de países usa la forma general, el Wikcionario deja huecos. La recomendación es usar VARILEX para llenar esos huecos antes de publicar el concepto.

### 2.2 Marcadores nacionales fuertes (Wikcionario y lista web del mismo país coinciden)

Ejemplos (lista completa en `analisis/resumen.md` §6):
*mae*, *zaguate*, *cabanga* (Costa Rica) · *asere*, *fula* (Cuba) · *pariguayo*, *locrio* (R. Dominicana) · *chamo*, *cambur*, *corotos* (Venezuela) · *parce*, *guámbito*, *pola* (Colombia) · *guambra* (Ecuador) · *causa*, *pata* (Perú) · *fome*, *cahuín*, *once*, *carrete* (Chile) · *curepa* (Paraguay) · *bo*, *ta*, *bichicome* (Uruguay) · *chido*, *troca*, *huerco* (México) · *ideay* (Nicaragua) · *chombo*, *qué xopá* (Panamá).
Son los más **identificables**, buenos para un modo de adivinanza («¿de dónde es esta palabra?»).

### 2.3 Lo que comparten muchos países

- **Afinidad léxica (índice de Jaccard):** Argentina–Uruguay (0,41) muy por delante; después los bloques centroamericano (El Salvador–Honduras–Nicaragua–Guatemala), andino (Perú–Bolivia–Ecuador) y antillano (R. Dominicana–Puerto Rico). Coincide con las zonas dialectales clásicas, lo que respalda el paso futuro a zonas.
- **Palabras marcadas en más países:** *pendejo* y *chiva* (19), *epa* (17), *mamadera*, *barrilete* y *piña* (16). Casi todas cambian de **significado** según el país. Son candidatas ideales para una sección de **falsos amigos**; por ejemplo, *pendejo* puede significar «tonto», «cobarde» o «adolescente» según el país, y conviene comprobarlo en el DAMER antes de publicarlo.

### 2.4 Sesgos que hay que declarar

1. **Cobertura desigual:** Argentina y Chile aportan el 30 % de las entradas. La proporción de palabras exclusivas varía del 6 % (Uruguay, que comparte mucho con Argentina) al 53 % (Chile).
2. **Formas generales invisibles:** la herramienta detecta lo marcado, no lo general. Un país «vacío» en el mapa no significa que no tenga palabra para el concepto.
3. **Registro:** las fuentes C y D sobrerrepresentan la jerga y el lenguaje soez. Los conceptos del mapa deben ser de registro neutro o coloquial común.

---

## 3. Próximos pasos de investigación (en orden)

1. **Revisar a mano** las variantes «en revisión» y «sin datos» de los 23 conceptos (`data/procesado/conceptos.json`) y añadir las **sugerencias** que el script encontró entre los sinónimos (p. ej. *canguil* y *chulpi* para las palomitas).
2. **Verificar con VARILEX-R** los conceptos de §2.1, empezando por los huecos de *aguacate*, *cacahuete*, *piscina* y *guisante*.
3. **Frecuencias con CORPES XXI** para elegir la variante dominante por país.
4. **Sustituir las fuentes fallidas:** Guatemala (el enlace es un índice de blog), Honduras (Scribd) y una fuente de nivel A o C para Puerto Rico.
5. **Ampliar la semilla** a unos 40 conceptos y quedarse con los 15–20 de mayor cobertura.
6. **Etimología:** marcar la lengua de origen (náhuatl, quechua, guaraní, italiano, inglés…) de cada variante.
