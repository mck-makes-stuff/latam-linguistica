#!/usr/bin/env python3
"""
Construye data/procesado/conceptos.json, el archivo que dibuja el mapa.

Para cada concepto de data/conceptos_semilla.json y cada variante candidata:
  1. Descarga (y guarda en caché) la entrada del Wikcionario.
  2. Busca las ACEPCIONES cuya definición contiene alguna de las «glosas»
     del concepto (así «guagua» = autobús no se confunde con «guagua» = bebé).
  3. Lee la plantilla {{ámbito|...}} de esas acepciones -> países.
  4. Añade como evidencia secundaria las listas web (data/procesado/lemas_web.json).

Estados de cada variante:
  verificado  -> acepción con ámbito en el Wikcionario
  americano   -> acepción marcada para «América» en general, sin países concretos
  general     -> acepción sin marca regional (uso general / estándar)
  parcial     -> sólo aparece en listas web (sin confirmar la acepción)
  sin_datos   -> ninguna evidencia: queda para revisión manual

También recoge los {{sinónimos}} de las acepciones encontradas como
«sugerencias» de variantes que aún no están en la semilla.
Uso:  python3 scripts/procesar.py
"""
import json, pathlib, re, time, datetime, unicodedata, urllib.parse, urllib.request, urllib.error

RAIZ = pathlib.Path(__file__).resolve().parent.parent
CACHE = RAIZ / "data/crudo/entradas"
API = "https://es.wiktionary.org/w/api.php"
UA = {"User-Agent": "latam-linguistica/0.1 (proyecto educativo; GitHub mck-makes-stuff/latam-linguistica)"}

PAISES = {
    "Argentina": "ARG", "Bolivia": "BOL", "Chile": "CHL", "Colombia": "COL", "Costa Rica": "CRI",
    "Cuba": "CUB", "República Dominicana": "DOM", "Ecuador": "ECU", "El Salvador": "SLV",
    "Guatemala": "GTM", "Honduras": "HND", "México": "MEX", "Nicaragua": "NIC", "Panamá": "PAN",
    "Paraguay": "PRY", "Perú": "PER", "Puerto Rico": "PRI", "Uruguay": "URY", "Venezuela": "VEN",
    "España": "ESP",
}
TODOS_LATAM = [v for v in PAISES.values() if v != "ESP"]
# Marcas «de toda América»: indican un americanismo general, no un país concreto
PANAMERICANAS = {"América", "Hispanoamérica", "Latinoamérica", "América Latina"}
# Macrorregiones y regiones subnacionales que usa el Wikcionario -> países
REGIONES = {
    "Río de la Plata": ["ARG", "URY"], "Rioplatense": ["ARG", "URY"],
    "Cono Sur": ["ARG", "CHL", "PRY", "URY"],
    "Caribe": ["CUB", "DOM", "PRI"], "Antillas": ["CUB", "DOM", "PRI"],
    "Centroamérica": ["GTM", "SLV", "HND", "NIC", "CRI", "PAN"],
    "América Central": ["GTM", "SLV", "HND", "NIC", "CRI", "PAN"],
    "Andes": ["BOL", "ECU", "PER"], "Región andina": ["BOL", "ECU", "PER"],
    "Sudamérica": ["ARG", "BOL", "CHL", "COL", "ECU", "PRY", "PER", "URY", "VEN"],
    "Yucatán": ["MEX"], "Norte de México": ["MEX"], "Canarias": ["ESP"], "Andalucía": ["ESP"],
}


def norm(s):
    return "".join(c for c in unicodedata.normalize("NFD", s.lower()) if unicodedata.category(c) != "Mn")


def url_wikt(t):
    return "https://es.wiktionary.org/wiki/" + urllib.parse.quote(t.replace(" ", "_"))


def wikitexto(titulo):
    CACHE.mkdir(parents=True, exist_ok=True)
    f = CACHE / (urllib.parse.quote(titulo, safe="") + ".json")
    if f.exists():
        return json.loads(f.read_text())["wikitexto"]
    q = urllib.parse.urlencode({"action": "parse", "page": titulo, "prop": "wikitext", "format": "json", "redirects": 1})
    for intento in range(6):
        try:
            with urllib.request.urlopen(urllib.request.Request(f"{API}?{q}", headers=UA), timeout=30) as r:
                d = json.load(r)
            break
        except urllib.error.HTTPError as e:
            time.sleep(int(e.headers.get("Retry-After") or 0) or 10 * (intento + 1))
    else:
        d = {}
    time.sleep(1.0)
    texto = d.get("parse", {}).get("wikitext", {}).get("*", "")
    f.write_text(json.dumps({"titulo": titulo, "wikitexto": texto}, ensure_ascii=False))
    return texto


