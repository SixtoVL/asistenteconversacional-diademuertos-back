import { normalizar } from '../intents/intents.js';
import type { Hecho } from '../knowledge-base/kb.schemas.js';
import type { TrazaConsulta } from '../traza.js';

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
  cuando: (caso: Caso, hechos: Hecho[], traza?: TrazaConsulta) => boolean;
  entonces: (caso: Caso, hechos: Hecho[], traza?: TrazaConsulta) => Conclusion;
}

export interface Evaluacion {
  conclusion: Conclusion;
  reglaId: string | null;
  chequeos: Array<{ regla: string; matched: boolean; ms: number }>;
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
  traza?: TrazaConsulta,
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
  const resultado = puntuados.slice(0, limite).map((item) => item.hecho);
  traza?.pasos.push({
    archivo: 'expert-system/inference-engine/engine.ts',
    fn: 'buscarHechos',
    ms: 0,
    entrada: `términos=[${terminos.join(', ')}] región=${region ?? '—'}`,
    salida: `${resultado.length} candidato(s) [${resultado.map((h) => h.id).join(', ')}]`,
  });
  return resultado;
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

export function evaluar(
  caso: Caso,
  hechos: Hecho[],
  reglas: Regla[],
  traza?: TrazaConsulta,
): Evaluacion {
  const inicioEvaluar = Date.now();
  const ordenadas = [...reglas].sort((a, b) => a.prioridad - b.prioridad);
  const pasoEvaluar = {
    archivo: 'expert-system/inference-engine/engine.ts',
    fn: 'evaluar',
    ms: 0,
    entrada: `${ordenadas.length} reglas por prioridad`,
    salida: 'sin coincidencia',
  };
  traza?.pasos.push(pasoEvaluar);
  const chequeos: Evaluacion['chequeos'] = [];
  for (const regla of ordenadas) {
    const inicio = Date.now();
    const matched = regla.cuando(caso, hechos, traza);
    const chequeo = { regla: regla.id, matched, ms: Date.now() - inicio };
    chequeos.push(chequeo);
    traza?.chequeos.push(chequeo);
    traza?.pasos.push({
      archivo: 'expert-system/rules/rules.ts',
      fn: `${regla.id}.cuando`,
      ms: chequeo.ms,
      entrada: '',
      salida: matched ? '✓' : '✗',
    });
    if (matched) {
      const inicioEntonces = Date.now();
      const conclusion = regla.entonces(caso, hechos, traza);
      const hechosConclusion =
        conclusion.tipo === 'texto' || conclusion.tipo === 'resultado_se'
          ? conclusion.hechos
          : [];
      traza?.pasos.push({
        archivo: 'expert-system/rules/rules.ts',
        fn: `${regla.id}.entonces`,
        ms: Date.now() - inicioEntonces,
        entrada: '',
        salida: `${conclusion.tipo} ${hechosConclusion.length} hecho(s) [${hechosConclusion.map((h) => h.id).join(', ')}]`,
      });
      if (traza) {
        traza.reglaId = regla.id;
      }
      pasoEvaluar.ms = Date.now() - inicioEvaluar;
      pasoEvaluar.salida = regla.id;
      return { conclusion, reglaId: regla.id, chequeos };
    }
  }
  pasoEvaluar.ms = Date.now() - inicioEvaluar;
  return {
    conclusion: { tipo: 'error', codigo: 'consulta_no_reconocida' },
    reglaId: null,
    chequeos,
  };
}
