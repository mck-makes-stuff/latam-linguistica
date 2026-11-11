#!/usr/bin/env python3
"""
Análisis exploratorio de las categorías regionales del Wikcionario.

Responde a la pregunta de investigación 1:
  ¿Qué palabras son más «identificables»? -> las que aparecen en un solo país
  (marcadores nacionales) frente a las que comparten muchos países
  (americanismos generales), y qué países comparten más léxico entre sí.

Entrada:  data/crudo/categorias/*.json
Salida:   data/procesado/lemas.json          índice palabra -> países (para el buscador)
          docs/analisis/resumen.md           tablas comentadas
          docs/analisis/lemas_por_pais.csv   matriz palabra x país (1/0)
          docs/analisis/similitud_paises.csv índice de Jaccard entre países
"""
import csv, json, pathlib, collections, datetime, unicodedata

RAIZ = pathlib.Path(__file__).resolve().parent.parent
CAT = RAIZ / "data/crudo/categorias"
PROC = RAIZ / "data/procesado"
ANA = RAIZ / "docs/analisis"

LATAM = ["MEX", "GTM", "SLV", "HND", "NIC", "CRI", "PAN", "CUB", "DOM", "PRI",
         "VEN", "COL", "ECU", "PER", "BOL", "CHL", "PRY", "ARG", "URY"]
# Macrorregiones del Wikcionario -> países a los que se extienden en el mapa
MACRO = {"RIO_PLATA": ["ARG", "URY"], "CARIBE": ["CUB", "DOM", "PRI"]}


def norm(s):
    return "".join(c for c in unicodedata.normalize("NFD", s.lower().strip()) if unicodedata.category(c) != "Mn")


def cargar_web():
    """Lemas de las listas web por país (normalizados), separando la serie jergozo."""
    f = PROC / "lemas_web.json"
    if not f.exists():
        return {}, {}
    aportadas, jergozo = collections.defaultdict(set), collections.defaultdict(set)
    for fu in json.loads(f.read_text())["fuentes"]:
        destino = jergozo if fu.get("serie") == "jergozo" else aportadas
        destino[fu["pais"]] |= {norm(l) for l in fu["lemas"]}
    return aportadas, jergozo


def cargar():
    datos = {}
    for f in sorted(CAT.glob("*.json")):
        d = json.loads(f.read_text())
        datos[d["codigo"]] = d
    return datos


