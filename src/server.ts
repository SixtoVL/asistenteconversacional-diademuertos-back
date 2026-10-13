import app from './app.js';
import { createServer } from 'http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { loadKnowledgeBase } from './modules/expert-system/knowledge-base/knowledge-base.js';
import { inicializarSistemaExperto } from './modules/expert-system/expert-system.service.js';

// Fail fast: sin base válida no arranca (trazabilidad garantizada).
logger.info('→ expert-system/knowledge-base/knowledge-base.ts::loadKnowledgeBase()');
const inicioKb = Date.now();
const kb = loadKnowledgeBase();
inicializarSistemaExperto(kb);
logger.info(
  `← loadKnowledgeBase => ${kb.hechos.length} hechos verificados de ${kb.fuentes.length} fuentes (${Date.now() - inicioKb}ms)`,
);

const server = createServer(app);

server.listen(env.PORT, () => {
  logger.info(`Servidor corriendo en puerto ${env.PORT}`);
});
