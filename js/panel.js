// Panel lateral: ficha del concepto, del país o de la palabra buscada.

const panel = () => document.getElementById("panel");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function fichaConcepto(concepto, nombres) {
  const filas = concepto.variantes
    .filter((v) => v.paises.length)
    .sort((a, b) => b.paises.length - a.paises.length)
    .map((v) => `<li><strong>${esc(v.forma)}</strong> — ${v.paises.map((p) => esc(nombres[p])).join(", ")}
      ${v.estado !== "verificado" ? '<span class="chip">en revisión</span>' : ""}</li>`)
    .join("");
  const formas = (estado) => concepto.variantes.filter((v) => !v.paises.length && v.estado === estado).map((v) => esc(v.forma));
  const generales = [...formas("general"), ...formas("americano")];
  const sinDato = formas("sin_datos");
  panel().innerHTML = `
    <p class="meta">Concepto · ${esc(concepto.campo)}</p>
    <h2>${esc(concepto.concepto)}</h2>
    <p>${esc(concepto.definicion)}</p>
    <h3>Variantes registradas</h3>
    <ul>${filas || "<li>Sin datos todavía.</li>"}</ul>
    ${generales.length ? `<p class="meta">Formas generales, sin marca de país: ${generales.join(", ")}.</p>` : ""}
    ${sinDato.length ? `<p class="aviso">Candidatas aún sin evidencia: ${sinDato.join(", ")}.</p>` : ""}`;
}

export function fichaPais(iso, nombre, variantes, concepto) {
  const lista = (variantes || []).map((v) => `<span class="chip">${esc(v.forma)}</span>`).join("") || "<em>Sin variante registrada.</em>";
  panel().innerHTML = `
    <p class="meta">${esc(concepto.concepto)}</p>
    <h2>${esc(nombre)}</h2>
    <p>${lista}</p>
    ${(variantes || []).flatMap((v) => v.evidencia.filter((e) => e.pais === iso))
      .map((e) => `<p class="meta">«${esc(e.forma)}»: <a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.fuente)}</a>${e.sentido ? ` — ${esc(e.sentido)}` : ""}</p>`).join("")}`;
}

export function fichaPalabra(palabra, paises, nombres) {
  panel().innerHTML = paises?.length
    ? `<p class="meta">Palabra</p><h2>${esc(palabra)}</h2>
       <p>Marcada en el Wikcionario como propia de: ${paises.map((p) => esc(nombres[p] || p)).join(", ")}.</p>
       <p class="meta"><a href="https://es.wiktionary.org/wiki/${encodeURIComponent(palabra)}" target="_blank" rel="noopener">Ver la entrada en el Wikcionario</a></p>`
    : `<h2>${esc(palabra)}</h2><p>No figura como regionalismo de ningún país latinoamericano en los datos.</p>`;
}
