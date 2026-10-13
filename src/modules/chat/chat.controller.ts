import type { NextFunction, Request, Response } from 'express';
import { chatRequestSchema } from './chat.schemas.js';

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
    // TODO (Fase 1): delegar en procesarChat() cuando el sistema experto exista.
    // Por ahora el endpoint existe pero responde "no implementado".
    res.status(501).json({
      type: 'error',
      codigo: 'error_interno',
      mensaje: 'El chat de fase 1 aún no está implementado.',
    });
  } catch (err) {
    next(err);
  }
}
