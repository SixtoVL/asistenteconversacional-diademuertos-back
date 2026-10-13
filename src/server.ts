import app from './app.js';
import { createServer } from 'http';
import { env } from './config/env.js';
import { loadKnowledgeBase } from './modules/expert-system/knowledge-base/knowledge-base.js';
import { inicializarSistemaExperto } from './modules/expert-system/expert-system.service.js';

// Fail fast: sin base válida no arranca (trazabilidad garantizada).
const kb = loadKnowledgeBase();
inicializarSistemaExperto(kb);
console.log(
  `Base de conocimientos: ${kb.hechos.length} hechos verificados de ${kb.fuentes.length} fuentes.`,
);

const server = createServer(app);

server.listen(env.PORT, () => {
  console.log(`Servidor corriendo en puerto ${env.PORT}`);
});
