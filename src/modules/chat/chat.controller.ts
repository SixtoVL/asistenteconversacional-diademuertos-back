import type { NextFunction, Request, Response } from 'express';
import { chatRequestSchema } from './chat.schemas.js';
import { procesarChat } from './chat.service.js';
import type { RequestConId } from '../../middlewares/request-logger.js';

export async function postChat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = chatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        type: 'error',
        codigo: 'entrada_invalida',
        mensaje: 'La petición no cumple el formato esperado.',
      });
      return;
    }
    if (parsed.data.ajustes.modo !== 'experto') {
      res.status(400).json({
        type: 'error',
        codigo: 'entrada_invalida',
        mensaje: 'Este endpoint solo admite el modo experto.',
      });
      return;
    }
    // Modo clásico: el sistema experto responde con plantillas.
    const resultado = await procesarChat(parsed.data, (req as RequestConId).requestId);
    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}
