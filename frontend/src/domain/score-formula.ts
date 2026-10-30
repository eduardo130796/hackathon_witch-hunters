import { SCORE_RULES } from '../config/score-rules';

const MILLISECONDS_PER_SECOND = 1000;

export interface MatchCounters {
  witchesKilled: number;
  innocentsKilled: number;
  damageTaken: number;
  durationMs: number;
}

/**
 * Estima a pontuação para exibir durante a partida.
 *
 * Deve ser idêntica a calculateScore em backend/src/services/score.service.ts.
 * O resultado aqui é só feedback visual: a pontuação oficial é sempre a devolvida pelo servidor.
 *
 * Regra: bruxas × 100 − inocentes × 250 − dano × 5 + max(0, 300 − segundos) × 10,
 * com segundos arredondados para baixo e resultado final nunca negativo.
 *
 * @param counters Contadores da partida (bruxas, inocentes, dano e duração em ms).
 * @returns Pontuação estimada, inteira e não negativa.
 */
export function estimateScore(counters: MatchCounters): number {
  const elapsedSeconds = Math.floor(counters.durationMs / MILLISECONDS_PER_SECOND);
  const remainingSeconds = Math.max(0, SCORE_RULES.timeLimitSeconds - elapsedSeconds);
  const timeBonus = remainingSeconds * SCORE_RULES.timeBonusPerSecond;

  const points =
    counters.witchesKilled * SCORE_RULES.witchPoints -
    counters.innocentsKilled * SCORE_RULES.innocentPenalty -
    counters.damageTaken * SCORE_RULES.damagePenalty +
    timeBonus;

  return Math.max(0, points);
}
