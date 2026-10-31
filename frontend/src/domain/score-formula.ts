import { SCORE_RULES } from '../config/score-rules';

const MILLISECONDS_PER_SECOND = 1000;

export interface MatchCounters {
  witchesKilled: number;
  innocentsKilled: number;
  damageTaken: number;
  durationMs: number;
}

// Cada parcela da fórmula separada, para a tela de resultado mostrar de onde veio cada ponto.
// Penalidades são positivas; quem exibe decide o sinal.
export interface ScoreBreakdown {
  witchPoints: number;
  innocentPenalty: number;
  damagePenalty: number;
  elapsedSeconds: number;
  timeBonus: number;
  total: number;
}

/**
 * Decompõe a pontuação estimada em parcelas.
 *
 * Deve ser idêntica a calculateScore em backend/src/services/score.service.ts.
 * O resultado aqui é só feedback visual: a pontuação oficial é sempre a devolvida pelo servidor.
 *
 * Regra: bruxas × 100 − inocentes × 250 − dano × 5 + max(0, 300 − segundos) × 10,
 * com segundos arredondados para baixo e total nunca negativo.
 *
 * @param counters Contadores da partida (bruxas, inocentes, dano e duração em ms).
 * @returns Cada parcela da fórmula e o total, inteiro e não negativo.
 */
export function scoreBreakdown(counters: MatchCounters): ScoreBreakdown {
  const elapsedSeconds = Math.floor(counters.durationMs / MILLISECONDS_PER_SECOND);
  const remainingSeconds = Math.max(0, SCORE_RULES.timeLimitSeconds - elapsedSeconds);
  const witchPoints = counters.witchesKilled * SCORE_RULES.witchPoints;
  const innocentPenalty = counters.innocentsKilled * SCORE_RULES.innocentPenalty;
  const damagePenalty = counters.damageTaken * SCORE_RULES.damagePenalty;
  const timeBonus = remainingSeconds * SCORE_RULES.timeBonusPerSecond;
  const total = Math.max(0, witchPoints - innocentPenalty - damagePenalty + timeBonus);
  return { witchPoints, innocentPenalty, damagePenalty, elapsedSeconds, timeBonus, total };
}

/**
 * Parte da pontuação que só muda quando o jogador age: bruxas menos penalidades, sem o
 * bônus de tempo.
 *
 * Existe para o HUD: somado ao bônus, o número caía sozinho a cada segundo e o jogador lia
 * a passagem do tempo como pontos perdidos. Não altera a fórmula; total continua sendo
 * max(0, actionPoints + timeBonus).
 *
 * @param breakdown Parcelas devolvidas por scoreBreakdown.
 * @returns witchPoints − innocentPenalty − damagePenalty. Pode ser negativo.
 */
export function actionPoints(breakdown: ScoreBreakdown): number {
  return breakdown.witchPoints - breakdown.innocentPenalty - breakdown.damagePenalty;
}
