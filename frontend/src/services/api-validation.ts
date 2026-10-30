import type { ApiErrorResponse, RankingResponse, ScoreRecord } from '../types/api';

// O JSON chega como unknown. Conferir a forma antes de usar evita que uma resposta inesperada
// (proxy com página de erro, versão antiga da API) vire "undefined" desenhado na tela.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasNumbers(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return keys.every((key) => typeof value[key] === 'number');
}

const SCORE_RECORD_NUMBER_FIELDS = [
  'id',
  'score',
  'witchesKilled',
  'innocentsKilled',
  'damageTaken',
  'durationMs',
] as const;

export function isScoreRecord(value: unknown): value is ScoreRecord {
  return (
    isRecord(value) &&
    hasNumbers(value, SCORE_RECORD_NUMBER_FIELDS) &&
    typeof value.nickname === 'string' &&
    typeof value.usedInspector === 'boolean' &&
    typeof value.createdAt === 'string'
  );
}

export function isRankingResponse(value: unknown): value is RankingResponse {
  return Array.isArray(value) && value.every(isScoreRecord);
}

export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return isRecord(value) && typeof value.error === 'string';
}
