#!/usr/bin/env python3
"""
Genera la bibliografía (estilo Chicago) y la escribe en acerca.html,
entre <!-- BIBLIOGRAFIA --> y <!-- /BIBLIOGRAFIA -->.

Fuentes:
  data/bibliografia.json                     obras impresas, datos y páginas web (verificadas a mano)
  data/procesado/wikcionario_revisiones.json  revisión y fecha de cada entrada citada del Wikcionario
Uso:  python3 scripts/bibliografia.py
"""
import datetime, json, pathlib, re, unicodedata, urllib.parse

RAIZ = pathlib.Path(__file__).resolve().parent.parent
MESES = "enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre".split()


def fecha(iso):
    d = datetime.date.fromisoformat(iso[:10])
    return f"{d.day} de {MESES[d.month - 1]} de {d.year}"


def clave(s):
    s = "".join(c for c in unicodedata.normalize("NFD", s.lower()) if unicodedata.category(c) != "Mn")
    return s.lstrip("«¡¿ ")


def enlace(url):
    u = url.replace("&", "&amp;")
    return f'<a href="{u}">{u}</a>'


def main():
    b = json.loads((RAIZ / "data/bibliografia.json").read_text())
    rev = json.loads((RAIZ / "data/procesado/wikcionario_revisiones.json").read_text())
    consultado = fecha(b["consultado"])

    entradas = [(clave(o["orden"]), re.sub(r"(https://\S+?)\.?$", lambda m: enlace(m.group(1)) + ".", o["html"])) for o in b["obras"]]
    entradas += [(clave(w["orden"]), f'{w["html"]} Consultado el {consultado}. {enlace(w["url"])}.') for w in b["web"]]
    for forma, r in rev.items():
        url = "https://es.wiktionary.org/w/index.php?" + urllib.parse.urlencode({"title": r["titulo"], "oldid": r["revid"]})
        entradas.append((f"wikcionario {clave(forma)}",
                         f'Wikcionario. «{forma}». <i>Wikcionario, el diccionario libre</i>. '
                         f'Revisión {r["revid"]}, {fecha(r["fecha"])}. Consultado el {consultado}. {enlace(url)}.'))
    entradas.sort(key=lambda e: e[0])

    html = ('<ol class="biblio">\n'
            + "\n".join(f"      <li>{h}</li>" for _, h in entradas) + "\n    </ol>")
    p = RAIZ / "acerca.html"
    s = p.read_text()
    a, z = "<!-- BIBLIOGRAFIA -->", "<!-- /BIBLIOGRAFIA -->"
    i, j = s.index(a) + len(a), s.index(z)
    p.write_text(s[:i] + "\n    " + html + "\n    " + s[j:])
    print(f"{len(entradas)} entradas escritas en acerca.html")


if __name__ == "__main__":
    main()
