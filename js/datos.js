// Carga de datos y cálculos derivados. Todo es estático (JSON servido por GitHub Pages).

const RUTAS = {
  geo: "data/geo/americas.topo.json",
  conceptos: "data/procesado/conceptos.json",
  lemas: "data/procesado/lemas.json",
};

export const TONOS = 5; // nº de tonos distintos en la leyenda; el resto va a «otras»

async function json(ruta) {
  const r = await fetch(ruta);
  if (!r.ok) throw new Error(`No se pudo cargar ${ruta} (${r.status})`);
  return r.json();
}

export async function cargarTodo() {
  const [geo, conceptos, lemas] = await Promise.all([json(RUTAS.geo), json(RUTAS.conceptos), json(RUTAS.lemas)]);
  return {
    paises: topojson.feature(geo, geo.objects.paises).features,
    conceptos: conceptos.conceptos.filter((c) => c.publicar),
    lemas: lemas.lemas,
  };
}

/**
 * Vista de un concepto lista para pintar:
 *  - variantes: verificadas, ordenadas de más a menos países, con su número de tono
 *  - porPais: país -> variantes verificadas (la primera es la principal)
 *  - revision: variantes sólo con evidencia secundaria · generales: sin marca de país
 */
export function vistaConcepto(concepto) {
  const variantes = concepto.variantes
    .filter((v) => v.estado === "verificado" && v.paises.length)
    .map((v, i) => ({ ...v, orden: i }))
    .sort((a, b) => b.paises.length - a.paises.length || a.orden - b.orden)
    .map((v, i) => ({ ...v, tono: i < TONOS ? i + 1 : null }));

  const porPais = new Map();
  for (const v of variantes) {
    for (const iso of v.paises) {
      if (!porPais.has(iso)) porPais.set(iso, []);
      porPais.get(iso).push(v);
    }
  }
  return {
    variantes,
    porPais,
    revision: concepto.variantes.filter((v) => v.estado === "parcial"),
    generales: concepto.variantes.filter((v) => ["general", "americano"].includes(v.estado) && !v.paises.length),
  };
}

export const colorTono = (tono) => `var(--var-${tono ?? "otras"})`;

// Normaliza para buscar sin tildes ni mayúsculas
export const normalizar = (s) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
