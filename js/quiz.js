// «¿De dónde eres?»: el usuario dice cómo nombra cada concepto y el mapa
// acumula en qué países se registran sus palabras.
import { cargarTodo, vistaConcepto, similitudes, PAISES } from "./datos.js";
import { iniciarMapa, pintar, definirInfo } from "./mapa.js";
import { esc } from "./panel.js";

const MAX_PREGUNTAS = 8;
const NINGUNA = "__ninguna__";

const { paises, conceptos } = await cargarTodo();
const nombres = Object.fromEntries(paises.map((f) => [f.properties.iso3, f.properties.nombre]));
const vistas = new Map(conceptos.map((c) => [c.id, vistaConcepto(c)]));
const parecidos = similitudes(vistas);
const porId = new Map(conceptos.map((c) => [c.id, c]));
const lista = (isos) => isos.map((p) => esc(nombres[p] || p)).join(", ");

// --- Puntuación ---------------------------------------------------------------
/** Puntos que suma cada país según las palabras elegidas para un concepto. */
function puntos(idConcepto, elegidas) {
  const vista = vistas.get(idConcepto);
  const out = new Map();
  for (const iso of PAISES) {
    const propias = (vista.porPais.get(iso) || []).map((v) => v.forma);
    if (elegidas.includes(NINGUNA)) out.set(iso, propias.length ? -1 : 1);
    else if (elegidas.some((f) => propias.includes(f))) out.set(iso, 2);
    else out.set(iso, propias.length ? -1 : 0); // sin registro: no sabemos
  }
  return out;
}

const pesos = (marcador) => {
  const max = Math.max(...marcador.values());
  const w = new Map([...marcador].map(([k, s]) => [k, Math.exp((s - max) / 2)]));
  const total = [...w.values()].reduce((a, b) => a + b, 0);
  return new Map([...w].map(([k, x]) => [k, x / total]));
};

/** Concepto que mejor separa a los países que siguen en juego (máxima entropía de la respuesta). */
function siguiente(marcador, hechas) {
  const w = pesos(marcador);
  let mejor = null, hMax = -1;
  for (const c of conceptos) {
    if (hechas.includes(c.id)) continue;
    const vista = vistas.get(c.id);
    const dist = new Map();
    for (const iso of PAISES) {
      const k = vista.porPais.get(iso)?.[0]?.forma ?? "—";
      dist.set(k, (dist.get(k) || 0) + w.get(iso));
    }
    let h = 0;
    for (const p of dist.values()) if (p > 0) h -= p * Math.log2(p);
    if (h > hMax) { hMax = h; mejor = c.id; }
  }
  return mejor;
}

// --- Estado ---------------------------------------------------------------------
let marcador, hechas, respuestas, actual, elegidas;
function reiniciar() {
  marcador = new Map(PAISES.map((p) => [p, 0]));
  hechas = []; respuestas = []; elegidas = new Set();
  actual = siguiente(marcador, hechas);
  pintarMapa();
  mostrarPregunta();
}

// --- Mapa -------------------------------------------------------------------
const tono = d3.interpolateRgb("#f0e7d8", "#7a5c3a");
iniciarMapa(paises, { alHacerClic: () => {} });
definirInfo(({ iso3, nombre }) => {
  const s = marcador.get(iso3);
  const aciertos = respuestas.filter((r) => r.puntos.get(iso3) > 0).map((r) => r.palabras).flat();
  return `<strong>${esc(nombre)}</strong><br>${hechas.length ? `${s > 0 ? "+" : ""}${s} puntos${aciertos.length ? `<span class="origen">coincide: ${aciertos.map(esc).join(", ")}</span>` : ""}` : "aún sin respuestas"}`;
});
function pintarMapa() {
  const vals = [...marcador.values()];
  const min = Math.min(...vals), max = Math.max(...vals);
  const top = [...marcador].sort((a, b) => b[1] - a[1])[0][0];
  pintar({
    relleno: (iso) => (!hechas.length ? null : tono(max === min ? 0.15 : 0.08 + 0.92 * (marcador.get(iso) - min) / (max - min))),
    etiqueta: (iso) => (hechas.length && iso === top && max > min ? nombres[iso] : null),
    activo: null, resaltados: null,
  });
}

