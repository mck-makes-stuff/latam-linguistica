// Dibujo del mapa con D3. Sólo pinta; no decide qué datos mostrar.

const ANCHO = 800, ALTO = 860;
let svg, capaPaises, capaEtiquetas, ruta, info;

export function iniciarMapa(paises, { alHacerClic }) {
  svg = d3.select("#mapa").attr("viewBox", `0 0 ${ANCHO} ${ALTO}`);
  info = d3.select("#info-flotante");

  // Encuadre: sólo los países hispanohablantes determinan el zoom
  const hispanos = { type: "FeatureCollection", features: paises.filter((f) => f.properties.hispano && !f.properties.recuadro) };
  const proyeccion = d3.geoConicEqualArea().parallels([-20, 20]).rotate([75, 0])
    .fitExtent([[16, 16], [ANCHO - 16, ALTO - 16]], hispanos);
  ruta = d3.geoPath(proyeccion);

  const EUROPA = new Set(["ESP", "PRT", "MAR"]);
  const principal = paises.filter((f) => !EUROPA.has(f.properties.iso3));
  const grupoPrincipal = svg.append("g");
  dibujarPaises(grupoPrincipal, principal, ruta, alHacerClic);

  // Recuadro de España (punto de comparación), arriba a la derecha sobre el Atlántico
  const R = { x: ANCHO - 200, y: 18, w: 182, h: 140 };
  const espana = paises.find((f) => f.properties.iso3 === "ESP");
  const peninsula = mayorPoligono(espana);
  const proyEsp = d3.geoConicEqualArea().parallels([36, 43]).rotate([3.7, 0])
    .fitExtent([[R.x + 14, R.y + 22], [R.x + R.w - 14, R.y + R.h - 10]], peninsula);
  rutaEsp = d3.geoPath(proyEsp);
  svg.append("clipPath").attr("id", "recorte-esp").append("rect")
    .attr("x", R.x).attr("y", R.y).attr("width", R.w).attr("height", R.h).attr("rx", 8);
  const grupoEsp = svg.append("g").attr("class", "recuadro");
  grupoEsp.append("rect").attr("class", "recuadro-fondo")
    .attr("x", R.x).attr("y", R.y).attr("width", R.w).attr("height", R.h).attr("rx", 8);
  dibujarPaises(grupoEsp.append("g").attr("clip-path", "url(#recorte-esp)"),
    paises.filter((f) => EUROPA.has(f.properties.iso3) || f.properties.iso3 === "FRA"), rutaEsp, alHacerClic);
  grupoEsp.append("text").attr("class", "recuadro-titulo").attr("x", R.x + 10).attr("y", R.y + 16)
    .text("España (comparación)");

  capaPaises = svg.selectAll("path.pais");
  capaEtiquetas = svg.append("g");
}

let rutaEsp;
const rutaDe = (d) => (d.properties.recuadro ? rutaEsp : ruta);

function dibujarPaises(grupo, datos, r, alHacerClic) {
  grupo.selectAll("path").data(datos).join("path")
    .attr("d", r)
    .attr("class", (d) => `pais ${d.properties.hispano ? "hispano" : "contexto"}`)
    .attr("data-iso", (d) => d.properties.iso3)
    .on("click", (_, d) => d.properties.hispano && alHacerClic(d.properties.iso3))
    .on("mousemove", (ev, d) => mostrarInfo(ev, d))
    .on("mouseleave", () => info.style("opacity", 0));
}

let textoInfo = () => "";
export function definirInfo(fn) { textoInfo = fn; }

function mostrarInfo(ev, d) {
  if (!d.properties.hispano) return;
  const [x, y] = d3.pointer(ev, document.querySelector(".mapa-contenedor"));
  info.html(textoInfo(d.properties)).style("left", `${x + 12}px`).style("top", `${y + 12}px`).style("opacity", 1);
}

// relleno: (iso3) => color CSS ; etiquetas: (iso3) => texto | null
export function pintar({ relleno, etiquetas, activo }) {
  capaPaises
    .filter((d) => d.properties.hispano)
    .style("fill", (d) => relleno(d.properties.iso3) ?? null)
    .classed("activo", (d) => d.properties.iso3 === activo);

  const datos = capaPaises.data().filter((d) => d.properties.hispano && etiquetas(d.properties.iso3));
  capaEtiquetas.selectAll("text").data(datos, (d) => d.properties.iso3).join("text")
    .attr("class", "etiqueta-variante")
    .attr("transform", (d) => `translate(${rutaDe(d).centroid(mayorPoligono(d))})`)
    .text((d) => etiquetas(d.properties.iso3));
}

// El centroide de países con islas (Chile, Ecuador) cae mejor en el polígono mayor
function mayorPoligono(f) {
  if (f.geometry.type !== "MultiPolygon") return f;
  const polis = f.geometry.coordinates.map((c) => ({ type: "Polygon", coordinates: c }));
  return d3.greatest(polis, (p) => d3.geoArea(p));
}
