import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pool } from '../config/database.js';

// O mesmo arquivo usado para criar o banco local. O caminho é relativo a este módulo, então
// funciona tanto em src/ (dev) quanto em dist/ (build), como o caminho do front-end em app.ts.
const SCHEMA_PATH = path.resolve(import.meta.dirname, '../../../database/schema.sql');

// Aplica o esquema na inicialização. Em produção o banco nasce vazio e não há como rodar o
// psql à mão; como o schema.sql só usa IF NOT EXISTS, reaplicar a cada início não apaga dados.
export async function ensureSchema(): Promise<void> {
  const sql = await readFile(SCHEMA_PATH, 'utf8');
  await pool.query(sql);
}