def main():
    datos = cargar()
    nombres = {c: d["nombre"] for c, d in datos.items()}
    PROC.mkdir(parents=True, exist_ok=True)
    ANA.mkdir(parents=True, exist_ok=True)

    # palabra -> conjunto de países LATAM (directos) y etiquetas macro
    directos = collections.defaultdict(set)
    macro = collections.defaultdict(set)
    espana = set(datos.get("ESP", {}).get("lemas", []))
    for c in LATAM:
        for l in datos.get(c, {}).get("lemas", []):
            directos[l].add(c)
    for m in MACRO:
        for l in datos.get(m, {}).get("lemas", []):
            macro[l].add(m)

    # Índice para el buscador del sitio (países directos + extensión de macrorregiones)
    indice = {}
    for l in sorted(set(directos) | set(macro) | espana):
        paises = set(directos.get(l, ()))
        for m in macro.get(l, ()):
            paises |= set(MACRO[m])
        if l in espana:  # España como punto de comparación en el buscador
            paises.add("ESP")
        indice[l] = sorted(paises)
    (PROC / "lemas.json").write_text(json.dumps(
        {"generado": datetime.date.today().isoformat(),
         "nota": "Palabra -> países donde el Wikcionario la marca como regional (incluye Río de la Plata -> ARG+URY, Caribe -> CUB+DOM+PRI y España -> ESP).",
         "lemas": indice}, ensure_ascii=False, separators=(",", ":")))

    # Matriz palabra x país
    with open(ANA / "lemas_por_pais.csv", "w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["lema", "n_paises"] + LATAM + ["RIO_PLATA", "CARIBE", "ESP"])
        directos = dict(directos)
        for l in sorted(set(directos) | set(macro)):
            w.writerow([l, len(directos.get(l, ()))] + [int(c in directos.get(l, ())) for c in LATAM]
                       + [int("RIO_PLATA" in macro[l]), int("CARIBE" in macro[l]), int(l in espana)])

    # Distribución por difusión
    dist = collections.Counter(len(p) for p in directos.values() if p)
    exclusivos = {c: sorted(l for l, p in directos.items() if p == {c}) for c in LATAM}
    generales = sorted(((len(p), l) for l, p in directos.items() if len(p) >= 6), reverse=True)

    # Similitud entre países (Jaccard)
    conj = {c: set(datos.get(c, {}).get("lemas", [])) for c in LATAM}
    jac = {(a, b): (len(conj[a] & conj[b]) / len(conj[a] | conj[b]) if conj[a] | conj[b] else 0)
           for a in LATAM for b in LATAM}
    with open(ANA / "similitud_paises.csv", "w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow([""] + LATAM)
        for a in LATAM:
            w.writerow([a] + [f"{jac[a, b]:.3f}" for b in LATAM])

    # --- Informe -----------------------------------------------------------
    L = []
    L.append("# Análisis de las categorías regionales del Wikcionario\n")
    L.append(f"Generado el {datetime.date.today().isoformat()} por `scripts/analizar.py`. "
             "Fuente: categorías `Categoría:ES:<país>` del Wikcionario en español (CC BY-SA 4.0).\n")
    L.append("> **Advertencia metodológica.** El número de palabras por país refleja la actividad de los editores del "
             "Wikcionario, no la riqueza léxica real de cada variedad. Las comparaciones deben normalizarse "
             "(proporciones, Jaccard) y contrastarse con fuentes lexicográficas (DAMER, Varilex).\n")

    L.append("## 1. Palabras registradas por país\n")
    L.append("| País | Código | Lemas | Exclusivos (sólo ese país) | % exclusivos |")
    L.append("|---|---|---:|---:|---:|")
    for c in sorted(LATAM, key=lambda c: -len(conj[c])):
        n = len(conj[c]); e = len(exclusivos[c])
        L.append(f"| {nombres.get(c, c)} | {c} | {n} | {e} | {100*e/n:.0f}% |" if n else f"| {c} | {c} | 0 | 0 | — |")
    for m in MACRO:
        if m in datos:
            L.append(f"| *{nombres[m]}* (macrorregión) | {m} | {len(datos[m]['lemas'])} | — | — |")
    L.append("")

    L.append("## 2. Difusión: ¿en cuántos países se marca cada palabra?\n")
    L.append("| Nº de países | Nº de palabras |")
    L.append("|---:|---:|")
    for k in sorted(dist):
        L.append(f"| {k} | {dist[k]} |")
    L.append("\nLa gran mayoría de las palabras aparecen en un solo país: son **marcadores nacionales** "
             "potenciales, pero también pueden reflejar que nadie ha documentado su uso en otros lugares.\n")

    L.append("## 3. Americanismos más extendidos (6 países o más)\n")
    L.append("Estas palabras son buenas candidatas para mostrar lo que **une** a las variedades americanas "
             "(sobre todo si no están marcadas para España).\n")
    L.append("| Palabra | Países | ¿También marcada en España? | Lista |")
    L.append("|---|---:|:---:|---|")
    for n, l in generales[:80]:
        L.append(f"| [{l}](https://es.wiktionary.org/wiki/{l.replace(' ', '_')}) | {n} | {'sí' if l in espana else ''} | {', '.join(sorted(directos[l]))} |")
    L.append("")

    L.append("## 4. Pares de países con más léxico compartido (Jaccard)\n")
    pares = sorted(((jac[a, b], a, b) for i, a in enumerate(LATAM) for b in LATAM[i+1:]), reverse=True)
    L.append("| País A | País B | Jaccard | Compartidas |")
    L.append("|---|---|---:|---:|")
    for j, a, b in pares[:20]:
        L.append(f"| {nombres.get(a,a)} | {nombres.get(b,b)} | {j:.3f} | {len(conj[a] & conj[b])} |")
    L.append("\nLos pares vecinos (Argentina–Uruguay, países centroamericanos) deberían puntuar alto; "
             "si no lo hacen, es señal de lagunas en la documentación.\n")

    L.append("## 5. Muestra de marcadores exclusivos por país\n")
    for c in LATAM:
        muestra = exclusivos[c][:40]
        L.append(f"- **{nombres.get(c,c)}** ({len(exclusivos[c])}): {', '.join(muestra)}{' …' if len(exclusivos[c]) > 40 else ''}")
    L.append("")
    # --- Triangulación con las fuentes web --------------------------------
    aportadas, jergozo = cargar_web()
    if aportadas or jergozo:
        wik = {c: {norm(l) for l in conj[c]} for c in LATAM}
        L.append("## 6. Triangulación: Wikcionario + listas web\n")
        L.append("Una palabra es un **marcador nacional fuerte** cuando el Wikcionario la marca sólo para un país "
                 "*y* aparece en al menos una lista web independiente de ese mismo país. "
                 "Las listas web no confirman la acepción, pero sí que la forma circula como rasgo identitario.\n")
        L.append("| País | Lemas web (aportadas) | Lemas jergozo | Coinciden con Wikcionario | Marcadores fuertes |")
        L.append("|---|---:|---:|---:|---:|")
        fuertes = {}
        excl_norm = {c: {norm(l) for l in exclusivos[c]} for c in LATAM}
        for c in LATAM:
            webc = aportadas.get(c, set()) | jergozo.get(c, set())
            fuertes[c] = sorted(excl_norm[c] & webc)
            L.append(f"| {nombres.get(c,c)} | {len(aportadas.get(c, ()))} | {len(jergozo.get(c, ()))} | "
                     f"{len(wik[c] & webc)} | {len(fuertes[c])} |")
        L.append("")
        for c in LATAM:
            if fuertes[c]:
                L.append(f"- **{nombres.get(c,c)}**: {', '.join(fuertes[c][:40])}{' …' if len(fuertes[c]) > 40 else ''}")
        L.append("")

        # Difusión combinada: nº de países en que CUALQUIER fuente registra la palabra
        todas = collections.defaultdict(set)
        for c in LATAM:
            for l in wik[c] | aportadas.get(c, set()) | jergozo.get(c, set()):
                todas[l].add(c)
        L.append("## 7. Palabras registradas en más países (todas las fuentes)\n")
        L.append("Candidatas para conceptos «panamericanos» o para mostrar falsos amigos entre países "
                 "(misma forma, distinto significado). Revisar el sentido en cada país antes de mapear.\n")
        L.append("| Palabra | Países | En España (Wikcionario/jergozo) |")
        L.append("|---|---:|:---:|")
        esp = {norm(l) for l in espana} | jergozo.get("ESP", set())
        for l, ps in sorted(todas.items(), key=lambda x: -len(x[1]))[:60]:
            L.append(f"| {l} | {len(ps)} | {'sí' if l in esp else ''} |")
        L.append("")

    (ANA / "resumen.md").write_text("\n".join(L))
    escribir_inventario(datos, nombres)
    print(f"{len(indice)} lemas en el índice; informe en {(ANA / 'resumen.md').relative_to(RAIZ)}")


NIVEL = {"lexicografica": "B", "divulgativa": "C", "comercial": "D", "colaborativa": "D"}


def escribir_inventario(datos, nombres):
    """Lista única de todas las palabras con su país, fuente, enlace y nivel,
    y docs/FUENTES.md con todos los enlaces y el número de palabras de cada uno."""
    filas = []
    for c, d in datos.items():
        for l in d["lemas"]:
            filas.append([l, c, "Wikcionario (categoría)", d["fuente"], "B"])
    web = json.loads((PROC / "lemas_web.json").read_text())["fuentes"] if (PROC / "lemas_web.json").exists() else []
    for f in web:
        for l in f["lemas"]:
            filas.append([l, f["pais"], f["url"].split("/")[2].removeprefix("www."), f["url"], NIVEL.get(f["tipo"], "D")])
    with open(ANA / "todas_las_palabras.csv", "w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["palabra", "pais", "fuente", "url", "nivel"])
        w.writerows(sorted(filas, key=lambda r: (r[1], norm(r[0]))))

    F = ["# Fuentes: enlaces y número de palabras\n",
         f"Generado por `scripts/analizar.py` el {datetime.date.today().isoformat()}. "
         "Niveles: A = lexicografía académica · B = Wikcionario · C = divulgación · D = colaborativa o comercial. "
         "Lista completa de palabras: [`analisis/todas_las_palabras.csv`](analisis/todas_las_palabras.csv).\n",
         "## Wikcionario: categorías por país\n", "| Código | Territorio | Palabras | Enlace |", "|---|---|---:|---|"]
    for c, d in sorted(datos.items()):
        F.append(f"| {c} | {d['nombre']} | {len(d['lemas'])} | [{d['fuente'].split('/wiki/')[1]}]({d['fuente']}) |")
    ind = RAIZ / "data/crudo/indice_fuentes.json"
    if ind.exists():
        F += ["", "## Wikcionario: apéndices\n", "| Apéndice | Enlaces a entradas | Enlace |", "|---|---:|---|"]
        for a in json.loads(ind.read_text())["apendices"].values():
            F.append(f"| {a['titulo']} | {a['n_enlaces']} | [ver]({a['url']}) |")
    F += ["", "## Fuentes web\n", "| País | Nivel | Palabras extraídas | Método | Enlace |", "|---|:---:|---:|---|---|"]
    for f in sorted(web, key=lambda f: (f["pais"], f.get("serie", ""))):
        F.append(f"| {nombres.get(f['pais'], f['pais'])} | {NIVEL.get(f['tipo'], 'D')} | {f['n']} | {f['metodo']} | {f['url']} |")
    (RAIZ / "docs/FUENTES.md").write_text("\n".join(F) + "\n")


if __name__ == "__main__":
    main()
