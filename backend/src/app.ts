import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import { errorHandler } from './middlewares/error.middleware.js';
import { apiRouter } from './routes/index.js';

const JSON_BODY_LIMIT = '10kb';
// O caminho é relativo a este arquivo, então funciona tanto em src/ (dev) quanto em dist/ (build).
const FRONTEND_DIST_PATH = path.resolve(import.meta.dirname, '../../frontend/dist');

export const app = express();

app.use(helmet());
// Uma partida tem poucos campos; um limite pequeno evita que corpos enormes ocupem memória.
app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use('/api', apiRouter);
// Servir o front-end pelo mesmo servidor evita CORS e permite uma única URL pública.
app.use(express.static(FRONTEND_DIST_PATH));
// Precisa ser o último middleware para receber erros de todas as rotas acima.
app.use(errorHandler);
