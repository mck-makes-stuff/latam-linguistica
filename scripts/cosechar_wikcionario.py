#!/usr/bin/env python3
"""
Cosecha los regionalismos del Wikcionario en español.

Fuentes (todas de https://es.wiktionary.org, licencia CC BY-SA 4.0):
  1. Categorías de país  -> Categoría:ES:<país>  (palabras marcadas con ese uso regional)
  2. Apéndices de país   -> Apéndice:Nicaraguanismos, etc. (listas editoriales con enlaces)

Salida (en data/crudo/):
  categorias/<codigo>.json   lista de lemas por país
  apendices/<slug>.json      lemas + enlaces de cada apéndice
  indice_fuentes.json        resumen: URL, fecha de consulta, nº de lemas

Uso:  python3 scripts/cosechar_wikcionario.py
Sólo usa la biblioteca estándar. Respeta la API (pausa entre peticiones).
"""
import json, time, datetime, pathlib, urllib.error, urllib.parse, urllib.request

API = "https://es.wiktionary.org/w/api.php"
UA = {"User-Agent": "latam-linguistica/0.1 (proyecto educativo; GitHub mck-makes-stuff/latam-linguistica)"}
RAIZ = pathlib.Path(__file__).resolve().parent.parent
CRUDO = RAIZ / "data" / "crudo"

# ISO 3166-1 alfa-3 -> nombre de la categoría en Wikcionario
PAISES = {
    "ARG": "Argentina", "BOL": "Bolivia", "CHL": "Chile", "COL": "Colombia",
    "CRI": "Costa Rica", "CUB": "Cuba", "DOM": "República Dominicana",
    "ECU": "Ecuador", "SLV": "El Salvador", "GTM": "Guatemala",
    "HND": "Honduras", "MEX": "México", "NIC": "Nicaragua", "PAN": "Panamá",
    "PRY": "Paraguay", "PER": "Perú", "PRI": "Puerto Rico", "URY": "Uruguay",
    "VEN": "Venezuela",
    # Puntos de comparación (no se colorean en el mapa principal)
    "ESP": "España", "USA": "Estados Unidos", "GNQ": "Guinea Ecuatorial",
}
# Macrorregiones que el Wikcionario usa como categoría propia
MACRORREGIONES = {"RIO_PLATA": "Río de la Plata", "CARIBE": "Caribe"}

APENDICES = [
    "Apéndice:Nicaraguanismos", "Apéndice:Costarriqueñismos",
    "Apéndice:Panameñismos", "Apéndice:Salvadoreñismos",
    "Apéndice:Colombianismos", "Apéndice:Modismos de la Amazonia peruana",
    "Apéndice:ES:Referencia/Variantes regionales",
]


def api(**params):
    params["format"] = "json"
    url = API + "?" + urllib.parse.urlencode(params)
    for intento in range(8):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                time.sleep(1.0)  # cortesía con los servidores de Wikimedia
                return json.load(r)
        except urllib.error.HTTPError as e:  # 429 = demasiadas peticiones: esperar y reintentar
            espera = int(e.headers.get("Retry-After") or 0) or 10 * (intento + 1)
            print(f"  HTTP {e.code}; espero {espera}s")
            time.sleep(espera)
            ultimo = e
    raise ultimo


def miembros_categoria(nombre):
    lemas, cont = [], {}
    while True:
        d = api(action="query", list="categorymembers", cmtitle=f"Categoría:ES:{nombre}",
                cmnamespace=0, cmlimit=500, **cont)
        lemas += [m["title"] for m in d["query"]["categorymembers"]]
        if "continue" not in d:
            return lemas
        cont = {"cmcontinue": d["continue"]["cmcontinue"]}
        pass


def enlaces_apendice(titulo):
    """Devuelve los enlaces internos (lemas) y el wikitexto del apéndice."""
    enlaces, cont = [], {}
    while True:
        d = api(action="query", prop="links", titles=titulo, plnamespace=0, pllimit=500, **cont)
        for p in d["query"]["pages"].values():
            enlaces += [l["title"] for l in p.get("links", [])]
        if "continue" not in d:
            break
        cont = {"plcontinue": d["continue"]["plcontinue"]}
        pass
    texto = api(action="parse", page=titulo, prop="wikitext")["parse"]["wikitext"]["*"]
    return enlaces, texto


def url_wikcionario(titulo):
    return "https://es.wiktionary.org/wiki/" + urllib.parse.quote(titulo.replace(" ", "_"))


def main():
    hoy = datetime.date.today().isoformat()
    (CRUDO / "categorias").mkdir(parents=True, exist_ok=True)
    (CRUDO / "apendices").mkdir(parents=True, exist_ok=True)
    indice = {"consultado": hoy, "licencia": "CC BY-SA 4.0 (Wikcionario)", "categorias": {}, "apendices": {}}

    for codigo, nombre in {**PAISES, **MACRORREGIONES}.items():
        cat = f"Categoría:ES:{nombre}"
        destino = CRUDO / "categorias" / f"{codigo}.json"
        if destino.exists():  # ya cosechado: no repetir peticiones
            lemas = json.loads(destino.read_text())["lemas"]
            indice["categorias"][codigo] = {"nombre": nombre, "url": url_wikcionario(cat), "n": len(lemas)}
            continue
        lemas = sorted(set(miembros_categoria(nombre)))
        (CRUDO / "categorias" / f"{codigo}.json").write_text(
            json.dumps({"codigo": codigo, "nombre": nombre, "fuente": url_wikcionario(cat),
                        "consultado": hoy, "lemas": lemas}, ensure_ascii=False, indent=1))
        indice["categorias"][codigo] = {"nombre": nombre, "url": url_wikcionario(cat), "n": len(lemas)}
        print(f"{codigo:10} {nombre:22} {len(lemas):5}")

    for titulo in APENDICES:
        enlaces, texto = enlaces_apendice(titulo)
        slug = titulo.split(":")[-1].replace("/", "_").replace(" ", "_")
        (CRUDO / "apendices" / f"{slug}.json").write_text(
            json.dumps({"titulo": titulo, "fuente": url_wikcionario(titulo), "consultado": hoy,
                        "enlaces": sorted(set(enlaces))}, ensure_ascii=False, indent=1))
        (CRUDO / "apendices" / f"{slug}.wikitext").write_text(texto)
        indice["apendices"][slug] = {"titulo": titulo, "url": url_wikcionario(titulo), "n_enlaces": len(set(enlaces))}
        print(f"{slug:40} {len(set(enlaces)):5} enlaces")

    (CRUDO / "indice_fuentes.json").write_text(json.dumps(indice, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
