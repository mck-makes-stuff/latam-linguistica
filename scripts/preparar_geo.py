#!/usr/bin/env python3
"""
Recorta el atlas mundial (world-atlas 2.0.2, Natural Earth 1:50m, dominio público)
a las Américas y añade a cada país su código ISO alfa-3 y su nombre en español.

Entrada:  data/geo/fuente/countries-50m.json
Salida:   data/geo/americas.topo.json   (TopoJSON; objeto "paises")

Los arcos que no usa ningún país se eliminan para reducir el tamaño.
Uso:  python3 scripts/preparar_geo.py
"""
import json, pathlib

RAIZ = pathlib.Path(__file__).resolve().parent.parent
ENTRADA = RAIZ / "data/geo/fuente/countries-50m.json"
SALIDA = RAIZ / "data/geo/americas.topo.json"

# código numérico ISO 3166 -> (ISO alfa-3, nombre en español, ¿hispanohablante?)
PAISES = {
    "032": ("ARG", "Argentina", True), "068": ("BOL", "Bolivia", True),
    "152": ("CHL", "Chile", True), "170": ("COL", "Colombia", True),
    "188": ("CRI", "Costa Rica", True), "192": ("CUB", "Cuba", True),
    "214": ("DOM", "República Dominicana", True), "218": ("ECU", "Ecuador", True),
    "222": ("SLV", "El Salvador", True), "320": ("GTM", "Guatemala", True),
    "340": ("HND", "Honduras", True), "484": ("MEX", "México", True),
    "558": ("NIC", "Nicaragua", True), "591": ("PAN", "Panamá", True),
    "600": ("PRY", "Paraguay", True), "604": ("PER", "Perú", True),
    "630": ("PRI", "Puerto Rico", True), "858": ("URY", "Uruguay", True),
    "862": ("VEN", "Venezuela", True),
    # Punto de comparación: se dibuja en un recuadro aparte
    "724": ("ESP", "España", True),
    # Contexto geográfico (se dibujan en tono neutro)
    "076": ("BRA", "Brasil", False), "084": ("BLZ", "Belice", False),
    "328": ("GUY", "Guyana", False), "740": ("SUR", "Surinam", False),
    "332": ("HTI", "Haití", False), "388": ("JAM", "Jamaica", False),
    "044": ("BHS", "Bahamas", False), "780": ("TTO", "Trinidad y Tobago", False),
    "840": ("USA", "Estados Unidos", False), "124": ("CAN", "Canadá", False),
    "250": ("FRA", "Guayana Francesa (Francia)", False),
    "620": ("PRT", "Portugal", False), "504": ("MAR", "Marruecos", False),
    "238": ("FLK", "Islas Malvinas", False),
}


def main():
    topo = json.loads(ENTRADA.read_text())
    geoms = []
    for g in topo["objects"]["countries"]["geometries"]:
        if g.get("id") in PAISES:
            iso3, nombre, hispano = PAISES[g["id"]]
            g["properties"] = {"iso3": iso3, "nombre": nombre, "hispano": hispano, "recuadro": iso3 == "ESP"}
            g["id"] = iso3
            geoms.append(g)

    # Recolectar los arcos usados y reindexarlos
    usados = set()

    def recorrer(arcs, f):
        if isinstance(arcs, int):
            return f(arcs)
        return [recorrer(a, f) for a in arcs]

    def marcar(i):
        usados.add(i if i >= 0 else ~i)
        return i

    for g in geoms:
        recorrer(g["arcs"], marcar)
    orden = sorted(usados)
    nuevo = {viejo: n for n, viejo in enumerate(orden)}

    def remapear(i):
        return nuevo[i] if i >= 0 else ~nuevo[~i]

    for g in geoms:
        g["arcs"] = recorrer(g["arcs"], remapear)

    salida = {
        "type": "Topology",
        "transform": topo["transform"],
        "objects": {"paises": {"type": "GeometryCollection", "geometries": geoms}},
        "arcs": [topo["arcs"][i] for i in orden],
    }
    SALIDA.write_text(json.dumps(salida, separators=(",", ":"), ensure_ascii=False))
    print(f"{len(geoms)} países, {len(orden)} arcos -> {SALIDA.relative_to(RAIZ)} "
          f"({SALIDA.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
