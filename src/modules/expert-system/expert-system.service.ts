import { evaluar } from './inference-engine/engine.js';
import type { Caso } from './inference-engine/engine.js';
import { interpretar } from './intents/intents.js';
import type { BaseConocimientos } from './knowledge-base/knowledge-base.js';
import { renderConclusion } from './plantillas.js';
import type { ChatResponse } from './plantillas.js';
import { resolverRespuestaGuiada } from './dialogo.js';
import { REGLAS } from './rules/rules.js';

let base: BaseConocimientos | null = null;

export function inicializarSistemaExperto(conocimientos: BaseConocimientos): void {
  base = conocimientos;
}

export interface MensajeHistorial {
  rol: string;
  texto: string;
}

export function consultar(texto: string, historial: MensajeHistorial[] = []): ChatResponse {
  if (!base) {
    throw new Error('El sistema experto no fue inicializado.');
  }
  const interpretacion = interpretar(texto);
  let caso: Caso = { intencionId: interpretacion.intencionId, datos: interpretacion.datos };
  if (caso.intencionId === null) {
    const ultimoAsistente = [...historial].reverse().find((item) => item.rol === 'asistente');
    const resuelto = ultimoAsistente
      ? resolverRespuestaGuiada(ultimoAsistente.texto, texto)
      : null;
    if (resuelto) {
      caso = resuelto;
    }
  }
  const conclusion = evaluar(caso, base.hechos, REGLAS);
  return renderConclusion(conclusion, base.fuentes);
}
