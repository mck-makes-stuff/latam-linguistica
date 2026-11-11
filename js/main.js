// Punto de entrada: conecta datos, estado, mapa y panel.
import { cargarTodo, vistaConcepto, colorTono, normalizar } from "./datos.js";
import { estado, actualizar, suscribir, leerURL } from "./estado.js";
import { iniciarMapa, pintar, definirInfo } from "./mapa.js";
import { esc, fichaConcepto, fichaVariante, fichaPais, fichaPalabra, tablaConcepto } from "./panel.js";

const PORTADA = "palomitas";
const ORDEN_PAISES = ["MEX", "GTM", "SLV", "HND", "NIC", "CRI", "PAN", "CUB", "DOM", "PRI",
  "VEN", "COL", "ECU", "PER", "BOL", "CHL", "PRY", "ARG", "URY", "ESP"];

const { paises, conceptos, lemas } = await cargarTodo();
const nombres = Object.fromEntries(paises.map((f) => [f.properties.iso3, f.properties.nombre]));
const porId = new Map(conceptos.map((c) => [c.id, c]));
const indiceLemas = new Map(Object.entries(lemas).map(([l, p]) => [normalizar(l), { lema: l, paises: p }]));
const vistas = new Map(conceptos.map((c) => [c.id, vistaConcepto(c)]));

// --- Botones de concepto -------------------------------------------------
const barraConceptos = document.getElementById("conceptos");
barraConceptos.innerHTML = conceptos
  .slice().sort((a, b) => a.corto.replace("¡", "").localeCompare(b.corto.replace("¡", ""), "es"))
  .map((c) => `<button class="concepto-boton" type="button" data-concepto="${c.id}" aria-pressed="false" title="${esc(c.concepto)}">${esc(c.corto)}</button>`)
  .join("");
barraConceptos.addEventListener("click", (ev) => {
  const b = ev.target.closest("[data-concepto]");
  if (b) actualizar({ modo: "concepto", concepto: b.dataset.concepto, variante: null, pais: null, palabra: null });
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
  return `<strong>${esc(nombre)}</strong><br>${vs.map((v) => esc(v.forma)).join(", ") || "sin registro verificado"}`;
});

function render() {
  const leyenda = document.getElementById("leyenda");
  limpiar.hidden = estado.modo !== "palabra";
  barraConceptos.querySelectorAll("[data-concepto]").forEach((b) =>
    b.setAttribute("aria-pressed", String(estado.modo === "concepto" && b.dataset.concepto === estado.concepto)));

  if (estado.modo === "palabra") {
    const hallado = indiceLemas.get(normalizar(estado.palabra));
    const marcados = new Set(hallado?.paises || []);
    document.getElementById("titular-concepto").textContent = estado.palabra;
    pintar({ relleno: (iso) => (marcados.has(iso) ? colorTono(2) : null), etiqueta: () => null, activo: estado.pais, resaltados: null });
    fichaPalabra(hallado?.lema || estado.palabra, hallado?.paises, nombres);
    leyenda.innerHTML = `<span class="leyenda-nota"><span class="muestra" style="background:${colorTono(2)}"></span>marcada como regional</span>
      <span class="leyenda-nota"><span class="muestra rayada"></span>sin marca</span>`;
    return;
  }

  const concepto = porId.get(estado.concepto);
  const vista = vistas.get(concepto.id);
  document.getElementById("titular-concepto").textContent = concepto.corto;
  const variante = vista.variantes.find((v) => v.forma === estado.variante);

  pintar({
    relleno: (iso) => { const vs = vista.porPais.get(iso); return vs ? colorTono(vs[0].tono) : null; },
    etiqueta: (iso) => {
      const vs = vista.porPais.get(iso);
      if (!vs) return null;
      if (variante && vs.includes(variante)) return variante.forma;
      return vs.length > 1 ? `${vs[0].forma} +${vs.length - 1}` : vs[0].forma;
    },
    activo: estado.pais,
    resaltados: variante ? new Set(variante.paises) : null,
  });

  leyenda.innerHTML = vista.variantes.map((v) =>
    `<button class="leyenda-item" type="button" data-variante="${esc(v.forma)}" aria-pressed="${v === variante}">
       <span class="muestra" style="background:${colorTono(v.tono)}"></span>${esc(v.forma)} <small>${v.paises.length}</small></button>`).join("")
    + `<span class="leyenda-nota"><span class="muestra rayada"></span>sin registro verificado</span>`;

  tablaConcepto(vista, nombres, ORDEN_PAISES);
  if (variante) fichaVariante(concepto, variante, nombres);
  else if (estado.pais) fichaPais(estado.pais, nombres, vista, concepto);
  else fichaConcepto(concepto, vista, nombres);
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
