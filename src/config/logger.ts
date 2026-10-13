import pino from 'pino';
import { env } from './env.js';

const esTest = process.env['VITEST'] === 'true' || process.env['NODE_ENV'] === 'test';

export const logger = pino({
  level: esTest ? 'silent' : env.LOG_LEVEL,
  transport:
    !esTest && env.LOG_PRETTY
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            singleLine: false,
          },
        }
      : undefined,
});

export function childLogger(requestId: string): pino.Logger {
  return logger.child({ req: requestId });
}
