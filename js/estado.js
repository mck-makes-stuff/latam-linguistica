// Estado de la aplicación, sincronizado con la URL (#concepto=palomitas&pais=ARG)
// para que cada vista se pueda enlazar y citar.

const oyentes = new Set();
export const estado = { modo: "concepto", concepto: null, pais: null, palabra: null, variante: null };

export function suscribir(fn) { oyentes.add(fn); }

export function actualizar(cambios) {
  Object.assign(estado, cambios);
  escribirURL();
  oyentes.forEach((fn) => fn(estado));
}

function escribirURL() {
  const p = new URLSearchParams();
  if (estado.modo === "palabra" && estado.palabra) p.set("palabra", estado.palabra);
  else if (estado.concepto) p.set("concepto", estado.concepto);
  if (estado.pais) p.set("pais", estado.pais);
  history.replaceState(null, "", "#" + p.toString());
}

export function leerURL() {
  const p = new URLSearchParams(location.hash.slice(1));
  return {
    concepto: p.get("concepto"),
    pais: p.get("pais"),
    palabra: p.get("palabra"),
    modo: p.get("palabra") ? "palabra" : "concepto",
  };
}
