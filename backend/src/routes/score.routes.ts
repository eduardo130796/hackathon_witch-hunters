import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { createScore, getRanking } from '../controllers/score.controller.js';

const SUBMIT_WINDOW_MS = 60_000;
const SUBMIT_MAX_REQUESTS_PER_WINDOW = 10;

// Limite por IP só no envio de partidas: impede encher o ranking com spam,
// sem atrapalhar quem apenas consulta o ranking.
const submitScoreLimiter = rateLimit({
  windowMs: SUBMIT_WINDOW_MS,
  limit: SUBMIT_MAX_REQUESTS_PER_WINDOW,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitas partidas enviadas. Aguarde um minuto e tente novamente.' },
});

export const scoreRouter = Router();

scoreRouter.post('/scores', submitScoreLimiter, createScore);
scoreRouter.get('/ranking', getRanking);
