// Punto de entrada: conecta datos, estado, mapa y panel.
import { cargarTodo, vistaConcepto, colorTono, colorOrigen, grupoDe, normalizar, similitudes, ORIGENES, PAISES } from "./datos.js";
import { estado, actualizar, suscribir, leerURL } from "./estado.js";
import { iniciarMapa, pintar, definirInfo } from "./mapa.js";
import { esc, configurarPanel, fichaConcepto, fichaVariante, fichaPais, fichaPalabra, tablaConcepto } from "./panel.js";

const PORTADA = "palomitas";

const { paises, conceptos, lemas, generado, fuentesWeb } = await cargarTodo();
const nombres = Object.fromEntries(paises.map((f) => [f.properties.iso3, f.properties.nombre]));
const porId = new Map(conceptos.map((c) => [c.id, c]));
const indiceLemas = new Map(Object.entries(lemas).map(([l, p]) => [normalizar(l), { lema: l, paises: p }]));
const vistas = new Map(conceptos.map((c) => [c.id, vistaConcepto(c)]));
const parecidos = similitudes(vistas);
configurarPanel({ nombres, generado, fuentesWeb });

// --- Botones de concepto, agrupados por cuánto distinguen a los países ------
const NIVELES = [
  { min: 0.5, titulo: "Distinguen mucho", nota: "casi cada país tiene su palabra" },
  { min: 0.38, titulo: "Distinguen bastante", nota: "bloques regionales" },
  { min: 0, titulo: "Distinguen poco", nota: "una forma domina" },
];
const barras = (d) => `<span class="barras" aria-hidden="true">${[0.25, 0.35, 0.45, 0.55].map((u) => `<i class="${d >= u ? "on" : ""}"></i>`).join("")}</span>`;
const barraConceptos = document.getElementById("conceptos");
const ordenados = conceptos.slice().sort((a, b) => vistas.get(b.id).distincion - vistas.get(a.id).distincion);
barraConceptos.innerHTML = NIVELES.map((n, i) => {
  const max = i ? NIVELES[i - 1].min : Infinity;
  const grupo = ordenados.filter((c) => { const d = vistas.get(c.id).distincion; return d >= n.min && d < max; });
  if (!grupo.length) return "";
  return `<div class="nivel"><div class="nivel-titulo"><strong>${n.titulo}</strong>${n.nota}</div>
    <div class="nivel-botones">${grupo.map((c) => `<button class="concepto-boton" type="button" data-concepto="${c.id}" aria-pressed="false"
      title="${esc(c.concepto)}: poder distintivo ${Math.round(vistas.get(c.id).distincion * 100)}/100">${esc(c.corto)}${barras(vistas.get(c.id).distincion)}</button>`).join("")}</div></div>`;
}).join("");
barraConceptos.addEventListener("click", (ev) => {
  const b = ev.target.closest("[data-concepto]");
  if (b) actualizar({ modo: "concepto", concepto: b.dataset.concepto, variante: null, pais: null, palabra: null });
});

// --- Selector de vista ------------------------------------------------------
const selectorVista = document.getElementById("vistas");
selectorVista.addEventListener("click", (ev) => {
  const b = ev.target.closest("[data-vista]");
  if (b) actualizar({ vista: b.dataset.vista, modo: "concepto", variante: null });
});

// --- Buscador ------------------------------------------------------------
const buscador = document.getElementById("buscador");
const limpiar = document.getElementById("limpiar");
buscador.addEventListener("change", () => {
  const q = buscador.value.trim();
  actualizar(q ? { modo: "palabra", palabra: q, pais: null, variante: null } : { modo: "concepto", palabra: null });
});
limpiar.addEventListener("click", () => { buscador.value = ""; actualizar({ modo: "concepto", palabra: null, pais: null }); });

// --- Clic en una palabra (leyenda o panel) ---------------------------------
document.addEventListener("click", (ev) => {
  const b = ev.target.closest("[data-variante]");
  if (!b) return;
  const v = b.dataset.variante;
  actualizar({ variante: estado.variante === v ? null : v, pais: null });
});

