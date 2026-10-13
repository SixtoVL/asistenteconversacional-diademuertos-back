import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { chatRoutes } from './modules/chat/chat.routes.js';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { requestLogger } from './middlewares/request-logger.js';

const app = express();

app.use(cors({ origin: env.FRONTEND_ORIGIN }));
app.use(express.json({ limit: env.BODY_LIMIT }));

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/chat', requestLogger);
app.use('/api/chat', chatRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
