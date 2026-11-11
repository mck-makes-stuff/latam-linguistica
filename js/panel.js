// Panel lateral y tabla de datos: fichas de concepto, variante, país y palabra.
import { colorTono } from "./datos.js";

const $ = (id) => document.getElementById(id);
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const muestra = (v) => `<span class="muestra" style="background:${colorTono(v.tono)}"></span>`;
const lista = (isos, nombres) => isos.map((p) => esc(nombres[p] || p)).join(", ");
const urlWikt = (f) => `https://es.wiktionary.org/wiki/${encodeURIComponent(f.replace(/ /g, "_"))}`;

export function fichaConcepto(concepto, vista, nombres) {
  const filas = vista.variantes.map((v) => `
    <li><button class="leyenda-item" data-variante="${esc(v.forma)}">${muestra(v)}<strong>${esc(v.forma)}</strong></button>
      <div class="paises">${lista(v.paises, nombres)}</div></li>`).join("");
  $("panel").innerHTML = `
    <p class="meta">Concepto · ${esc(concepto.campo)}</p>
    <h2>${esc(concepto.concepto)}</h2>
    <p>${esc(concepto.definicion)}</p>
    <h3>${vista.variantes.length} palabras verificadas</h3>
    <ul>${filas || "<li>Sin datos todavía.</li>"}</ul>
    ${vista.generales.length ? `<p class="fuente">Formas generales, sin marca de país: ${vista.generales.map((v) => `<em>${esc(v.forma)}</em>`).join(", ")}.</p>` : ""}
    ${vista.revision.length ? `<p class="aviso"><strong>En revisión</strong> (sólo en listas no académicas): ${vista.revision.map((v) => `${esc(v.forma)} (${lista(v.paises, nombres)})`).join("; ")}.</p>` : ""}
    <p class="fuente">Haz clic en un país o en una palabra para ver la evidencia.</p>`;
}

export function fichaVariante(concepto, v, nombres) {
  const wik = v.evidencia.filter((e) => e.fuente === "Wikcionario");
  const sentido = wik.find((e) => e.sentido)?.sentido;
  const web = [...new Map(v.evidencia.filter((e) => e.fuente !== "Wikcionario").map((e) => [e.url, e])).values()];
  $("panel").innerHTML = `
    <p class="meta">${esc(concepto.concepto)}</p>
    <h2>${muestra(v)} ${esc(v.forma)}</h2>
    <p>Registrada con este sentido en <strong>${lista(v.paises, nombres)}</strong>.</p>
    ${sentido ? `<p class="fuente">Acepción: «${esc(sentido.replace(/<[^>]+>/g, ""))}»</p>` : ""}
    <h3>Fuentes</h3>
    <ul>
      <li><a href="${urlWikt(v.forma)}" target="_blank" rel="noopener">Wikcionario: ${esc(v.forma)}</a></li>
      ${web.map((e) => `<li class="fuente">También en la lista de ${esc(nombres[e.pais] || e.pais)}: <a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.fuente)}</a></li>`).join("")}
    </ul>
    ${v.excluidos?.length ? `<p class="aviso">Se excluyó en ${lista(v.excluidos, nombres)}: allí significa otra cosa. ${esc(concepto.motivos)}</p>` : ""}`;
}

export function fichaPais(iso, nombres, vista, concepto) {
  const vs = vista.porPais.get(iso) || [];
  const enRevision = vista.revision.filter((v) => v.paises.includes(iso));
  $("panel").innerHTML = `
    <p class="meta">${esc(concepto.concepto)}</p>
    <h2>${esc(nombres[iso])}</h2>
    ${vs.length ? `<ul>${vs.map((v) => `<li><button class="leyenda-item" data-variante="${esc(v.forma)}">${muestra(v)}<strong>${esc(v.forma)}</strong></button>
        <div class="fuente"><a href="${urlWikt(v.forma)}" target="_blank" rel="noopener">Ver en el Wikcionario</a></div></li>`).join("")}</ul>`
      : `<p>No hay ninguna palabra verificada para este país. Probablemente se usa la forma general${vista.generales.length ? ` (<em>${esc(vista.generales[0].forma)}</em>)` : ""}, que los diccionarios no marcan como regional.</p>`}
    ${enRevision.length ? `<p class="aviso">En revisión: ${enRevision.map((v) => esc(v.forma)).join(", ")}.</p>` : ""}`;
}

export function fichaPalabra(palabra, paises, nombres) {
  $("panel").innerHTML = paises?.length
    ? `<p class="meta">Búsqueda</p><h2>${esc(palabra)}</h2>
       <p>El Wikcionario la marca como propia de: <strong>${lista(paises, nombres)}</strong>.</p>
       <p class="fuente">Atención: puede tener significados distintos en cada país.</p>
       <p><a href="${urlWikt(palabra)}" target="_blank" rel="noopener">Ver la entrada en el Wikcionario</a></p>`
    : `<p class="meta">Búsqueda</p><h2>${esc(palabra)}</h2>
       <p>No figura como regionalismo de ningún país en nuestros datos. Puede ser una palabra general o estar sin documentar.</p>`;
}

export function tablaConcepto(vista, nombres, orden) {
  const filas = orden.map((iso) => {
    const vs = vista.porPais.get(iso) || [];
    const rev = vista.revision.filter((v) => v.paises.includes(iso));
    return `<tr><th scope="row">${esc(nombres[iso])}</th>
      <td>${vs.map((v) => esc(v.forma)).join(", ") || "—"}</td>
      <td>${rev.map((v) => esc(v.forma)).join(", ")}</td></tr>`;
  }).join("");
  $("tabla").innerHTML = `<table><thead><tr><th>País</th><th>Palabras verificadas</th><th>En revisión</th></tr></thead><tbody>${filas}</tbody></table>`;
}
