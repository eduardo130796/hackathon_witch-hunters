import { app } from './app.js';
import { pool } from './config/database.js';
import { env } from './config/env.js';
import { ensureSchema } from './models/schema.model.js';

// A tabela precisa existir antes da primeira requisição; se o banco estiver inacessível, o
// processo falha aqui, logo na subida, em vez de responder erro a cada partida salva.
await ensureSchema();

const server = app.listen(env.PORT, () => {
  console.info(`Servidor ouvindo em http://localhost:${env.PORT}`);
});

// Encerramento gracioso: termina as requisições em andamento e só então fecha o pool,
// para não cortar uma gravação no meio nem deixar conexões abertas no PostgreSQL.
function shutdown(): void {
  server.close(() => {
    void pool.end().finally(() => process.exit(0));
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
