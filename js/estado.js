// Estado de la aplicación, sincronizado con la URL
// (#concepto=palomitas&variante=pochoclo&pais=ARG&vista=origen  o  #palabra=chévere)
// para que cada vista se pueda enlazar y citar.

const oyentes = new Set();
export const estado = { modo: "concepto", vista: "palabras", concepto: null, variante: null, pais: null, palabra: null };

export function suscribir(fn) { oyentes.add(fn); }

export function actualizar(cambios, { sinURL = false } = {}) {
  Object.assign(estado, cambios);
  if (!sinURL) escribirURL();
  oyentes.forEach((fn) => fn(estado));
}

function escribirURL() {
  const p = new URLSearchParams();
  if (estado.modo === "palabra" && estado.palabra) p.set("palabra", estado.palabra);
  else {
    if (estado.concepto) p.set("concepto", estado.concepto);
    if (estado.variante) p.set("variante", estado.variante);
  }
  if (estado.pais) p.set("pais", estado.pais);
  if (estado.vista === "origen") p.set("vista", "origen");
  history.replaceState(null, "", "#" + p.toString());
}

export function leerURL() {
  const p = new URLSearchParams(location.hash.slice(1));
  return {
    concepto: p.get("concepto"),
    variante: p.get("variante"),
    pais: p.get("pais"),
    palabra: p.get("palabra"),
    vista: p.get("vista") === "origen" ? "origen" : "palabras",
    modo: p.get("palabra") ? "palabra" : "concepto",
  };
}
