import type { NextFunction, Request, Response } from 'express';
import * as scoreService from '../services/score.service.js';
import { rankingQuerySchema, submitScoreSchema } from '../validators/score.validator.js';

// Express 4 não captura rejeições de funções async; por isso cada controller repassa
// o erro para next(), e o error.middleware decide o status e a mensagem.

export async function createScore(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const submission = submitScoreSchema.parse(req.body);
    const savedScore = await scoreService.submitScore(submission);
    res.status(201).json(savedScore);
  } catch (error) {
    next(error);
  }
}

export async function getRanking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { limit } = rankingQuerySchema.parse(req.query);
    const ranking = await scoreService.getRanking(limit);
    res.json(ranking);
  } catch (error) {
    next(error);
  }
}
