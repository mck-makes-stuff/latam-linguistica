// Dibujo del mapa con D3. Sólo pinta: no decide qué datos mostrar.
// crearMapa() permite tener varios mapas en la misma página (relato y explorador).

const ANCHO = 800, ALTO = 860;
const EUROPA = new Set(["ESP", "PRT", "MAR"]);
const AREA_MIN_ETIQUETA = 450; // px²: por debajo, el país es demasiado pequeño para rotular

// El centroide de países con islas (Chile, Ecuador, España) cae mejor en el polígono mayor
function mayorPoligono(f) {
  if (f.geometry.type !== "MultiPolygon") return f;
  const polis = f.geometry.coordinates.map((c) => ({ type: "Polygon", coordinates: c }));
  return d3.greatest(polis, (p) => d3.geoArea(p));
}

/**
 * paises: features de TopoJSON · svg, info, contenedor: selectores CSS
 * Devuelve { pintar, definirInfo }.
 */
export function crearMapa(paises, { svg: selSvg, info: selInfo, contenedor: selCaja, alHacerClic = () => {}, id = "m" }) {
  const svg = d3.select(selSvg).attr("viewBox", `0 0 ${ANCHO} ${ALTO}`);
  const info = d3.select(selInfo);
  let textoInfo = () => "";

  // Rayado para «sin registro»
  const defs = svg.append("defs");
  const patron = defs.append("pattern").attr("id", `rayado-${id}`).attr("width", 6).attr("height", 6)
    .attr("patternUnits", "userSpaceOnUse").attr("patternTransform", "rotate(45)");
  patron.append("rect").attr("width", 6).attr("height", 6).style("fill", "var(--sin-dato)");
  patron.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 6)
    .style("stroke", "var(--arena)").style("stroke-width", 1.4);

  const mostrarInfo = (ev, d) => {
    if (!d.properties.hispano) return;
    const caja = document.querySelector(selCaja);
    const [x, y] = d3.pointer(ev, caja);
    const izquierda = Math.min(x + 14, caja.clientWidth - 250);
    info.html(textoInfo(d.properties)).style("left", `${Math.max(0, izquierda)}px`).style("top", `${y + 14}px`).style("opacity", 1);
  };
  const dibujarPaises = (grupo, datos, r) => {
    grupo.selectAll("path").data(datos).join("path")
      .attr("d", r)
      .attr("class", (d) => `pais ${d.properties.hispano ? "hispano" : "contexto"}`)
      .attr("data-iso", (d) => d.properties.iso3)
      .style("--rayado", `url(#rayado-${id})`)
      .on("click", (_, d) => d.properties.hispano && alHacerClic(d.properties.iso3))
      .on("mousemove", (ev, d) => mostrarInfo(ev, d))
      .on("mouseleave", () => info.style("opacity", 0));
  };

  // Mapa principal: el encuadre lo deciden sólo los países hispanohablantes de América
  const hispanos = { type: "FeatureCollection", features: paises.filter((f) => f.properties.hispano && !f.properties.recuadro) };
  const proyeccion = d3.geoConicEqualArea().parallels([-20, 20]).rotate([75, 0])
    .fitExtent([[16, 16], [ANCHO - 16, ALTO - 16]], hispanos);
  const ruta = d3.geoPath(proyeccion);
  // Los países vecinos (Brasil, EE. UU.…) se salen del encuadre: se desvanecen hacia los bordes en vez de cortarse
  const degradado = (nombre, x2, y2) => {
    const g = defs.append("linearGradient").attr("id", `${nombre}-${id}`).attr("x1", 0).attr("y1", 0).attr("x2", x2).attr("y2", y2);
    [[0, 0], [0.12, 1], [0.82, 1], [1, 0]].forEach(([o, a]) => g.append("stop").attr("offset", o).attr("stop-color", "#fff").attr("stop-opacity", a));
    defs.append("mask").attr("id", `mascara-${nombre}-${id}`).attr("maskUnits", "userSpaceOnUse")
      .attr("x", 0).attr("y", 0).attr("width", ANCHO).attr("height", ALTO)
      .append("rect").attr("width", ANCHO).attr("height", ALTO).attr("fill", `url(#${nombre}-${id})`);
  };
  degradado("horizontal", 1, 0);
  degradado("vertical", 0, 1);
  const americas = paises.filter((f) => !EUROPA.has(f.properties.iso3));
  dibujarPaises(svg.append("g").attr("mask", `url(#mascara-horizontal-${id})`).append("g").attr("mask", `url(#mascara-vertical-${id})`),
    americas.filter((f) => !f.properties.hispano), ruta);
  dibujarPaises(svg.append("g"), americas.filter((f) => f.properties.hispano), ruta);

  // Recuadro de España, arriba a la derecha, sobre el Atlántico
  const R = { x: ANCHO - 204, y: 18, w: 186, h: 146 };
  const peninsula = mayorPoligono(paises.find((f) => f.properties.iso3 === "ESP"));
  const proyEsp = d3.geoConicEqualArea().parallels([36, 43]).rotate([3.7, 0])
    .fitExtent([[R.x + 14, R.y + 24], [R.x + R.w - 14, R.y + R.h - 10]], peninsula);
  const rutaEsp = d3.geoPath(proyEsp);
  defs.append("clipPath").attr("id", `recorte-esp-${id}`).append("rect")
    .attr("x", R.x).attr("y", R.y).attr("width", R.w).attr("height", R.h).attr("rx", 4);
  const grupoEsp = svg.append("g").attr("class", "recuadro");
  grupoEsp.append("rect").attr("class", "recuadro-fondo")
    .attr("x", R.x).attr("y", R.y).attr("width", R.w).attr("height", R.h).attr("rx", 4);
  dibujarPaises(grupoEsp.append("g").attr("clip-path", `url(#recorte-esp-${id})`),
    paises.filter((f) => EUROPA.has(f.properties.iso3) || f.properties.iso3 === "FRA"), rutaEsp);
  grupoEsp.append("text").attr("class", "recuadro-titulo").attr("x", R.x + 10).attr("y", R.y + 16).text("ESPAÑA");

  const capaPaises = svg.selectAll("path.pais.hispano");
  const capaEtiquetas = svg.append("g");
  const rutaDe = (d) => (d.properties.recuadro ? rutaEsp : ruta);

  /**
   * relleno(iso) -> color o null (rayado) · etiqueta(iso) -> texto o null
   * activo: país seleccionado · resaltados: Set de países a destacar (los demás se atenúan) o null
   */
  function pintar({ relleno, etiqueta, activo = null, resaltados = null, recuadroDestacado = false }) {
    capaPaises
      .style("fill", (d) => relleno(d.properties.iso3) ?? null)
      .classed("activo", (d) => d.properties.iso3 === activo)
      .classed("resaltado", (d) => !!resaltados?.has(d.properties.iso3))
      .classed("atenuado", (d) => !!resaltados && !resaltados.has(d.properties.iso3));
    grupoEsp.classed("destacado", recuadroDestacado);

    const datos = capaPaises.data().filter((d) => {
      if (!etiqueta(d.properties.iso3)) return false;
      return d.properties.recuadro || rutaDe(d).area(mayorPoligono(d)) >= AREA_MIN_ETIQUETA;
    });
    capaEtiquetas.selectAll("text").data(datos, (d) => d.properties.iso3).join(
      (entra) => entra.append("text").style("opacity", 0),
    )
      .attr("class", "etiqueta-variante")
      .attr("transform", (d) => `translate(${rutaDe(d).centroid(mayorPoligono(d))})`)
      .text((d) => etiqueta(d.properties.iso3))
      .transition().duration(400)
      .style("opacity", (d) => (resaltados && !resaltados.has(d.properties.iso3) ? 0.3 : 1));
  }

  return { pintar, definirInfo: (fn) => { textoInfo = fn; } };
}

// --- Instancia por defecto (#mapa), usada por el explorador y el cuestionario ----
let principal = null;
export function iniciarMapa(paises, { alHacerClic }) {
  principal = crearMapa(paises, { svg: "#mapa", info: "#info-flotante", contenedor: ".mapa-contenedor", alHacerClic, id: "p" });
}
export const pintar = (o) => principal.pintar(o);
export const definirInfo = (fn) => principal.definirInfo(fn);