// --- Pregunta -------------------------------------------------------------------
const caja = document.getElementById("pregunta");
function mostrarPregunta() {
  const c = porId.get(actual);
  const formas = vistas.get(actual).variantes.map((v) => v.forma).sort((a, b) => a.localeCompare(b, "es"));
  caja.innerHTML = `
    <p class="numero">Pregunta ${hechas.length + 1} de ${MAX_PREGUNTAS}</p>
    <h2>¿Cómo lo dices tú?</h2>
    <p class="definicion"><strong>${esc(c.definicion)}</strong></p>
    <div class="opciones">${formas.map((f) => `<button type="button" class="opcion" data-forma="${esc(f)}" aria-pressed="false">${esc(f)}</button>`).join("")}
      <button type="button" class="opcion ninguna" data-forma="${NINGUNA}" aria-pressed="false">ninguna de estas</button></div>
    <button type="button" class="boton" id="responder" disabled>Responder</button>
    ${hechas.length ? `<button type="button" class="boton secundario" id="terminar">Ver resultado ya</button>` : ""}`;
}

function mostrarRespuesta(r) {
  const c = porId.get(r.concepto);
  const vista = vistas.get(r.concepto);
  const palabras = r.palabras.includes(NINGUNA) ? [] : vista.variantes.filter((v) => r.palabras.includes(v.forma));
  const ultima = hechas.length >= MAX_PREGUNTAS || decidido();
  caja.innerHTML = `
    <p class="numero">Pregunta ${hechas.length} de ${MAX_PREGUNTAS}</p>
    <h2>${esc(c.corto)}</h2>
    <div class="respuesta">
      ${palabras.length ? `<ul>${palabras.map((v) => `<li><strong>${esc(v.forma)}</strong> se registra en ${lista(v.paises)}.
          <div class="fuente">${esc(v.etimologia?.texto || "Origen sin documentar.")}</div></li>`).join("")}</ul>`
        : `<p>Elegiste «ninguna»: sube la puntuación de los países donde no hay una palabra regional registrada (${lista(PAISES.filter((p) => !vista.porPais.has(p))) || "ninguno"}).</p>`}
      <p class="fuente">Otras formas: ${vista.variantes.filter((v) => !r.palabras.includes(v.forma)).slice(0, 6).map((v) => `<em>${esc(v.forma)}</em> (${lista(v.paises)})`).join("; ")}.</p>
    </div>
    <button type="button" class="boton" id="${ultima ? "terminar" : "seguir"}">${ultima ? "Ver resultado" : "Siguiente pregunta"}</button>`;
}

function decidido() {
  if (hechas.length < 4) return false;
  return Math.max(...pesos(marcador).values()) >= 0.75;
}

function mostrarResultado() {
  const w = pesos(marcador);
  const rank = [...w].sort((a, b) => b[1] - a[1]);
  const [primero, segundo] = rank;
  const empate = segundo && segundo[1] > primero[1] * 0.6;
  const clave = respuestas.filter((r) => r.puntos.get(primero[0]) > 0 && [...r.puntos.values()].filter((x) => x > 0).length <= 4);
  const vecino = empate ? parecidos(primero[0]).find((p) => p.pais === segundo[0]) : null;
  caja.innerHTML = `<div class="resultado">
    <p class="numero">Resultado tras ${hechas.length} preguntas</p>
    <h2>${empate ? `${esc(nombres[primero[0]])} o ${esc(nombres[segundo[0]])}` : esc(nombres[primero[0]])}</h2>
    <ol class="ranking">${rank.slice(0, 5).map(([iso, p]) => `<li><span>${esc(nombres[iso])}</span><span class="pct">${Math.round(p * 100)} %</span>
      <span class="barra-p"><i style="width:${Math.round(p * 100)}%"></i></span></li>`).join("")}</ol>
    ${clave.length ? `<p><strong>Palabras decisivas:</strong> ${clave.map((r) => r.palabras.map((f) => `<em>${esc(f)}</em>`).join(", ")).join("; ")}. Son poco compartidas: aparecen en muy pocos países.</p>` : ""}
    ${empate ? `<p class="aviso">Tus palabras no separan bien ${esc(nombres[primero[0]])} de ${esc(nombres[segundo[0]])}${vecino?.comunes.length ? `: en el mapa comparten ${vecino.comunes.length} palabras (${vecino.comunes.slice(0, 5).map(esc).join(", ")})` : ""}. Los países vecinos o con historia común suelen compartir vocabulario; para distinguirlos harían falta otros rasgos (pronunciación, entonación, gramática) que este mapa no recoge.</p>`
      : `<p class="fuente">Las palabras que comparten muchos países (bacán, chamba) apenas ayudan; las de un solo país o región (pibe, guagua, chela) son las que delatan el origen.</p>`}
    <p class="fuente">Recuerda: es un juego con datos incompletos. Que una palabra no esté registrada en un país no significa que allí no se use.</p>
    <button type="button" class="boton" id="otra-vez">Volver a jugar</button></div>`;
}

