#!/usr/bin/env python3
"""
Extrae SÓLO los lemas (palabras y expresiones encabezado) de las páginas
descargadas en data/crudo/web/. No se guardan definiciones: los textos de
estos sitios tienen derechos de autor; el sitio enlaza a la fuente original.

Cada sitio tiene un formato distinto, así que hay una regla por dominio.
Entrada:  data/fuentes_web.json + data/crudo/web/*.html
Salida:   data/procesado/lemas_web.json
Uso:      python3 scripts/extraer_web.py
"""
import html, json, pathlib, re, hashlib, urllib.parse, datetime

RAIZ = pathlib.Path(__file__).resolve().parent.parent
WEB = RAIZ / "data/crudo/web"

# Páginas que bloquean descargas automáticas: lemas copiados a mano desde el navegador
# (sólo los encabezados de la lista, 2026-11-11).
MANUAL = {
    "https://quillbot.com/es/blog/vocabulario/palabras-de-colombia/": [
        "abrirse", "amorchis", "arruncharse", "caché", "camellar", "cantaleta", "chepa", "cuadrar",
        "cumbamba", "echar los perros", "hacer chichí", "hágale, pues", "luca", "motoso", "parar bolas",
        "tirar caja", "vaina", "bacano", "berraco", "chévere", "chimba", "pinta", "bizcocho", "maluco",
        "sapo", "cansón", "líchigo", "chichipato", "chimbo", "paila", "chanda", "picho", "chiviado",
        "amañado", "achantado", "emberracarse", "encarretado", "entusado", "rayado", "tragado", "cucho",
        "parcero", "parce", "llave", "man", "sardino", "pelado", "mono", "tombo", "guámbito",
        "desparchado", "guachafita", "guayabo", "jincho", "parche", "prendido", "recocha", "rumbear",
        "cachaco", "corroncho", "costeño", "paisa", "pastuso", "rolo", "arepa", "changua",
        "chunchurria", "chuzo", "corrientazo", "cotufa", "cuncho", "ejecutivo", "guarulo", "ñapa",
        "pintado", "pola", "tinto", "a pata", "buseta", "carcacha", "colectivo", "coleta", "dar pata",
        "mula", "nave", "pico y placa", "piso", "trancón", "boleta", "culebra", "de una", "jartera",
        "lámpara", "lobo", "locha", "mamera", "mañé"],
}


def texto(fragmento):
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", fragmento)).split())


def limpiar(t):
    """Normaliza un encabezado: quita numeración, comillas, signos finales."""
    t = re.sub(r"^\s*(#?\d+[.)]?\s*|·\s*)", "", t)
    t = t.strip(" \"“”«»'‘’:–—-.!¡¿?").strip()
    return t


def tras_seccion(h, marcador):
    i = h.find(marcador)
    return h[i:] if i >= 0 else h


# --- Reglas por dominio: devuelven una lista de lemas ---------------------
def r_tango(h):
    return [texto(m) for m in re.findall(r'class="lf-card__word">(.*?)</span>', h)]

def numerados(h, etiqueta="h3"):
    """Encabezados del tipo «12. Palabra» (el número puede ir dentro de otras etiquetas)."""
    out = []
    for m in re.findall(rf"<{etiqueta}[^>]*>(.*?)</{etiqueta}>", h, re.S):
        t = re.match(r"^\d+\.\s*(.+)$", texto(m))
        if t:
            out.append(t.group(1))
    return out

def r_fluentu(h):
    return [x.split(" — ")[0].split(" / ")[0] for x in numerados(h)]

def r_marcachile(h):
    h = tras_seccion(h, ">A</h2>")
    return [texto(m) for m in re.findall(r'<p class="wp-block-paragraph">([^<:]{1,40}?):', h)]

def r_nadaincluido(h):
    return [texto(m) for m in re.findall(r"<p[^>]*>\s*(?:·\s*)?<strong>\s*(?:·\s*)?(.*?)</strong>\s*(?:&#8211;|–)", h, re.S)]

def r_visitcuba(h):
    return numerados(h)

