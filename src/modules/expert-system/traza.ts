import type { Hecho } from './knowledge-base/kb.schemas.js';

export interface MensajeHistorial {
  rol: string;
  texto: string;
}

export interface ChequeoRegla {
  regla: string;
  matched: boolean;
  ms: number;
}

export interface PasoTraza {
  archivo: string;
  fn: string;
  ms: number;
  entrada: string;
  salida: string;
}

export interface TrazaConsulta {
  pregunta: string;
  intencionId: string | null;
  datos: Record<string, string>;
  /** Id de la pregunta guiada que el usuario está respondiendo, si aplica. */
  resolucionGuiada: string | null;
  pasos: PasoTraza[];
  chequeos: ChequeoRegla[];
  reglaId: string | null;
  hechos: Hecho[];
  respuestaTipo: string | null;
}

export function crearTraza(pregunta: string): TrazaConsulta {
  return {
    pregunta,
    intencionId: null,
    datos: {},
    resolucionGuiada: null,
    pasos: [],
    chequeos: [],
    reglaId: null,
    hechos: [],
    respuestaTipo: null,
  };
}

/**
 * Ejecuta una etapa registrando su entra/sale en la traza.
 * Devuelve el valor intacto; `resumirSalida` describe el retorno en una línea.
 */
export function trazar<T>(
  traza: TrazaConsulta | undefined,
  archivo: string,
  fn: string,
  entrada: string,
  ejecutar: () => T,
  resumirSalida: (resultado: T) => string,
): T {
  const inicio = Date.now();
  const resultado = ejecutar();
  traza?.pasos.push({
    archivo,
    fn,
    ms: Date.now() - inicio,
    entrada,
    salida: resumirSalida(resultado),
  });
  return resultado;
}
