#!/usr/bin/env python3
"""
Calcula las cifras de la página de metodología y las escribe en acerca.html,
entre marcadores <!-- NOMBRE --> ... <!-- /NOMBRE -->.

Reproduce exactamente los cálculos del sitio (js/datos.js y js/quiz.js):
  - variante principal de cada país, poder distintivo (entropía normalizada)
  - simulación del cuestionario (puntuación, softmax con temperatura 2, selección por entropía)
Uso:  python3 scripts/metodologia.py
"""
import collections, html, json, math, pathlib, unicodedata

RAIZ = pathlib.Path(__file__).resolve().parent.parent
PAISES = ["MEX", "GTM", "SLV", "HND", "NIC", "CRI", "PAN", "CUB", "DOM", "PRI",
          "VEN", "COL", "ECU", "PER", "BOL", "CHL", "PRY", "ARG", "URY", "ESP"]
NOMBRES = {"MEX": "México", "GTM": "Guatemala", "SLV": "El Salvador", "HND": "Honduras", "NIC": "Nicaragua",
           "CRI": "Costa Rica", "PAN": "Panamá", "CUB": "Cuba", "DOM": "República Dominicana", "PRI": "Puerto Rico",
           "VEN": "Venezuela", "COL": "Colombia", "ECU": "Ecuador", "PER": "Perú", "BOL": "Bolivia", "CHL": "Chile",
           "PRY": "Paraguay", "ARG": "Argentina", "URY": "Uruguay", "ESP": "España",
           "USA": "Estados Unidos", "GNQ": "Guinea Ecuatorial", "RIO_PLATA": "Río de la Plata (categoría)", "CARIBE": "Caribe (categoría)"}
GRUPOS = {"indigena": "Lenguas indígenas de América", "herencia": "Herencia latina y peninsular",
          "formacion": "Creación dentro del español", "italiano": "Italiano e inmigración", "ingles": "Contacto con el inglés",
          "europeo": "Francés, portugués y otras lenguas europeas", "africano": "Lenguas africanas", "incierto": "Origen incierto o discutido"}
MAX_PREGUNTAS = 8
NINGUNA = "__ninguna__"
e = html.escape


def num(x, d=2):
    return f"{x:.{d}f}".replace(".", ",")


# --- Mismos cálculos que js/datos.js --------------------------------------------
def vista(c):
    vs = [dict(v, orden=i) for i, v in enumerate(c["variantes"]) if v["estado"] in ("verificado", "equipo") and v["paises"]]
    vs.sort(key=lambda v: (-len(v["paises"]), v["orden"]))
    por_pais = collections.defaultdict(list)
    for v in vs:
        for p in v["paises"]:
            por_pais[p].append(v["forma"])
    return vs, por_pais


def particion(por_pais):
    g = collections.Counter(por_pais[p][0] if por_pais.get(p) else "—" for p in PAISES)
    return g


def distincion(por_pais):
    g = particion(por_pais)
    h = -sum((n / len(PAISES)) * math.log2(n / len(PAISES)) for n in g.values())
    return h, h / math.log2(len(PAISES))


# --- Mismos cálculos que js/quiz.js ----------------------------------------------
def puntos(pp, elegidas):
    out = {}
    for iso in PAISES:
        propias = pp.get(iso, [])
        if NINGUNA in elegidas:
            out[iso] = -1 if propias else 1
        elif any(f in propias for f in elegidas):
            out[iso] = 2
        else:
            out[iso] = -1 if propias else 0
    return out


def pesos(m):
    mx = max(m.values())
    w = {k: math.exp((s - mx) / 2) for k, s in m.items()}
    t = sum(w.values())
    return {k: x / t for k, x in w.items()}


def siguiente(m, hechas, conceptos, pps):
    w = pesos(m)
    mejor, hmax = None, -1
    for c in conceptos:
        if c["id"] in hechas:
            continue
        dist = collections.defaultdict(float)
        for iso in PAISES:
            dist[pps[c["id"]][iso][0] if pps[c["id"]].get(iso) else "—"] += w[iso]
        h = -sum(p * math.log2(p) for p in dist.values() if p > 0)
        if h > hmax:
            hmax, mejor = h, c["id"]
    return mejor


