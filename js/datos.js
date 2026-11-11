// Carga de datos. Todo es estático (JSON servido por GitHub Pages).

const RUTAS = {
  geo: "data/geo/americas.topo.json",
  conceptos: "data/procesado/conceptos.json",
  lemas: "data/procesado/lemas.json",
};

async function json(ruta) {
  const r = await fetch(ruta);
  if (!r.ok) throw new Error(`No se pudo cargar ${ruta} (${r.status})`);
  return r.json();
}

export async function cargarTodo() {
  const [geo, conceptos, lemas] = await Promise.all([
    json(RUTAS.geo), json(RUTAS.conceptos), json(RUTAS.lemas),
  ]);
  const paises = topojson.feature(geo, geo.objects.paises).features;
  return { paises, conceptos, lemas };
}

// Índice: país -> [variantes] para un concepto
export function variantesPorPais(concepto) {
  const mapa = new Map();
  for (const v of concepto.variantes) {
    for (const iso of v.paises) {
      if (!mapa.has(iso)) mapa.set(iso, []);
      mapa.get(iso).push(v);
    }
  }
  return mapa;
}

// Normaliza para buscar sin tildes ni mayúsculas
export const normalizar = (s) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
