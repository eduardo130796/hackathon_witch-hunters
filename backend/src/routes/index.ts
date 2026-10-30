import { Router } from 'express';
import { scoreRouter } from './score.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

apiRouter.use(scoreRouter);
