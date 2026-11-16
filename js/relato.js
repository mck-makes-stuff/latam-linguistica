// Apertura y relato de la portada: una palabra primero, luego todas, luego su origen.
import { cargarTodo, vistaConcepto, colorTono, colorOrigen, grupoDe, ORIGENES } from "./datos.js";
import { crearMapa } from "./mapa.js";
import { esc } from "./panel.js";

const reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;

// La altura del encabezado fijo define dónde se pega el mapa del relato
const encabezado = document.querySelector(".encabezado");
const medir = () => document.documentElement.style.setProperty("--alto-encabezado", `${encabezado.offsetHeight}px`);
medir();
addEventListener("resize", medir);

// Cada visita empieza por la apertura (el navegador no debe restaurar el desplazamiento)
history.scrollRestoration = "manual";
// Un enlace compartido a un concepto o palabra va directo al explorador
if (!/concepto=|palabra=/.test(location.hash)) scrollTo(0, 0);
else {
  document.body.classList.add("sin-apertura");
  requestAnimationFrame(() => document.getElementById("explorar").scrollIntoView());
}

const { paises, conceptos } = await cargarTodo();
const nombres = Object.fromEntries(paises.map((f) => [f.properties.iso3, f.properties.nombre]));
const concepto = conceptos.find((c) => c.id === "palomitas");
const vista = vistaConcepto(concepto);
const porForma = new Map(vista.variantes.map((v) => [v.forma, v]));
const color = (forma) => colorTono(porForma.get(forma)?.tono);

// --- Apertura: la palabra cambia de país en país ----------------------------------
const giro = [["palomitas", "ESP", "var(--var-otras)"], ...[["pochoclo", "ARG"], ["pororó", "PRY"], ["cancha", "PER"], ["canguil", "ECU"],
  ["crispeta", "COL"], ["cotufa", "VEN"], ["poporopo", "GTM"], ["cabrita", "CHL"], ["pipoca", "BOL"]]
  .filter(([f, iso]) => porForma.get(f)?.paises.includes(iso)).map(([f, iso]) => [f, iso, color(f)])];
const caja = document.querySelector(".apertura-palabra");
const palabra = document.getElementById("palabra-giratoria");
const pais = document.getElementById("pais-giratorio");
let indice = 0;
function siguientePalabra() {
  caja.classList.add("cambiando");
  setTimeout(() => {
    indice = (indice + 1) % giro.length;
    const [f, iso, c] = giro[indice];
    palabra.textContent = f;
    pais.textContent = nombres[iso] || iso;
    caja.style.setProperty("--c", c);
    caja.classList.remove("cambiando");
  }, 260);
}
pais.textContent = nombres.ESP;

// Mapa tenue detrás de la pregunta: se ilumina el país de cada palabra
const mapaApertura = crearMapa(paises, { svg: "#mapa-apertura", info: "#info-apertura", contenedor: "#apertura", id: "a" });
const iluminar = () => {
  const [f, iso, c] = giro[indice];
  const v = porForma.get(f);
  const lugares = new Set(f === "palomitas" ? ["ESP"] : v ? [iso] : []);
  mapaApertura.pintar({ relleno: (p) => (lugares.has(p) ? c : "var(--crema-2)"), etiqueta: () => null, recuadroDestacado: lugares.has("ESP") });
};
mapaApertura.pintar({ relleno: () => "var(--crema-2)", etiqueta: () => null });

// Primero la pregunta sola: unos segundos para pensar la respuesta propia
const PAUSA = 5200, INTERVALO = 1600;
if (!reducido) {
  let reloj = null;
  setTimeout(() => {
    caja.classList.remove("esperando");
    iluminar();
    reloj = setInterval(() => { siguientePalabra(); setTimeout(iluminar, 260); }, INTERVALO);
  }, Math.max(0, PAUSA - performance.now()));
  // Tras unas cuantas palabras, si la persona no se ha movido, bajamos solos al relato
  let tocado = false;
  for (const ev of ["wheel", "touchstart", "keydown", "mousedown"]) addEventListener(ev, () => { tocado = true; }, { once: true, passive: true });
  setTimeout(() => {
    if (!tocado && scrollY < 40 && !document.body.classList.contains("sin-apertura")) {
      document.getElementById("relato").scrollIntoView({ behavior: "smooth" });
    }
  }, Math.max(0, PAUSA - performance.now()) + INTERVALO * 6);
  addEventListener("scroll", () => { if (scrollY > innerHeight) clearInterval(reloj); }, { passive: true });
} else {
  caja.classList.remove("esperando");
  iluminar();
}

