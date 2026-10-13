import { evaluar } from './inference-engine/engine.js';
import { interpretar } from './intents/intents.js';
import type { BaseConocimientos } from './knowledge-base/knowledge-base.js';
import { renderConclusion } from './plantillas.js';
import type { ChatResponse } from './plantillas.js';
import { REGLAS } from './rules/rules.js';

let base: BaseConocimientos | null = null;

export function inicializarSistemaExperto(conocimientos: BaseConocimientos): void {
  base = conocimientos;
}

export function consultar(texto: string): ChatResponse {
  if (!base) {
    throw new Error('El sistema experto no fue inicializado.');
  }
  const interpretacion = interpretar(texto);
  const conclusion = evaluar(
    { intencionId: interpretacion.intencionId, datos: interpretacion.datos },
    base.hechos,
    REGLAS,
  );
  return renderConclusion(conclusion, base.fuentes);
}