def r_cibercuba(h):
    return [texto(m).split(" / ")[0] for m in re.findall(r"<li>\s*([^<:]{1,40}):", h)]

def r_colonial(h):
    return [texto(m) for m in re.findall(r'<span class="fuelte">(.*?)</span>', h, re.S)]

def r_lingualinkup(h):
    h = tras_seccion(h, "Ecuadorian Words")
    return [texto(m) for m in re.findall(r"<p><strong>([^<]{1,40}?):?</strong>", h)]

def r_jergozo(h):
    h = urllib.parse.unquote(h)
    return [texto(m) for m in re.findall(r'href="/diccionario-[^"/]+/definir/[^"]+"[^>]*>([^<]{1,60})<', h)]

def r_wordpress_tabla(h):
    # Tabla de dos columnas (Norte | Centro y Sur); cada celda puede tener varias formas
    celdas = [texto(m) for m in re.findall(r"<td[^>]*>(.*?)</td>", h, re.S)]
    lemas = []
    for c in celdas:
        if c in ("Norte", "Centro y Sur", "Diferencias léxicas en México") or len(c) > 40:
            continue
        lemas += [x.strip() for x in re.split(r",|/", c) if x.strip()]
    return lemas

def r_wikt_es(h):
    return [texto(m) for m in re.findall(r"<li[^>]*>\s*<b[^>]*>(.*?)</b>", h, re.S)]

def r_wikt_en(h):
    return [texto(m) for m in re.findall(r"<dt[^>]*>(.*?)</dt>", h, re.S)]

def r_diccionariolibre(h):
    h = tras_seccion(h, "Explorar")
    return [texto(m) for m in re.findall(r"<h2[^>]*>(.*?)</h2>", h, re.S)][1:]

def r_psicologia(h):
    return numerados(h)

REGLAS = {
    "tango.blue": r_tango, "fluentu.com": r_fluentu, "marcachile.cl": r_marcachile,
    "nadaincluido.com": r_nadaincluido, "visitcuba.com": r_visitcuba, "cibercuba.com": r_cibercuba,
    "colonialtours.com": r_colonial, "lingualinkup.com": r_lingualinkup, "jergozo.com": r_jergozo,
    "visionlinguistica.wordpress.com": r_wordpress_tabla, "es.wiktionary.org": r_wikt_es,
    "en.wiktionary.org": r_wikt_en, "diccionariolibre.com": r_diccionariolibre,
    "psicologiaymente.com": r_psicologia,
}


def archivos(f):
    base = f"{f['pais']}_{hashlib.sha1(f['url'].encode()).hexdigest()[:8]}"
    return sorted(WEB.glob(base + "*.html"))


def main():
    fuentes = json.loads((RAIZ / "data/fuentes_web.json").read_text())["fuentes"]
    salida = []
    for f in fuentes:
        dominio = urllib.parse.urlparse(f["url"]).netloc.removeprefix("www.")
        if f["url"] in MANUAL:
            crudos, metodo = MANUAL[f["url"]], "manual (navegador)"
        elif dominio in REGLAS and archivos(f):
            crudos, metodo = [], f"regla {REGLAS[dominio].__name__}"
            for a in archivos(f):
                crudos += REGLAS[dominio](a.read_text(errors="replace"))
        else:
            crudos, metodo = [], "sin lista extraíble"
        vistos, lemas = set(), []
        for l in map(limpiar, crudos):
            clave = l.lower()
            if 2 <= len(l) <= 50 and re.search(r"[^\W\d_]{2}", l) and clave not in vistos:
                vistos.add(clave)
                lemas.append(l)
        salida.append({**{k: f[k] for k in ("pais", "url", "tipo") if k in f},
                       "serie": f.get("serie", "aportada"), "metodo": metodo, "n": len(lemas), "lemas": lemas})
        print(f"{f['pais']}  {len(lemas):5}  {metodo:28} {f['url'][:70]}")
    (RAIZ / "data/procesado/lemas_web.json").write_text(json.dumps(
        {"generado": datetime.date.today().isoformat(),
         "nota": "Sólo encabezados; las definiciones se consultan en la fuente enlazada.",
         "fuentes": salida}, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
