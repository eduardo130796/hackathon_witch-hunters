import pg from 'pg';
import { env } from './env.js';

// Um único pool para a aplicação inteira: as conexões são reaproveitadas entre requisições,
// em vez de abrir (e pagar o custo de) uma conexão nova a cada consulta.
export const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