def precargar(titulos):
    """Descarga en lotes de 50 (una sola petición por lote) las entradas que faltan en la caché."""
    CACHE.mkdir(parents=True, exist_ok=True)
    faltan = [t for t in dict.fromkeys(titulos) if not (CACHE / (urllib.parse.quote(t, safe="") + ".json")).exists()]
    for i in range(0, len(faltan), 50):
        lote = faltan[i:i + 50]
        q = urllib.parse.urlencode({"action": "query", "prop": "revisions", "rvprop": "content", "rvslots": "main",
                                    "titles": "|".join(lote), "redirects": 1, "format": "json", "formatversion": 2})
        for intento in range(8):
            try:
                with urllib.request.urlopen(urllib.request.Request(f"{API}?{q}", headers=UA), timeout=60) as r:
                    d = json.load(r)
                break
            except urllib.error.HTTPError as e:
                espera = max(int(e.headers.get("Retry-After") or 0), 15 * (intento + 1))
                print(f"  HTTP {e.code}; espero {espera}s", flush=True)
                time.sleep(espera)
        else:
            raise SystemExit("El Wikcionario no responde; vuelve a intentarlo más tarde.")
        # Mapa de redirecciones/normalizaciones: título pedido -> título real
        alias = {}
        for k in ("normalized", "redirects"):
            for x in d["query"].get(k, []):
                alias[x["from"]] = x["to"]
        textos = {p["title"]: (p.get("revisions") or [{}])[0].get("slots", {}).get("main", {}).get("content", "")
                  for p in d["query"]["pages"]}
        for t in lote:
            real = alias.get(alias.get(t, t), alias.get(t, t))
            (CACHE / (urllib.parse.quote(t, safe="") + ".json")).write_text(
                json.dumps({"titulo": t, "wikitexto": textos.get(real, "")}, ensure_ascii=False))
        print(f"  lote {i // 50 + 1}: {len(lote)} entradas", flush=True)
        time.sleep(3)


def args_plantilla(cuerpo):
    """Argumentos posicionales de una plantilla (ignora nombre=valor)."""
    return [a.strip() for a in cuerpo.split("|") if a.strip() and "=" not in a]


def limpiar_def(s):
    # Plantillas cuyo contenido es texto de la definición: se conservan sus argumentos
    s = re.sub(r"\{\{(?:plm|ucf|l|taxón)\|([^}]*)\}\}", lambda m: " ".join(args_plantilla(m.group(1))), s)
    s = re.sub(r"\{\{[^{}]*\}\}", "", s)
    s = re.sub(r"\[\[(?:[^|\]]*\|)?([^\]]*)\]\]", r"\1", s)
    return " ".join(s.replace("''", "").split())


def acepciones(texto):
    """Lista de acepciones de la sección española: definición, regiones, sinónimos."""
    i = texto.find("{{lengua|es}}")
    if i < 0:
        return []
    j = texto.find("\n== ", i + 10)
    seccion = texto[i: j if j > 0 else None]
    salida, actual = [], None
    for linea in seccion.splitlines():
        m = re.match(r"^;\s*\d+\s*(.*?):\s*(.*)$", linea)
        if m:
            actual = {"definicion": limpiar_def(m.group(2)), "regiones": [], "sinonimos": []}
            # formato antiguo: la región va en {{csem|...}} o en la cabecera
            for c in re.findall(r"\{\{(?:csem|uso)\|([^}]*)\}\}", m.group(1)):
                actual["regiones"] += [a for a in args_plantilla(c) if a in PAISES or a in REGIONES]
            salida.append(actual)
            continue
        if actual is None:
            continue
        for c in re.findall(r"\{\{ámbito\|([^}]*)\}\}", linea):
            actual["regiones"] += args_plantilla(c)
        for c in re.findall(r"\{\{sinónimos?\|([^}]*)\}\}", linea):
            actual["sinonimos"] += args_plantilla(c)
    return salida


def a_paises(regiones):
    out = set()
    for r in regiones:
        if r in PAISES:
            out.add(PAISES[r])
        elif r in REGIONES:
            out |= set(REGIONES[r])
    return out


