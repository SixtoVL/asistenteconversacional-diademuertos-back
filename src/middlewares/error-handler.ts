import type { NextFunction, Request, Response } from 'express';
import { childLogger } from '../config/logger.js';
import type { RequestConId } from './request-logger.js';

export interface ApiErrorBody {
  type: 'error';
  codigo: string;
  mensaje: string;
}

export function notFoundHandler(_req: Request, res: Response): void {
  // Las rutas desconocidas reutilizan el envelope de error con el código
  // genérico; el estado HTTP 404 es lo que las distingue.
  res.status(404).json({
    type: 'error',
    codigo: 'error_interno',
    mensaje: 'Recurso no encontrado.',
  } satisfies ApiErrorBody);
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  childLogger((req as RequestConId).requestId ?? 'sin-id').error({ err }, 'Error no manejado');
  res.status(500).json({
    type: 'error',
    codigo: 'error_interno',
    mensaje: 'Ocurrió un error inesperado.',
  } satisfies ApiErrorBody);
}
