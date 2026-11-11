// Punto de entrada: conecta datos, estado, mapa y panel.
import { cargarTodo, variantesPorPais, normalizar } from "./datos.js";
import { estado, actualizar, suscribir, leerURL } from "./estado.js";
import { iniciarMapa, pintar, definirInfo } from "./mapa.js";
import { fichaConcepto, fichaPais, fichaPalabra } from "./panel.js";

const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

const { paises, conceptos, lemas } = await cargarTodo();
const nombres = Object.fromEntries(paises.map((f) => [f.properties.iso3, f.properties.nombre]));
const porId = new Map(conceptos.conceptos.map((c) => [c.id, c]));
const indiceLemas = new Map(Object.entries(lemas.lemas).map(([l, p]) => [normalizar(l), { lema: l, paises: p }]));

// --- Controles ---------------------------------------------------------
const selector = document.getElementById("selector-concepto");
selector.innerHTML = conceptos.conceptos
  .map((c) => `<option value="${c.id}">${c.concepto}</option>`).join("");
selector.addEventListener("change", () => actualizar({ modo: "concepto", concepto: selector.value, pais: null }));

const buscador = document.getElementById("buscador");
buscador.addEventListener("change", () => {
  const q = buscador.value.trim();
  if (q) actualizar({ modo: "palabra", palabra: q, pais: null });
  else actualizar({ modo: "concepto" });
});

// --- Mapa ----------------------------------------------------------------
iniciarMapa(paises, { alHacerClic: (iso) => actualizar({ pais: estado.pais === iso ? null : iso }) });

definirInfo(({ iso3, nombre }) => {
  if (estado.modo === "palabra") return nombre;
  const vs = variantesPorPais(porId.get(estado.concepto)).get(iso3) || [];
  return `<strong>${nombre}</strong><br>${vs.map((v) => v.forma).join(", ") || "—"}`;
});

function render() {
  const leyenda = document.getElementById("leyenda");
  if (estado.modo === "palabra") {
    const hallado = indiceLemas.get(normalizar(estado.palabra));
    const set = new Set(hallado?.paises || []);
    pintar({ relleno: (iso) => (set.has(iso) ? css("--dato-3") : null), etiquetas: () => null, activo: estado.pais });
    fichaPalabra(hallado?.lema || estado.palabra, hallado?.paises, nombres);
    leyenda.innerHTML = `<span><i style="background:${css("--dato-3")}"></i>marcada como regional</span>
                         <span><i style="background:${css("--arena")}"></i>sin marca</span>`;
    return;
  }
  const concepto = porId.get(estado.concepto);
  selector.value = concepto.id;
  const vpp = variantesPorPais(concepto);
  // Fase 1: intensidad = nº de variantes registradas en el país (monocromo)
  const escala = [css("--dato-1"), css("--dato-2"), css("--dato-3"), css("--dato-4")];
  pintar({
    relleno: (iso) => (vpp.has(iso) ? escala[Math.min(vpp.get(iso).length, 4) - 1] : null),
    etiquetas: (iso) => vpp.get(iso)?.slice(0, 2).map((v) => v.forma).join(" / ") ?? null,
    activo: estado.pais,
  });
  leyenda.innerHTML = ["1", "2", "3", "4+"].map((n, i) => `<span><i style="background:${escala[i]}"></i>${n} variante${n === "1" ? "" : "s"}</span>`).join("")
    + `<span><i style="background:${css("--arena")}"></i>sin registro</span>`;
  if (estado.pais) fichaPais(estado.pais, nombres[estado.pais], vpp.get(estado.pais), concepto);
  else fichaConcepto(concepto, nombres);
}

suscribir(render);
const inicial = leerURL();
// Portada: «palomitas» (muchas variantes, sorprende a primera vista); si no existe, el primero
if (!porId.has(inicial.concepto)) inicial.concepto = porId.has("palomitas") ? "palomitas" : conceptos.conceptos[0].id;
buscador.value = inicial.palabra || "";
actualizar(inicial);

// Enlaces internos o el botón «atrás» cambian el hash sin recargar la página
window.addEventListener("hashchange", () => {
  const u = leerURL();
  if (!porId.has(u.concepto)) u.concepto = estado.concepto;
  buscador.value = u.palabra || "";
  actualizar(u);
});