def main():
    semilla = json.loads((RAIZ / "data/conceptos_semilla.json").read_text())["conceptos"]
    web = json.loads((RAIZ / "data/procesado/lemas_web.json").read_text())["fuentes"]
    indice_web = {}
    for f in web:
        for l in f["lemas"]:
            indice_web.setdefault(norm(l), []).append(f)

    precargar([v for c in semilla for v in c["variantes"]])
    conceptos = []
    for c in semilla:
        glosas = [norm(g) for g in c["glosas"]]
        variantes, sugerencias = [], set()
        for forma in dict.fromkeys(c["variantes"]):
            evidencia, paises, general, americano = [], set(), False, False
            propias = [g for g in glosas if g != norm(forma)]  # «fresa» no sirve para reconocer «fresa»
            for a in acepciones(wikitexto(forma)):
                if not any(g in norm(a["definicion"]) for g in propias):
                    continue
                if PANAMERICANAS & set(a["regiones"]):
                    americano = True
                p = a_paises(a["regiones"])
                if p:
                    for iso in sorted(p):
                        evidencia.append({"pais": iso, "forma": forma, "fuente": "Wikcionario",
                                          "url": url_wikt(forma), "sentido": a["definicion"][:140]})
                    paises |= p
                elif not a["regiones"]:
                    general = True
                sugerencias |= {s for s in a["sinonimos"] if s not in c["variantes"]}
            # Evidencia secundaria: listas web por país (no confirma la acepción)
            secundarios = set()
            for f in indice_web.get(norm(forma), []):
                if f["pais"] in PAISES.values():
                    secundarios.add(f["pais"])
                    evidencia.append({"pais": f["pais"], "forma": forma, "fuente": urllib.parse.urlparse(f["url"]).netloc,
                                      "url": f["url"], "tipo": f["tipo"], "sentido": ""})
            # Correcciones manuales de la semilla (acepción equivocada en ese país)
            excluidos = set(c.get("excluir", {}).get(forma, []))
            paises -= excluidos
            secundarios -= excluidos
            evidencia = [e for e in evidencia if e["pais"] not in excluidos]
            estado = ("verificado" if paises else "americano" if americano else "general" if general
                      else "parcial" if secundarios else "sin_datos")
            variantes.append({"forma": forma, "paises": sorted(paises) if paises else sorted(secundarios) if estado == "parcial" else [],
                              "paises_web": sorted(secundarios - paises), "general": general, "americano": americano,
                              "excluidos": sorted(excluidos),
                              "estado": estado, "evidencia": evidencia})
        # Métricas para elegir los mejores conceptos para el mapa
        verif = [v for v in variantes if v["estado"] == "verificado"]
        cubiertos = {p for v in verif for p in v["paises"] if p != "ESP"}
        por_pais = [sum(p in v["paises"] for v in verif) for p in cubiertos]
        metricas = {"cobertura": len(cubiertos), "variantes_verificadas": len(verif),
                    "media_por_pais": round(sum(por_pais) / len(por_pais), 2) if por_pais else 0,
                    "sin_cubrir": sorted(set(TODOS_LATAM) - cubiertos)}
        conceptos.append({k: c[k] for k in ("id", "concepto", "campo", "definicion")}
                         | {"corto": c.get("corto", c["concepto"]), "publicar": c.get("publicar", False), "motivos": c.get("motivos", "")}
                         | {"metricas": metricas, "variantes": variantes, "sugerencias": sorted(sugerencias)})
        resumen = {e: sum(v["estado"] == e for v in variantes) for e in ("verificado", "americano", "general", "parcial", "sin_datos")}
        print(f"{c['id']:12} {resumen}", flush=True)

    # Orden: primero los conceptos con más países cubiertos y más variantes distintas
    conceptos.sort(key=lambda c: (-c["metricas"]["cobertura"], -c["metricas"]["variantes_verificadas"]))
    print("\nconcepto      cobertura/19  variantes  media/país  sin cubrir")
    for c in conceptos:
        m = c["metricas"]
        print(f"{c['id']:12}  {m['cobertura']:>6}       {m['variantes_verificadas']:>5}     {m['media_por_pais']:>5}   {' '.join(m['sin_cubrir'])}")
    (RAIZ / "data/procesado/conceptos.json").write_text(json.dumps(
        {"generado": datetime.date.today().isoformat(),
         "nota": "Generado por scripts/procesar.py. No editar a mano: editar data/conceptos_semilla.json.",
         "conceptos": conceptos}, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