// --- Mapa ------------------------------------------------------------------
iniciarMapa(paises, { alHacerClic: (iso) => actualizar({ pais: estado.pais === iso ? null : iso, variante: null }) });
definirInfo(({ iso3, nombre }) => {
  if (estado.modo === "palabra") return esc(nombre);
  const vs = vistas.get(estado.concepto).porPais.get(iso3) || [];
  if (!vs.length) return `<strong>${esc(nombre)}</strong><br>sin registro: probablemente la forma general`;
  return `<strong>${esc(nombre)}</strong>` + vs.map((v) =>
    `<br>${esc(v.forma)}<span class="origen">${esc(v.etimologia?.texto || "Origen sin documentar.")}</span>`).join("");
});

function render() {
  const leyenda = document.getElementById("leyenda");
  const origen = estado.vista === "origen";
  configurarPanel({ vista: estado.vista });
  limpiar.hidden = estado.modo !== "palabra";
  selectorVista.querySelectorAll("[data-vista]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.vista === estado.vista)));
  barraConceptos.querySelectorAll("[data-concepto]").forEach((b) =>
    b.setAttribute("aria-pressed", String(estado.modo === "concepto" && b.dataset.concepto === estado.concepto)));

  if (estado.modo === "palabra") {
    const hallado = indiceLemas.get(normalizar(estado.palabra));
    const marcados = new Set(hallado?.paises || []);
    document.getElementById("titular-concepto").textContent = estado.palabra;
    pintar({ relleno: (iso) => (marcados.has(iso) ? colorTono(1) : null), etiqueta: () => null, activo: estado.pais, resaltados: null });
    fichaPalabra(hallado?.lema || estado.palabra, hallado?.paises);
    leyenda.innerHTML = `<span class="leyenda-nota"><span class="muestra" style="background:${colorTono(1)}"></span>marcada como regional</span>
      <span class="leyenda-nota"><span class="muestra rayada"></span>sin marca</span>`;
    return;
  }

  const concepto = porId.get(estado.concepto);
  const vista = vistas.get(concepto.id);
  document.getElementById("titular-concepto").textContent = concepto.corto;
  const variante = vista.variantes.find((v) => v.forma === estado.variante);

  pintar({
    relleno: (iso) => {
      const vs = vista.porPais.get(iso);
      if (!vs) return null;
      return origen ? colorOrigen(grupoDe(vs[0])) : colorTono(vs[0].tono);
    },
    etiqueta: (iso) => {
      const vs = vista.porPais.get(iso);
      if (!vs) return null;
      if (variante && vs.includes(variante)) return variante.forma;
      return vs.length > 1 ? `${vs[0].forma} +${vs.length - 1}` : vs[0].forma;
    },
    activo: estado.pais,
    resaltados: variante ? new Set(variante.paises) : null,
  });

  if (origen) {
    const presentes = Object.keys(ORIGENES).filter((g) => vista.variantes.some((v) => grupoDe(v) === g));
    leyenda.innerHTML = presentes.map((g) => `<span class="leyenda-nota" title="${esc(ORIGENES[g].contexto)}"><span class="muestra" style="background:${colorOrigen(g)}"></span>${esc(ORIGENES[g].nombre)}</span>`).join("")
      + `<span class="leyenda-nota"><span class="muestra rayada"></span>sin registro</span>`;
  } else {
    leyenda.innerHTML = vista.variantes.map((v) =>
      `<button class="leyenda-item" type="button" data-variante="${esc(v.forma)}" aria-pressed="${v === variante}" title="${esc(v.etimologia?.texto || "")}">
         <span class="muestra" style="background:${colorTono(v.tono)}"></span>${esc(v.forma)} <small>${v.paises.length}</small></button>`).join("")
      + `<span class="leyenda-nota"><span class="muestra rayada"></span>sin registro</span>`;
  }

  tablaConcepto(vista, PAISES);
  if (variante) fichaVariante(concepto, variante);
  else if (estado.pais) fichaPais(estado.pais, vista, concepto, parecidos);
  else fichaConcepto(concepto, vista);
}

suscribir(render);

function desdeURL() {
  const u = leerURL();
  if (!porId.has(u.concepto)) u.concepto = estado.concepto || (porId.has(PORTADA) ? PORTADA : conceptos[0].id);
  buscador.value = u.palabra || "";
  actualizar(u);
}
desdeURL();
// Enlaces internos o el botón «atrás» cambian el hash sin recargar la página
window.addEventListener("hashchange", desdeURL);