// --- Relato -------------------------------------------------------------------
document.querySelectorAll(".palabra-marcada").forEach((s) => s.style.setProperty("--c", color(s.dataset.forma)));

const mapa = crearMapa(paises, { svg: "#mapa-relato", info: "#info-relato", contenedor: "#relato-caja", id: "r" });
const leyenda = document.getElementById("relato-leyenda");
const NEUTRO = "var(--crema-2)";
const sinRayas = (fn) => (iso) => fn(iso) ?? NEUTRO;
let pasoActual = -1;

mapa.definirInfo(({ iso3, nombre }) => {
  const vs = vista.porPais.get(iso3) || [];
  return `<strong>${esc(nombre)}</strong><br>${vs.map((v) => esc(v.forma)).join(", ") || "sin palabra regional registrada"}`;
});

function soloFormas(formas) {
  return (iso) => {
    const v = (vista.porPais.get(iso) || []).find((x) => formas.includes(x.forma));
    return v ? color(v.forma) : null;
  };
}
const etiquetaFormas = (formas) => (iso) => (vista.porPais.get(iso) || []).find((x) => formas.includes(x.forma))?.forma || null;
const chip = (c, texto) => `<span><span class="muestra" style="background:${c}"></span>${esc(texto)}</span>`;
const principal = (iso) => vista.porPais.get(iso)?.[0];

const PASOS = [
  () => {
    mapa.pintar({ relleno: () => NEUTRO, etiqueta: () => null });
    leyenda.innerHTML = "";
  },
  () => {
    const f = ["pochoclo"];
    mapa.pintar({ relleno: sinRayas(soloFormas(f)), etiqueta: etiquetaFormas(f) });
    leyenda.innerHTML = chip(color("pochoclo"), "pochoclo");
  },
  () => {
    const f = ["pochoclo", "cancha", "canguil", "crispeta", "cotufa"];
    mapa.pintar({ relleno: sinRayas(soloFormas(f)), etiqueta: etiquetaFormas(f) });
    leyenda.innerHTML = f.map((x) => chip(color(x), x)).join("");
  },
  () => {
    mapa.pintar({
      relleno: (iso) => (principal(iso) ? colorTono(principal(iso).tono) : null),
      etiqueta: (iso) => { const vs = vista.porPais.get(iso); return vs ? (vs.length > 1 ? `${vs[0].forma} +${vs.length - 1}` : vs[0].forma) : null; },
    });
    leyenda.innerHTML = vista.variantes.map((v) => chip(colorTono(v.tono), v.forma)).join("")
      + `<span><span class="muestra rayada"></span>sin palabra regional</span>`;
  },
  () => {
    mapa.pintar({
      relleno: (iso) => (principal(iso) ? colorOrigen(grupoDe(principal(iso))) : null),
      etiqueta: (iso) => principal(iso)?.forma || null,
    });
    const grupos = Object.keys(ORIGENES).filter((g) => vista.variantes.some((v) => grupoDe(v) === g));
    leyenda.innerHTML = grupos.map((g) => chip(colorOrigen(g), ORIGENES[g].nombre)).join("");
  },
  () => {
    const cotufa = porForma.get("cotufa");
    mapa.pintar({
      relleno: (iso) => (principal(iso) ? colorTono(principal(iso).tono) : null),
      etiqueta: (iso) => (cotufa?.paises.includes(iso) ? "cotufa" : null),
      resaltados: new Set(cotufa?.paises || []),
      recuadroDestacado: true,
    });
    leyenda.innerHTML = chip(color("cotufa"), "cotufa: Canarias (España) y Venezuela");
  },
];

function activar(n) {
  if (n === pasoActual) return;
  pasoActual = n;
  document.querySelectorAll(".paso").forEach((p) => p.classList.toggle("activo", +p.dataset.paso === n));
  PASOS[n]();
}
activar(0);

const observador = new IntersectionObserver((entradas) => {
  for (const e of entradas) if (e.isIntersecting) activar(+e.target.dataset.paso);
}, { rootMargin: matchMedia("(max-width: 760px)").matches ? "-62% 0px -30% 0px" : "-45% 0px -45% 0px" });
document.querySelectorAll(".paso").forEach((p) => observador.observe(p));
