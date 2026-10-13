import { normalizar } from '../intents/intents.js';
import type { Hecho } from '../knowledge-base/kb.schemas.js';

export interface Caso {
  intencionId: string | null;
  datos: Record<string, string>;
}

export type Conclusion =
  | { tipo: 'texto'; introduccion: string; hechos: Hecho[] }
  | { tipo: 'pregunta_guiada'; texto: string; opciones: Array<{ id: string; etiqueta: string }> }
  | { tipo: 'resultado_se'; titulo: string; detalle: string; hechos: Hecho[] }
  | { tipo: 'error'; codigo: 'consulta_no_reconocida' | 'datos_insuficientes' };

export interface Regla {
  id: string;
  descripcion: string;
  /** Menor número = se evalúa antes. */
  prioridad: number;
  cuando: (caso: Caso, hechos: Hecho[]) => boolean;
  entonces: (caso: Caso, hechos: Hecho[]) => Conclusion;
}

interface HechoPuntuado {
  hecho: Hecho;
  puntaje: number;
}

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Coincidencia por palabra completa, tolerando plural en -s/-es. Evita falsos como "sal" en "sale". */
export function coincideTermino(texto: string, termino: string): boolean {
  const patron = new RegExp(`\\b${escaparRegex(termino)}(s|es)?\\b`);
  return patron.test(texto);
}

function puntuarHecho(hecho: Hecho, terminos: string[]): number {
  const tema = normalizar(hecho.tema);
  const afirmacion = normalizar(hecho.afirmacion);
  const descripcion = normalizar(hecho.descripcion);
  let puntaje = 0;
  for (const termino of terminos) {
    if (coincideTermino(tema, termino)) {
      puntaje += 3;
    }
    if (coincideTermino(afirmacion, termino)) {
      puntaje += 2;
    }
    if (coincideTermino(descripcion, termino)) {
      puntaje += 1;
    }
  }
  return puntaje;
}

export function buscarHechos(
  hechos: Hecho[],
  terminos: string[],
  opciones: { region?: string; limite?: number } = {},
): Hecho[] {
  const { region, limite = 3 } = opciones;
  const candidatos = region ? hechos.filter((hecho) => coincideRegion(hecho.ambito, region)) : hechos;
  const puntuados: HechoPuntuado[] = [];
  for (const hecho of candidatos) {
    const puntaje = puntuarHecho(hecho, terminos);
    if (puntaje > 0) {
      puntuados.push({ hecho, puntaje });
    }
  }
  puntuados.sort((a, b) => b.puntaje - a.puntaje);
  return puntuados.slice(0, limite).map((item) => item.hecho);
}

export function coincideRegion(ambito: string, region: string): boolean {
  const texto = normalizar(ambito);
  switch (region) {
    case 'puebla':
      return texto.includes('puebla');
    case 'campeche':
      return texto.includes('campeche');
    case 'nayarit':
      return texto.includes('nayarit');
    case 'yucatan':
      return texto.includes('yucatan');
    case 'michoacan':
      return texto.includes('michoacan');
    case 'veracruz':
      return texto.includes('veracruz');
    case 'general':
      return texto === 'general' || texto.startsWith('general') || texto.startsWith('mexico');
    default:
      return false;
  }
}

export function evaluar(caso: Caso, hechos: Hecho[], reglas: Regla[]): Conclusion {
  const ordenadas = [...reglas].sort((a, b) => a.prioridad - b.prioridad);
  for (const regla of ordenadas) {
    if (regla.cuando(caso, hechos)) {
      return regla.entonces(caso, hechos);
    }
  }
  return { tipo: 'error', codigo: 'consulta_no_reconocida' };
}
