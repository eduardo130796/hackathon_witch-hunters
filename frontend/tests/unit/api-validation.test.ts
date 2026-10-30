import { describe, expect, it } from 'vitest';
import {
  isApiErrorResponse,
  isRankingResponse,
  isScoreRecord,
} from '../../src/services/api-validation';

// Formato real devolvido por POST /api/scores.
const savedRecord = {
  id: 7,
  nickname: 'Caçadora',
  witchesKilled: 2,
  innocentsKilled: 0,
  damageTaken: 1,
  durationMs: 42_000,
  usedInspector: false,
  score: 2775,
  createdAt: '2026-10-30T18:00:00.000Z',
};

describe('isScoreRecord', () => {
  it('aceita o registro devolvido pela API', () => {
    expect(isScoreRecord(savedRecord)).toBe(true);
  });

  it('recusa registro sem pontuação ou com campo em snake_case', () => {
    const withoutScore: Record<string, unknown> = { ...savedRecord };
    delete withoutScore.score;
    expect(isScoreRecord(withoutScore)).toBe(false);
    const snakeCase: Record<string, unknown> = { ...savedRecord, duration_ms: 42_000 };
    delete snakeCase.durationMs;
    expect(isScoreRecord(snakeCase)).toBe(false);
  });
});

describe('isRankingResponse', () => {
  it('aceita lista vazia e lista de registros', () => {
    expect(isRankingResponse([])).toBe(true);
    expect(isRankingResponse([savedRecord, savedRecord])).toBe(true);
  });

  it('recusa página HTML ou objeto no lugar da lista', () => {
    expect(isRankingResponse('<html>')).toBe(false);
    expect(isRankingResponse({ items: [savedRecord] })).toBe(false);
  });
});

describe('isApiErrorResponse', () => {
  it('reconhece o formato de erro da API', () => {
    expect(isApiErrorResponse({ error: 'O nick é obrigatório.', details: [] })).toBe(true);
    expect(isApiErrorResponse(null)).toBe(false);
  });
});
