// Carga de datos y cálculos derivados. Todo es estático (JSON servido por GitHub Pages).

const RUTAS = {
  geo: "data/geo/americas.topo.json",
  conceptos: "data/procesado/conceptos.json",
  lemas: "data/procesado/lemas.json",
  fuentes: "data/fuentes_web.json",
};

export const TONOS = 8; // nº de colores distintos en la leyenda; el resto va a «otras»
export const PAISES = ["MEX", "GTM", "SLV", "HND", "NIC", "CRI", "PAN", "CUB", "DOM", "PRI",
  "VEN", "COL", "ECU", "PER", "BOL", "CHL", "PRY", "ARG", "URY", "ESP"];

async function json(ruta, opcional = false) {
  const r = await fetch(ruta);
  if (!r.ok) {
    if (opcional) return null;
    throw new Error(`No se pudo cargar ${ruta} (${r.status})`);
  }
  return r.json();
}

export async function cargarTodo() {
  const [geo, conceptos, lemas, fuentes] = await Promise.all([
    json(RUTAS.geo), json(RUTAS.conceptos), json(RUTAS.lemas), json(RUTAS.fuentes, true)]);
  return {
    paises: topojson.feature(geo, geo.objects.paises).features,
    conceptos: conceptos.conceptos.filter((c) => c.publicar),
    generado: conceptos.generado,
    lemas: lemas.lemas,
    fuentesWeb: Object.fromEntries((fuentes?.fuentes || []).map((f) => [f.url, f])),
  };
}

/**
 * Vista de un concepto lista para pintar:
 *  - variantes: verificadas en el Wikcionario o catalogadas por el equipo,
 *    ordenadas de más a menos países, con su número de color
 *  - porPais: país -> variantes (la primera es la principal)
 *  - revision: variantes sólo con evidencia secundaria · generales: sin marca de país
 */
export function vistaConcepto(concepto) {
  const variantes = concepto.variantes
    .filter((v) => ["verificado", "equipo"].includes(v.estado) && v.paises.length)
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
    distincion: distincion(porPais),
  };
}

/**
 * Cuánto separa un concepto a los países (0–1): entropía de la partición
 * «país -> su palabra principal» sobre los 20 países, dividida por la máxima posible.
 * Los países sin registro cuentan juntos como «forma general».
 * 1 = cada país dice algo distinto; 0 = todos dicen lo mismo.
 */
function distincion(porPais) {
  const grupos = new Map();
  for (const iso of PAISES) {
    const clave = porPais.get(iso)?.[0]?.forma ?? "—";
    grupos.set(clave, (grupos.get(clave) || 0) + 1);
  }
  let h = 0;
  for (const n of grupos.values()) { const p = n / PAISES.length; h -= p * Math.log2(p); }
  return h / Math.log2(PAISES.length);
}

/** Similitud entre países: proporción de palabras compartidas (Jaccard) en todos los conceptos. */
export function similitudes(vistas) {
  const bolsa = new Map(PAISES.map((p) => [p, new Set()]));
  for (const [id, vista] of vistas) {
    for (const v of vista.variantes) for (const p of v.paises) bolsa.get(p)?.add(`${id}:${v.forma}`);
  }
  return (iso) => PAISES.filter((p) => p !== iso).map((p) => {
    const a = bolsa.get(iso), b = bolsa.get(p);
    const comun = [...a].filter((x) => b.has(x));
    const union = new Set([...a, ...b]).size;
    return { pais: p, valor: union ? comun.length / union : 0, comunes: comun.map((x) => x.split(":")[1]) };
  }).sort((x, y) => y.valor - x.valor);
}

// --- Orígenes ----------------------------------------------------------------
export const ORIGENES = {
  indigena: {
    nombre: "Lenguas indígenas de América",
    contexto: "El español llegó a territorios donde se hablaban el náhuatl, el maya, el quechua, el aimara, el guaraní, el taíno y cientos de lenguas más. Muchas palabras cotidianas (comida, plantas, niños) pasaron al español local, y por eso su mapa coincide con el área de cada lengua: el náhuatl en México y Centroamérica, el quechua en los Andes, el guaraní en Paraguay y el noreste argentino.",
  },
  herencia: {
    nombre: "Herencia latina y peninsular",
    contexto: "Palabras que ya traía el castellano de los siglos XVI a XVIII, incluidos préstamos antiguos del árabe. A veces América conservó un uso que en España cambió (o al revés), y cada región eligió una palabra distinta de entre las que ya existían.",
  },
  formacion: {
    nombre: "Creación dentro del español",
    contexto: "Diminutivos, acortamientos, metáforas y derivados nacidos en cada país (pana → panito, vecino → veci, cerveza «bien fría» → fría). La variación no viene sólo del contacto con otras lenguas: cada comunidad también inventa.",
  },
  italiano: {
    nombre: "Italiano e inmigración",
    contexto: "Entre 1880 y 1930 llegaron millones de inmigrantes italianos al Río de la Plata. Su habla dejó huella en el lunfardo de Buenos Aires y Montevideo (laburo, pibe, birra), y desde allí algunas palabras se extendieron por el continente.",
  },
  ingles: {
    nombre: "Contacto con el inglés",
    contexto: "La presencia de Estados Unidos en el Caribe y Centroamérica (Puerto Rico desde 1898, la Zona del Canal de Panamá en el siglo XX), el comercio, la migración y los medios trajeron préstamos como fren, broki o bonche. Por eso se concentran en el Caribe y en Panamá.",
  },
  europeo: {
    nombre: "Francés, portugués y otras lenguas europeas",
    contexto: "El francés fue la lengua de prestigio cultural en el siglo XIX; el portugués llega por la frontera con Brasil. Algunas palabras viajaron de lengua en lengua antes de llegar al español (coche, del húngaro kocsi).",
  },
  africano: {
    nombre: "Lenguas africanas",
    contexto: "La trata de personas esclavizadas llevó al Caribe y a las costas de Venezuela y Colombia hablantes de yoruba, kikongo, kimbundu y otras lenguas, que dejaron palabras en el español de esas regiones.",
  },
  incierto: {
    nombre: "Origen incierto o discutido",
    contexto: "Los diccionarios no se ponen de acuerdo o falta documentación. Mucha jerga juvenil y popular cae aquí: circula oralmente durante décadas antes de que alguien la escriba.",
  },
};
export const LECTURAS = [
  "Lipski, John M. (1994). Latin American Spanish. Londres: Longman.",
  "Moreno de Alba, José G. (1988). El español en América. México: Fondo de Cultura Económica.",
  "Asociación de Academias de la Lengua Española (2010). Diccionario de americanismos. Madrid: Santillana.",
  "Conde, Oscar (1998). Diccionario etimológico del lunfardo. Buenos Aires: Libros Perfil.",
];
export const colorOrigen = (grupo) => `var(--or-${grupo || "incierto"})`;
export const grupoDe = (v) => v.etimologia?.grupo || "incierto";

export const colorTono = (tono) => `var(--var-${tono ?? "otras"})`;

// Normaliza para buscar sin tildes ni mayúsculas
export const normalizar = (s) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
