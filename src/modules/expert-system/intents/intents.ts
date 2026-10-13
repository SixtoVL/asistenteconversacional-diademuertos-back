export interface Intencion {
  id: string;
  /** Palabras clave en minúsculas y sin acentos. */
  palabrasClave: string[];
  /** Términos para buscar hechos en la base (minúsculas, sin acentos). */
  terminosBusqueda: string[];
  /** Menor número = mayor prioridad en desempates. */
  prioridad: number;
}

export interface RegionMatch {
  id: 'general' | 'puebla' | 'campeche' | 'nayarit';
  etiqueta: string;
  palabrasClave: string[];
}

export interface Interpretacion {
  intencionId: string | null;
  datos: Record<string, string>;
}

export const INTENCIONES: Intencion[] = [
  {
    id: 'saludo',
    palabrasClave: ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'hey', 'saludos'],
    terminosBusqueda: [],
    prioridad: 10,
  },
  {
    id: 'ayuda',
    palabrasClave: ['ayuda', 'puedes hacer', 'que puedes', 'que sabes', 'como funciona', 'opciones', 'menu', 'para que sirves'],
    terminosBusqueda: [],
    prioridad: 20,
  },
  {
    id: 'recomendar',
    palabrasClave: ['recomienda', 'recomendacion', 'recomiendame', 'preparar', 'preparo', 'preparacion', 'como hago', 'como armo', 'armar', 'guia', 'quiero hacer', 'voy a hacer', 'ayudame con mi ofrenda'],
    terminosBusqueda: ['ofrenda'],
    prioridad: 30,
  },
  {
    id: 'significado_elemento',
    palabrasClave: ['significa', 'significado', 'que es', 'cempasuchil', 'flor', 'flores', 'pan', 'panes', 'vela', 'veladora', 'velas', 'veladoras', 'incienso', 'copal', 'foto', 'fotografia', 'fotos', 'retrato', 'altar', 'ofrenda', 'elemento', 'elementos', 'papel picado', 'calavera', 'calaveras', 'calaverita', 'cruz', 'cruces', 'agua', 'sal', 'mole', 'atole', 'atoles', 'fruta', 'frutas', 'itacate', 'itacates', 'petate', 'petates'],
    terminosBusqueda: [],
    prioridad: 40,
  },
  {
    id: 'fechas',
    palabrasClave: ['fecha', 'fechas', 'cuando', 'cuando se celebra', 'noviembre', 'octubre', 'dias', 'primero', 'dos', 'calendario', 'que dia'],
    terminosBusqueda: ['noviembre', 'octubre', 'dias', 'fecha'],
    prioridad: 50,
  },
  {
    id: 'historia',
    palabrasClave: ['historia', 'origen', 'unesco', 'patrimonio', 'humanidad', 'pasado', 'prehispanico', 'colonial', 'miccailhuitontli', 'todos los santos'],
    terminosBusqueda: ['historia', 'origen', 'unesco', 'patrimonio'],
    prioridad: 60,
  },
  {
    id: 'tradicion',
    palabrasClave: ['muerte', 'muertos', 'difunto', 'difuntos', 'tradicion', 'tradiciones', 'cora', 'coras', 'canasta', 'canastas', 'huesos', 'pomuch', 'hanal', 'pixan', 'ritual', 'costumbre', 'panteon', 'angelitos', 'tecolote', 'inframundo', 'animas', 'alma', 'velacion'],
    terminosBusqueda: ['tradicion', 'ritual', 'costumbre'],
    prioridad: 70,
  },
];

export const REGIONES: RegionMatch[] = [
  { id: 'general', etiqueta: 'General', palabrasClave: ['general'] },
  {
    id: 'puebla',
    etiqueta: 'Puebla',
    palabrasClave: ['puebla', 'texmelucan', 'canoa', 'xayacatlan', 'izucar', 'huaquechula', 'atlixco', 'cholula'],
  },
  {
    id: 'campeche',
    etiqueta: 'Campeche',
    palabrasClave: ['campeche', 'pomuch', 'maya', 'hanal', 'pixan', 'janal'],
  },
  {
    id: 'nayarit',
    etiqueta: 'Nayarit',
    palabrasClave: ['nayarit', 'cora', 'coras'],
  },
];