def jugar(iso, limite, conceptos, pps):
    m = {p: 0 for p in PAISES}
    hechas = []
    while len(hechas) < limite:
        cid = siguiente(m, hechas, conceptos, pps)
        if not cid:
            break
        propias = pps[cid].get(iso, [])
        for p, x in puntos(pps[cid], propias or [NINGUNA]).items():
            m[p] += x
        hechas.append(cid)
    rank = sorted(pesos(m).items(), key=lambda kv: -kv[1])
    return rank, hechas


# --- Bloques HTML -----------------------------------------------------------------
def tabla(cab, filas, clase="datos"):
    return (f'<table class="{clase}"><thead><tr>' + "".join(f"<th>{c}</th>" for c in cab) + "</tr></thead><tbody>"
            + "".join("<tr>" + "".join(f"<td>{x}</td>" for x in f) + "</tr>" for f in filas) + "</tbody></table>")


def main():
    datos = json.loads((RAIZ / "data/procesado/conceptos.json").read_text())
    semilla = json.loads((RAIZ / "data/conceptos_semilla.json").read_text())["conceptos"]
    conceptos = [c for c in datos["conceptos"] if c["publicar"]]
    indice = json.loads((RAIZ / "data/crudo/indice_fuentes.json").read_text())
    web = json.loads((RAIZ / "data/procesado/lemas_web.json").read_text())["fuentes"]
    catalogo = json.loads((RAIZ / "data/fuentes_web.json").read_text())["fuentes"]
    equipo = json.loads((RAIZ / "data/registro_equipo.json").read_text())["registros"]
    manual = json.loads((RAIZ / "data/etimologias_manual.json").read_text())["etimologias"]
    lemas = json.loads((RAIZ / "data/procesado/lemas.json").read_text())["lemas"]
    revs = json.loads((RAIZ / "data/procesado/wikcionario_revisiones.json").read_text())
    bloques = {}

    # Fuentes
    norm = lambda s: "".join(c for c in unicodedata.normalize("NFD", s.lower()) if unicodedata.category(c) != "Mn")
    encabezados = f"{sum(f['n'] for f in web if f.get('n')):,}".replace(",", ".")
    lemas_pais = {(f["pais"], norm(l)) for f in web for l in f["lemas"]}
    con_lista = [r for r in equipo if (r["pais"], norm(r.get("lema", r["forma"]))) in lemas_pais]
    cats = indice["categorias"]
    filas = [[e(NOMBRES.get(k, k)), f'{v["n"]:,}'.replace(",", ".")] for k, v in sorted(cats.items(), key=lambda kv: -kv[1]["n"])]
    usadas = [f for f in web if f.get("n")]
    por_tipo = collections.Counter(f["tipo"] for f in catalogo)
    bloques["CIFRAS-FUENTES"] = (
        f"<p>Categorías regionales del Wikcionario consultadas el {e(indice['consultado'])} "
        f"({sum(v['n'] for v in cats.values()):,} asignaciones palabra–región; {len(lemas):,} palabras distintas en el índice del buscador):</p>".replace(",", ".")
        + '<ul class="cuadricula">' + "".join(f"<li><span>{a}</span><b>{b}</b></li>" for a, b in filas) + "</ul>"
        + f"<p>Listas web: {len(catalogo)} catalogadas, de las que {len(usadas)} aportaron palabras "
        f"({encabezados} encabezados en total). Por tipo: "
        + "; ".join(f"{e(t)}, {n}" for t, n in por_tipo.most_common()) + ". "
        f"Registro del equipo: {len(equipo)} pares concepto–país–palabra, de los que {len(con_lista)} aparecen "
        f"en alguna lista de su país y se usan.</p>")

    # Estados
    sem_pub = [c for c in semilla if c.get("publicar")]
    est = collections.Counter(v["estado"] for c in conceptos for v in c["variantes"])
    nombres_est = {"verificado": "verificado", "equipo": "registro del equipo", "americano": "americanismo general",
                   "general": "general (sin marca)", "parcial": "en revisión", "sin_datos": "sin datos"}
    bloques["CIFRAS-ESTADOS"] = (
        f"<p>{len(semilla)} conceptos en la semilla, {len(sem_pub)} publicados; "
        f"{sum(len(c['variantes']) for c in conceptos)} variantes candidatas en los conceptos publicados; "
        f"{len(revs)} entradas del Wikcionario citadas.</p>"
        + tabla(["Estado", "Variantes"], [[nombres_est[k], est.get(k, 0)] for k in nombres_est]))

    # Etimologías
    mapa_vs = [v for c in conceptos for v in vista(c)[0]]
    con = [v for v in mapa_vs if v.get("etimologia")]
    fuente = collections.Counter("Wikcionario" if v["etimologia"].get("fuente") == "Wikcionario" else "nota editorial" for v in con)
    grupos = collections.Counter(v["etimologia"]["grupo"] for v in con)
    bloques["CIFRAS-ETIMOLOGIA"] = (
        f"<p>De las {len(mapa_vs)} palabras del mapa, {len(con)} tienen etimología "
        f"({fuente['Wikcionario']} del Wikcionario, {fuente['nota editorial']} notas editoriales; {len(manual)} notas en total) "
        f"y {len(mapa_vs) - len(con)} quedan «sin documentar».</p>"
        + tabla(["Grupo de origen", "Palabras"], [[e(GRUPOS[g]), grupos.get(g, 0)] for g in GRUPOS]))

    # Poder distintivo
    filas, ejemplo = [], ""
    pps = {}
    for c in conceptos:
        vs, pp = vista(c)
        pps[c["id"]] = pp
        h, d = distincion(pp)
        nivel = "mucho" if d >= 0.5 else "bastante" if d >= 0.38 else "poco"
        g = particion(pp)
        filas.append((d, [e(c["corto"]), len(vs), len(g), num(h, 3), num(d, 3), round(d * 100), nivel]))
        if c["id"] == "palomitas":
            partes = " + ".join(f"{n}/20" for n in sorted(g.values(), reverse=True))
            clases = "; ".join(f"{'sin registro' if k == '—' else e(k)}: {n}" for k, n in g.most_common())
            ejemplo = (f"<p><b>Ejemplo: <i>palomitas</i>.</b> Clases de la partición ({clases}). "
                       f"Proporciones {partes}. H = {num(h, 3)} bits; H<sub>máx</sub> = log<sub>2</sub> 20 = {num(math.log2(20), 3)} bits; "
                       f"D = {num(h, 3)} / {num(math.log2(20), 3)} = {num(d, 3)}, que el sitio muestra como {round(d * 100)}/100.</p>")
    filas.sort(key=lambda f: -f[0])
    bloques["DISTINCION"] = ejemplo + tabla(["Concepto", "Palabras en el mapa", "Clases (k)", "H (bits)", "D", "En el sitio", "Grupo"], [f[1] for f in filas])

    # Simulación del cuestionario
    filas, aciertos = [], 0
    for iso in PAISES:
        rank, hechas = jugar(iso, MAX_PREGUNTAS, conceptos, pps)
        ok = rank[0][0] == iso
        aciertos += ok
        p_iso = dict(rank)[iso]
        seg = rank[1] if ok else rank[0]
        filas.append([e(NOMBRES[iso]), "sí" if ok else "no", f"{round(p_iso * 100)} %", f"{e(NOMBRES[seg[0]])} ({round(seg[1] * 100)} %)",
                      ", ".join(e(next(c["corto"] for c in conceptos if c["id"] == h)) for h in hechas)])
    bloques["SIMULACION"] = (f"<p>Aciertos: {aciertos} de {len(PAISES)} con {MAX_PREGUNTAS} preguntas.</p>"
                             + tabla(["País simulado", "¿Acierta?", "p(país)", "Segundo", "Preguntas que hizo"], filas))

    p = RAIZ / "acerca.html"
    s = p.read_text()
    for k, v in bloques.items():
        a, z = f"<!-- {k} -->", f"<!-- /{k} -->"
        if a not in s:  # la página ya no muestra este bloque
            continue
        i, j = s.index(a) + len(a), s.index(z)
        s = s[:i] + "\n" + v + "\n" + s[j:]
    p.write_text(s)
    print("Bloques escritos:", ", ".join(bloques))


if __name__ == "__main__":
    main()
