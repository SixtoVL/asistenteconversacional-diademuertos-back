import type { ChatRequest } from './chat.schemas.js';
import type { ChatResponse } from '../expert-system/plantillas.js';
import { consultar } from '../expert-system/expert-system.service.js';

export async function procesarChat(request: ChatRequest): Promise<ChatResponse> {
  const ultimo = request.mensajes[request.mensajes.length - 1];
  const historial = request.mensajes.slice(0, -1);
  return consultar(ultimo.texto, historial);
}