/** Elementos de ofrenda reconocibles. `palabrasClave` detecta la mención; `terminos` busca en la base. */
export const ELEMENTOS: Array<{ id: string; palabrasClave: string[]; terminos: string[] }> = [
  { id: 'cempasuchil', palabrasClave: ['cempasuchil', 'flor de muerto', 'flor'], terminos: ['cempasuchil', 'flor de muerto'] },
  { id: 'pan', palabrasClave: ['pan', 'panes'], terminos: ['pan'] },
  { id: 'vela', palabrasClave: ['vela', 'veladora', 'velas', 'veladoras', 'cirio', 'luz'], terminos: ['vela', 'veladora', 'cirio'] },
  { id: 'incienso', palabrasClave: ['incienso', 'copal', 'sahumerio'], terminos: ['incienso', 'copal', 'sahumerio'] },
  { id: 'fotografia', palabrasClave: ['foto', 'fotografia', 'fotos', 'retrato'], terminos: ['fotografia', 'foto', 'retrato'] },
  { id: 'sal', palabrasClave: ['sal'], terminos: ['sal'] },
  { id: 'agua', palabrasClave: ['agua'], terminos: ['agua'] },
  { id: 'papel picado', palabrasClave: ['papel picado'], terminos: ['papel picado'] },
  { id: 'calavera', palabrasClave: ['calavera', 'calaveras', 'calaverita'], terminos: ['calavera', 'calaverita'] },
  { id: 'cruz', palabrasClave: ['cruz', 'cruces'], terminos: ['cruz'] },
  { id: 'mole', palabrasClave: ['mole', 'pipian'], terminos: ['mole', 'pipian'] },
  { id: 'atole', palabrasClave: ['atole', 'atoles'], terminos: ['atole'] },
  { id: 'fruta', palabrasClave: ['fruta', 'frutas'], terminos: ['fruta'] },
  { id: 'petate', palabrasClave: ['petate', 'petates'], terminos: ['petate'] },
  { id: 'itacate', palabrasClave: ['itacate', 'itacates'], terminos: ['itacate'] },
];

export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function contarCoincidencias(texto: string, palabrasClave: string[]): number {
  let hits = 0;
  for (const clave of palabrasClave) {
    const patron = new RegExp(`\\b${escaparRegex(clave)}\\b`);
    if (patron.test(texto)) {
      hits += 1;
    }
  }
  return hits;
}

export function interpretar(texto: string): Interpretacion {
  const consulta = normalizar(texto);
  let mejor: Intencion | null = null;
  let mejorPuntaje = 0;
  for (const intencion of INTENCIONES) {
    const puntaje = contarCoincidencias(consulta, intencion.palabrasClave);
    if (
      puntaje > mejorPuntaje ||
      (puntaje === mejorPuntaje && puntaje > 0 && mejor && intencion.prioridad < mejor.prioridad)
    ) {
      mejor = intencion;
      mejorPuntaje = puntaje;
    }
  }

  let mejorRegion: RegionMatch | null = null;
  let mejorPuntajeRegion = 0;
  for (const region of REGIONES) {
    const puntaje = contarCoincidencias(consulta, region.palabrasClave);
    if (puntaje > mejorPuntajeRegion) {
      mejorRegion = region;
      mejorPuntajeRegion = puntaje;
    }
  }

  let elemento: string | null = null;
  if (mejor?.id === 'significado_elemento') {
    for (const candidato of ELEMENTOS) {
      if (contarCoincidencias(consulta, candidato.palabrasClave) > 0) {
        elemento = candidato.id;
        break;
      }
    }
  }

  const datos: Record<string, string> = {};
  if (mejorRegion) {
    datos['region'] = mejorRegion.id;
  }
  if (elemento) {
    datos['elemento'] = elemento;
  }
  return { intencionId: mejor?.id ?? null, datos };
}

export function buscarIntencion(id: string | null): Intencion | null {
  if (!id) {
    return null;
  }
  return INTENCIONES.find((intencion) => intencion.id === id) ?? null;
}
