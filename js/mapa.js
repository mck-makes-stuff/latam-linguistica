// Dibujo del mapa con D3. Sólo pinta: no decide qué datos mostrar.

const ANCHO = 800, ALTO = 860;
const EUROPA = new Set(["ESP", "PRT", "MAR"]);
const AREA_MIN_ETIQUETA = 450; // px²: por debajo, el país es demasiado pequeño para rotular

let svg, capaPaises, capaEtiquetas, ruta, rutaEsp, info;
let textoInfo = () => "";

export function iniciarMapa(paises, { alHacerClic }) {
  svg = d3.select("#mapa").attr("viewBox", `0 0 ${ANCHO} ${ALTO}`);
  info = d3.select("#info-flotante");

  // Rayado para «sin registro»
  const defs = svg.append("defs");
  const patron = defs.append("pattern").attr("id", "rayado").attr("width", 6).attr("height", 6)
    .attr("patternUnits", "userSpaceOnUse").attr("patternTransform", "rotate(45)");
  patron.append("rect").attr("width", 6).attr("height", 6).style("fill", "var(--sin-dato)");
  patron.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 6)
    .style("stroke", "var(--arena)").style("stroke-width", 1.4);

  // Mapa principal: el encuadre lo deciden sólo los países hispanohablantes de América
  const hispanos = { type: "FeatureCollection", features: paises.filter((f) => f.properties.hispano && !f.properties.recuadro) };
  const proyeccion = d3.geoConicEqualArea().parallels([-20, 20]).rotate([75, 0])
    .fitExtent([[16, 16], [ANCHO - 16, ALTO - 16]], hispanos);
  ruta = d3.geoPath(proyeccion);
  dibujarPaises(svg.append("g"), paises.filter((f) => !EUROPA.has(f.properties.iso3)), ruta, alHacerClic);

  // Recuadro de España (comparación), arriba a la derecha, sobre el Atlántico
  const R = { x: ANCHO - 204, y: 18, w: 186, h: 146 };
  const peninsula = mayorPoligono(paises.find((f) => f.properties.iso3 === "ESP"));
  const proyEsp = d3.geoConicEqualArea().parallels([36, 43]).rotate([3.7, 0])
    .fitExtent([[R.x + 14, R.y + 24], [R.x + R.w - 14, R.y + R.h - 10]], peninsula);
  rutaEsp = d3.geoPath(proyEsp);
  defs.append("clipPath").attr("id", "recorte-esp").append("rect")
    .attr("x", R.x).attr("y", R.y).attr("width", R.w).attr("height", R.h).attr("rx", 8);
  const grupoEsp = svg.append("g");
  grupoEsp.append("rect").attr("class", "recuadro-fondo")
    .attr("x", R.x).attr("y", R.y).attr("width", R.w).attr("height", R.h).attr("rx", 8);
  dibujarPaises(grupoEsp.append("g").attr("clip-path", "url(#recorte-esp)"),
    paises.filter((f) => EUROPA.has(f.properties.iso3) || f.properties.iso3 === "FRA"), rutaEsp, alHacerClic);
  grupoEsp.append("text").attr("class", "recuadro-titulo").attr("x", R.x + 10).attr("y", R.y + 16)
    .text("ESPAÑA · COMPARACIÓN");

  capaPaises = svg.selectAll("path.pais.hispano");
  capaEtiquetas = svg.append("g");
}

export function definirInfo(fn) { textoInfo = fn; }

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

function mostrarInfo(ev, d) {
  if (!d.properties.hispano) return;
  const caja = document.querySelector(".mapa-contenedor");
  const [x, y] = d3.pointer(ev, caja);
  const izquierda = Math.min(x + 14, caja.clientWidth - 250);
  info.html(textoInfo(d.properties)).style("left", `${Math.max(0, izquierda)}px`).style("top", `${y + 14}px`).style("opacity", 1);
}

/**
 * relleno(iso) -> color o null (rayado) · etiqueta(iso) -> texto o null
 * activo: país seleccionado · resaltados: Set de países a destacar (los demás se atenúan) o null
 */
export function pintar({ relleno, etiqueta, activo, resaltados }) {
  capaPaises
    .style("fill", (d) => relleno(d.properties.iso3) ?? null)
    .classed("activo", (d) => d.properties.iso3 === activo)
    .classed("resaltado", (d) => !!resaltados?.has(d.properties.iso3))
    .classed("atenuado", (d) => !!resaltados && !resaltados.has(d.properties.iso3));

  const datos = capaPaises.data().filter((d) => {
    if (!etiqueta(d.properties.iso3)) return false;
    return d.properties.recuadro || rutaDe(d).area(mayorPoligono(d)) >= AREA_MIN_ETIQUETA;
  });
  capaEtiquetas.selectAll("text").data(datos, (d) => d.properties.iso3).join("text")
    .attr("class", "etiqueta-variante")
    .attr("transform", (d) => `translate(${rutaDe(d).centroid(mayorPoligono(d))})`)
    .style("opacity", (d) => (resaltados && !resaltados.has(d.properties.iso3) ? 0.3 : 1))
    .text((d) => etiqueta(d.properties.iso3));
}

// El centroide de países con islas (Chile, Ecuador, España) cae mejor en el polígono mayor
function mayorPoligono(f) {
  if (f.geometry.type !== "MultiPolygon") return f;
  const polis = f.geometry.coordinates.map((c) => ({ type: "Polygon", coordinates: c }));
  return d3.greatest(polis, (p) => d3.geoArea(p));
}
