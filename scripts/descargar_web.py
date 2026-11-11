#!/usr/bin/env python3
"""
Descarga las páginas de data/fuentes_web.json a data/crudo/web/ (HTML sin procesar).

El HTML descargado NO se sube al repositorio (.gitignore): son textos con derechos
de autor. Sólo se publican los lemas extraídos y el enlace a la fuente.
Uso:  python3 scripts/descargar_web.py
"""
import json, pathlib, re, time, urllib.request, hashlib

RAIZ = pathlib.Path(__file__).resolve().parent.parent
DEST = RAIZ / "data/crudo/web"
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      "Accept-Language": "es,en;q=0.8"}


def nombre_archivo(f):
    return f"{f['pais']}_{hashlib.sha1(f['url'].encode()).hexdigest()[:8]}.html"


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    fuentes = json.loads((RAIZ / "data/fuentes_web.json").read_text())["fuentes"]
    for f in fuentes:
        bajar(f["url"], DEST / nombre_archivo(f), f["pais"])
        # Diccionarios paginados: se guardan como <archivo>.p<n>.html
        pag = f.get("paginacion")
        if pag:
            hasta = pag["hasta"]
            if hasta == "auto":  # leer el número de la última página en la primera
                primera = (DEST / nombre_archivo(f)).read_text(errors="replace")
                hasta = max([int(n) for n in re.findall(r"pagina-(\d+)", primera)] or [1])
            for n in range(2, hasta + 1):
                destino = DEST / nombre_archivo(f).replace(".html", f".p{n}.html")
                ok = bajar(pag["plantilla"].format(n=n), destino, f["pais"])
                if not ok and pag.get("parar_si_vacia"):
                    break


def bajar(url, destino, pais):
    if destino.exists():
        return True
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
            destino.write_bytes(r.read())
        print(f"OK   {pais} {destino.stat().st_size // 1024:5} KB  {url}")
        return True
    except Exception as e:
        print(f"FALLO {pais} {e}  {url}")
        return False
    finally:
        time.sleep(1)


if __name__ == "__main__":
    main()
