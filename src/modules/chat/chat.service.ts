import type { ChatRequest } from './chat.schemas.js';
import type { ChatResponse } from '../expert-system/plantillas.js';
import {
  consultar,
  crearTraza,
  detalleTraza,
  narrarTraza,
  resumirTraza,
} from '../expert-system/expert-system.service.js';
import { childLogger } from '../../config/logger.js';

export async function procesarChat(
  request: ChatRequest,
  requestId = 'sin-id',
): Promise<ChatResponse> {
  const log = childLogger(requestId);
  const inicio = Date.now();
  const ultimo = request.mensajes[request.mensajes.length - 1];
  const historial = request.mensajes.slice(0, -1);
  const traza = crearTraza(ultimo.texto);
  const respuesta = consultar(ultimo.texto, historial, traza);
  const ms = Date.now() - inicio;
  log.info(`"${ultimo.texto}" → ${resumirTraza(traza)} (${ms}ms)`);
  log.info(`entra/sale SE\n${narrarTraza(traza).join('\n')}`);
  log.info({ se: detalleTraza(traza) }, 'flujo SE');
  log.info({ respuesta }, 'respuesta al front');
  return respuesta;
}