caja.addEventListener("click", (ev) => {
  const op = ev.target.closest("[data-forma]");
  if (op) {
    const f = op.dataset.forma;
    if (f === NINGUNA) elegidas = new Set(elegidas.has(NINGUNA) ? [] : [NINGUNA]);
    else { elegidas.delete(NINGUNA); elegidas.has(f) ? elegidas.delete(f) : elegidas.add(f); }
    caja.querySelectorAll("[data-forma]").forEach((b) => b.setAttribute("aria-pressed", String(elegidas.has(b.dataset.forma))));
    document.getElementById("responder").disabled = !elegidas.size;
    return;
  }
  const id = ev.target.id;
  if (id === "responder") {
    const pal = [...elegidas];
    const p = puntos(actual, pal);
    for (const [iso, x] of p) marcador.set(iso, marcador.get(iso) + x);
    hechas.push(actual);
    respuestas.push({ concepto: actual, palabras: pal, puntos: p });
    elegidas = new Set();
    pintarMapa();
    mostrarRespuesta(respuestas.at(-1));
  } else if (id === "seguir") {
    actual = siguiente(marcador, hechas);
    mostrarPregunta();
  } else if (id === "terminar") {
    mostrarResultado();
  } else if (id === "otra-vez") {
    reiniciar();
  }
});

// --- Simulación: ¿qué países se pueden identificar con todas las preguntas? --------
function simular() {
  const respuestaDe = (iso, id) => {
    const propias = (vistas.get(id).porPais.get(iso) || []).map((v) => v.forma);
    return propias.length ? propias : [NINGUNA];
  };
  const jugar = (iso, limite) => {
    const m = new Map(PAISES.map((p) => [p, 0]));
    const hechas = [];
    while (hechas.length < limite) {
      const id = siguiente(m, hechas);
      if (!id) break;
      for (const [p, x] of puntos(id, respuestaDe(iso, id))) m.set(p, m.get(p) + x);
      hechas.push(id);
    }
    const rank = [...pesos(m)].sort((a, b) => b[1] - a[1]);
    return { acierta: rank[0][0] === iso, segundo: rank[0][0] === iso ? rank[1] : rank[0], p: pesos(m).get(iso) };
  };
  const filas = PAISES.map((iso) => ({ iso, corto: jugar(iso, MAX_PREGUNTAS), largo: jugar(iso, conceptos.length) }));
  const n8 = filas.filter((f) => f.corto.acierta).length, nT = filas.filter((f) => f.largo.acierta).length;
  const celda = (r) => `${r.acierta ? "Sí" : "No"} <span class="fuente">(${Math.round(r.p * 100)} %; luego ${esc(nombres[r.segundo[0]])}, ${Math.round(r.segundo[1] * 100)} %)</span>`;
  document.getElementById("simulacion").innerHTML = `
    <p>Simulamos a una persona de cada país que responde con todas las palabras registradas para su país. Con las ${MAX_PREGUNTAS} preguntas del juego acertamos <strong>${n8} de ${PAISES.length}</strong> países; con las ${conceptos.length} preguntas, <strong>${nT} de ${PAISES.length}</strong>.</p>
    <table class="identificables"><thead><tr><th>País</th><th>Con ${MAX_PREGUNTAS} preguntas</th><th>Con ${conceptos.length}</th></tr></thead><tbody>
    ${filas.map((f) => `<tr><th scope="row">${esc(nombres[f.iso])}</th><td>${celda(f.corto)}</td><td>${celda(f.largo)}</td></tr>`).join("")}
    </tbody></table>
    <p class="fuente">Ojo: es un caso ideal. La persona simulada usa exactamente las palabras registradas, así que el resultado mide sobre todo cuánto vocabulario propio hemos documentado para cada país. Una persona real mezcla palabras generales, de su región y de los medios. Los segundos puestos suelen ser vecinos (Argentina y Uruguay comparten el español rioplatense; Centroamérica comparte muchas voces). En la vida real, la pronunciación y la gramática (el voseo, por ejemplo) ayudan a desempatar.</p>`;
}

simular();
reiniciar();
