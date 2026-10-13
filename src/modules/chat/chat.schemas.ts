import { z } from 'zod';
import { env } from '../../config/env.js';

export const rolSchema = z.enum(['usuario', 'asistente']);

export const mensajeHistorialSchema = z.object({
  rol: rolSchema,
  texto: z.string().trim().min(1).max(2000),
});

export const ajustesSchema = z.object({
  modo: z.enum(['experto', 'llm']),
  proveedor: z.string().min(1),
  modelo: z.string().min(1),
});

export const chatRequestSchema = z.object({
  mensajes: z.array(mensajeHistorialSchema).min(1).max(env.CHAT_MAX_HISTORY),
  ajustes: ajustesSchema,
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
