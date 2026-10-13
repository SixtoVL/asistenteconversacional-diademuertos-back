import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { childLogger } from '../config/logger.js';

export interface RequestConId extends Request {
  requestId?: string;
}

export function requestLogger(req: RequestConId, _res: Response, next: NextFunction): void {
  const requestId = randomUUID().slice(0, 8);
  req.requestId = requestId;
  const log = childLogger(requestId);
  const inicio = Date.now();
  log.info({ body: req.body }, `POST ${req.path} body recibido`);
  _res.on('finish', () => {
    log.info(
      { status: _res.statusCode, ms: Date.now() - inicio },
      `→ ${_res.statusCode} (${Date.now() - inicio}ms)`,
    );
  });
  next();
}
