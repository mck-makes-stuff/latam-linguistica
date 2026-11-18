// Panel lateral y tabla de datos: fichas de concepto, variante, país y palabra,
// con citas explícitas para cada dato y la etimología de cada palabra.
import { colorTono, colorOrigen, grupoDe, ORIGENES, LECTURAS } from "./datos.js";

const $ = (id) => document.getElementById(id);
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const lista = (isos, nombres) => isos.map((p) => esc(nombres[p] || p)).join(", ");
const urlWikt = (f) => `https://es.wiktionary.org/wiki/${encodeURIComponent(f.replace(/ /g, "_"))}`;
const NIVEL = { lexicografica: "B, lexicográfica", divulgativa: "C, divulgativa", comercial: "D, comercial", colaborativa: "D, colaborativa" };

// Contexto común (nombres de países, fecha de consulta, catálogo de fuentes web, vista actual)
let ctx = { nombres: {}, generado: "", fuentesWeb: {}, vista: "palabras" };
export function configurarPanel(c) { ctx = { ...ctx, ...c }; }

const fecha = () => (ctx.generado ? new Date(ctx.generado + "T12:00").toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" }) : "");
const muestra = (v) => `<span class="muestra" style="background:${ctx.vista === "origen" ? colorOrigen(grupoDe(v)) : colorTono(v.tono)}"></span>`;
const muestraGrupo = (g) => `<span class="muestra" style="background:${colorOrigen(g)}"></span>`;

/** Citas de una variante (para un país o para todos). Devuelve HTML de <li>. */
export function citas(v, iso = null) {
  const ev = v.evidencia.filter((e) => !iso || e.pais === iso);
  const out = [];
  const wik = ev.filter((e) => e.fuente === "Wikcionario");
  if (wik.length) {
    const sentido = wik.find((e) => e.sentido)?.sentido?.replace(/<[^>]+>/g, "");
    out.push(`«${esc(v.forma)}», en <em>Wikcionario, el diccionario libre</em>${sentido ? `, acepción «${esc(sentido)}»` : ""}; marca regional: ${lista([...new Set(wik.map((e) => e.pais))], ctx.nombres)}. Consultado el ${fecha()}. <a href="${urlWikt(v.forma)}" target="_blank" rel="noopener">es.wiktionary.org/wiki/${esc(v.forma)}</a>`);
  }
  const web = [...new Map(ev.filter((e) => e.url && e.fuente !== "Wikcionario").map((e) => [e.url + e.pais, e])).values()];
  for (const e of web) {
    out.push(`Lista de ${esc(ctx.nombres[e.pais] || e.pais)} en ${esc(e.fuente)}. Fuente de nivel ${NIVEL[e.tipo] || esc(e.tipo || "web")}. <a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.url.replace(/^https?:\/\//, "").slice(0, 60))}</a>`);
  }
  return out;
}

export function bloqueEtimologia(v) {
  const et = v.etimologia;
  const g = grupoDe(v);
  if (!et) {
    return `<div class="etimologia"><span class="grupo">${muestraGrupo("incierto")}Origen sin documentar</span>
      <p style="margin:.3rem 0 0">Nuestras fuentes no explican de dónde viene esta palabra con este sentido.</p></div>`;
  }
  const provisional = /por verificar/i.test(et.fuente || "");
  const cita = et.fuente === "Wikcionario"
    ? `Fuente: «${esc(v.forma)}», sección Etimología, en <em>Wikcionario</em>. <a href="${esc(et.url)}" target="_blank" rel="noopener">Ver</a>`
    : et.url ? `Fuente: ${esc(et.fuente)}. <a href="${esc(et.url)}" target="_blank" rel="noopener">Ver</a>` : `Fuente: ${esc(et.fuente || "")}`;
  return `<div class="etimologia"><span class="grupo">${muestraGrupo(g)}${esc(ORIGENES[g].nombre)}</span>
    <p style="margin:.3rem 0">${esc(et.texto)}</p>
    <div class="fuente">${cita}${provisional ? ` <span class="provisional">· provisional</span>` : ""}</div></div>`;
}

/** Resumen histórico: qué grupos de origen aparecen en el concepto y por qué. */
function historia(vista, abierta) {
  const grupos = new Map();
  for (const v of vista.variantes) {
    const g = grupoDe(v);
    if (!grupos.has(g)) grupos.set(g, []);
    grupos.get(g).push(v.forma);
  }
  const orden = Object.keys(ORIGENES).filter((g) => grupos.has(g));
  return `<div class="historia">
    <h3>¿Por qué tantas palabras?</h3>
    ${orden.map((g) => `<details ${abierta ? "open" : ""}><summary>${muestraGrupo(g)} <strong>${esc(ORIGENES[g].nombre)}</strong>: ${grupos.get(g).map((f) => `<em>${esc(f)}</em>`).join(", ")}</summary>
      <p>${esc(ORIGENES[g].contexto)}</p></details>`).join("")}
    <p class="fuente">Para ampliar: ${LECTURAS.map(esc).join(" · ")}</p></div>`;
}

export function fichaConcepto(concepto, vista) {
  const { nombres } = ctx;
  const filas = vista.variantes.map((v) => `
    <li><button class="leyenda-item" data-variante="${esc(v.forma)}" title="${esc(v.etimologia?.texto || "")}">${muestra(v)}<strong>${esc(v.forma)}</strong></button>${marcaEquipo(v)}
      <div class="paises">${lista(v.paises, nombres)}</div>
      ${ctx.vista === "origen" ? `<div class="fuente">${esc(v.etimologia?.texto || "Origen sin documentar.")}</div>` : ""}</li>`).join("");
  const nivel = Math.round(vista.distincion * 100);
  $("panel").innerHTML = `
    <p class="meta">Concepto · ${esc(concepto.campo)}</p>
    <h2>${esc(concepto.concepto)}</h2>
    <p>${esc(concepto.definicion)}</p>
    <p class="fuente">Poder para distinguir países: <strong>${nivel}/100</strong> · <a href="acerca.html#funciona">cómo se calcula</a></p>
    ${ctx.vista === "origen" ? historia(vista, true) : ""}
    <h3>${vista.variantes.length} palabras registradas</h3>
    <ul>${filas || "<li>Sin datos todavía.</li>"}</ul>
    ${vista.generales.length ? `<p class="fuente">Formas generales, sin marca de país: ${vista.generales.map((v) => `<em>${esc(v.forma)}</em>`).join(", ")}.</p>` : ""}
    ${vista.revision.length ? `<p class="aviso"><strong>En revisión</strong> (sólo en listas no académicas): ${vista.revision.map((v) => `${esc(v.forma)} (${lista(v.paises, nombres)})`).join("; ")}.</p>` : ""}
    ${ctx.vista === "origen" ? "" : historia(vista, false)}`;
}

const marcaEquipo = (v) => {
  const n = (v.paises_equipo || []).length;
  return n ? ` <small class="fuente">(${n === v.paises.length ? "registro del equipo" : "en parte, registro del equipo"})</small>` : "";
};

export function fichaVariante(concepto, v) {
  const { nombres } = ctx;
  const cs = citas(v);
  $("panel").innerHTML = `
    <p class="meta">${esc(concepto.concepto)}</p>
    <h2>${muestra(v)} ${esc(v.forma)}</h2>
    <p>Registrada con este sentido en <strong>${lista(v.paises, nombres)}</strong>.</p>
    <h3>De dónde viene</h3>
    ${bloqueEtimologia(v)}
    <p class="fuente">${esc(ORIGENES[grupoDe(v)].contexto)}</p>
    <h3>Fuentes</h3>
    <ol class="citas">${cs.map((c) => `<li>${c}</li>`).join("")}</ol>
    ${v.excluidos?.length ? `<p class="aviso">Se excluyó en ${lista(v.excluidos, nombres)}: allí significa otra cosa. ${esc(concepto.motivos)}</p>` : ""}`;
}

export function fichaPais(iso, vista, concepto, parecidos) {
  const { nombres } = ctx;
  const vs = vista.porPais.get(iso) || [];
  const enRevision = vista.revision.filter((v) => v.paises.includes(iso));
  const cercanos = parecidos(iso).slice(0, 3).filter((p) => p.valor > 0);
  $("panel").innerHTML = `
    <p class="meta">${esc(concepto.concepto)}</p>
    <h2>${esc(nombres[iso])}</h2>
    ${vs.length ? `<ul>${vs.map((v) => `<li><button class="leyenda-item" data-variante="${esc(v.forma)}">${muestra(v)}<strong>${esc(v.forma)}</strong></button>
        <div class="fuente">${esc(v.etimologia?.texto || "Origen sin documentar.")}</div>
        <ol class="citas">${citas(v, iso).map((c) => `<li>${c}</li>`).join("")}</ol></li>`).join("")}</ul>`
      : `<p>No hay ninguna palabra registrada para este país. Probablemente se usa la forma general${vista.generales.length ? ` (<em>${esc(vista.generales[0].forma)}</em>)` : ""}, que los diccionarios no marcan como regional.</p>`}
    ${enRevision.length ? `<p class="aviso">En revisión: ${enRevision.map((v) => esc(v.forma)).join(", ")}.</p>` : ""}
    ${cercanos.length ? `<h3>Vecinos léxicos</h3>
      <p class="fuente">En todos los conceptos del mapa, ${esc(nombres[iso])} comparte más palabras con:</p>
      <ul>${cercanos.map((p) => `<li><strong>${esc(nombres[p.pais])}</strong> <span class="fuente">(${p.comunes.length} en común: ${p.comunes.slice(0, 5).map(esc).join(", ")}${p.comunes.length > 5 ? "…" : ""})</span></li>`).join("")}</ul>
      <p class="fuente">La cercanía geográfica, las rutas comerciales y la historia compartida (virreinatos, migraciones, medios) hacen que los vecinos se parezcan.</p>` : ""}`;
}

export function fichaPalabra(palabra, paises) {
  const { nombres } = ctx;
  $("panel").innerHTML = paises?.length
    ? `<p class="meta">Búsqueda</p><h2>${esc(palabra)}</h2>
       <p>El Wikcionario la marca como propia de: <strong>${lista(paises, nombres)}</strong>.</p>
       <p class="fuente">Atención: puede tener significados distintos en cada país.</p>
       <p class="fuente">Fuente: «${esc(palabra)}», en <em>Wikcionario</em>. Consultado el ${fecha()}. <a href="${urlWikt(palabra)}" target="_blank" rel="noopener">Ver la entrada</a></p>`
    : `<p class="meta">Búsqueda</p><h2>${esc(palabra)}</h2>
       <p>No figura como regionalismo de ningún país en nuestros datos. Puede ser una palabra general o estar sin documentar.</p>`;
}

/** Tabla de datos con una fila por país y palabra, su origen y sus fuentes numeradas. */
export function tablaConcepto(vista, orden) {
  const { nombres } = ctx;
  const filas = orden.flatMap((iso) => {
    const vs = vista.porPais.get(iso) || [];
    const rev = vista.revision.filter((v) => v.paises.includes(iso));
    if (!vs.length) {
      return [`<tr><th scope="row">${esc(nombres[iso])}</th><td>—</td><td></td><td class="ref">${rev.length ? `En revisión: ${rev.map((v) => esc(v.forma)).join(", ")}` : "Sin registro: probablemente la forma general."}</td></tr>`];
    }
    return vs.map((v, i) => `<tr>${i === 0 ? `<th scope="row" rowspan="${vs.length}">${esc(nombres[iso])}</th>` : ""}
      <td><span class="muestra" style="background:${colorTono(v.tono)}"></span><strong>${esc(v.forma)}</strong></td>
      <td>${muestraGrupo(grupoDe(v))}${esc(v.etimologia?.texto || "Sin documentar.")}${v.etimologia?.fuente ? `<span class="ref">${esc(v.etimologia.fuente)}</span>` : ""}</td>
      <td><ol class="citas">${citas(v, iso).map((c) => `<li>${c}</li>`).join("")}</ol></td></tr>`);
  }).join("");
  $("tabla").innerHTML = `<table><thead><tr><th>País</th><th>Palabra</th><th>Origen</th><th>Fuentes</th></tr></thead><tbody>${filas}</tbody></table>`;
}
