import app from './app.js';
import { createServer } from 'http';
import { env } from './config/env.js';

const server = createServer(app);

server.listen(env.PORT, () => {
  console.log(`Servidor corriendo en puerto ${env.PORT}`);
});
