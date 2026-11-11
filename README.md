# Un concepto, muchas palabras

Mapa interactivo de la variación léxica del español en los diecinueve países hispanohablantes de América Latina (más Puerto Rico). Todo el sitio está en español.

**Sitio:** https://mck-makes-stuff.github.io/latam-linguistica/

## Objetivo

Hacer visible la diversidad del español: un mismo concepto (las *palomitas*, la *pajita*, el *autobús*) se nombra de formas distintas según el país, y ninguna de ellas es «más correcta» que otra.

## Cómo ver el sitio en local

```bash
python3 -m http.server 8766
```

Luego abre http://localhost:8766. (Los módulos de JavaScript no funcionan abriendo `index.html` directamente.)

## Cómo actualizar los datos

```bash
python3 scripts/cosechar_wikcionario.py   # descarga categorías y apéndices del Wikcionario (lento: respeta la API)
python3 scripts/procesar.py               # cruza conceptos_semilla.json con lo descargado -> data/procesado/
python3 scripts/analizar.py               # estadísticas para la investigación -> docs/analisis/
python3 scripts/preparar_geo.py           # sólo si cambia la geometría
```

## Estructura

Ver [`docs/PLAN.md`](docs/PLAN.md) (plan de investigación, programación y diseño) e [`docs/INVESTIGACION.md`](docs/INVESTIGACION.md) (fuentes anotadas y hallazgos).

## Licencias

- Código: MIT.
- Datos léxicos derivados del [Wikcionario](https://es.wiktionary.org/) bajo [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.es); los archivos en `data/` heredan esa licencia.
- Geometría: Natural Earth (dominio público) vía [world-atlas](https://github.com/topojson/world-atlas).
