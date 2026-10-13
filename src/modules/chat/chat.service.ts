import type { ChatRequest } from './chat.schemas.js';

export interface ResultadoChat {
  type: 'error';
  codigo: 'error_interno';
  mensaje: string;
}

// TODO (Fase 1): interpretar la consulta con el sistema experto y responder
// con plantillas. Este servicio se conectará en el siguiente incremento.
export async function procesarChat(_request: ChatRequest): Promise<ResultadoChat> {
  return {
    type: 'error',
    codigo: 'error_interno',
    mensaje: 'El chat de fase 1 aún no está implementado.',
  };
}
