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

function puntuarHecho(hecho: Hecho, terminos: string[]): number {
  const tema = normalizar(hecho.tema);
  const afirmacion = normalizar(hecho.afirmacion);
  const descripcion = normalizar(hecho.descripcion);
  let puntaje = 0;
  for (const termino of terminos) {
    if (tema.includes(termino)) {
      puntaje += 3;
    }
    if (afirmacion.includes(termino)) {
      puntaje += 2;
    }
    if (descripcion.includes(termino)) {
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
