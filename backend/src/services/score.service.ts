import { GAME_RULES } from '../config/game-rules.js';
import { findTopScores, insertScore, type ScoreRecord } from '../models/score.model.js';

const MILLISECONDS_PER_SECOND = 1000;

export interface ScoreCounters {
  witchesKilled: number;
  innocentsKilled: number;
  damageTaken: number;
  durationMs: number;
}

export interface ScoreSubmission extends ScoreCounters {
  nickname: string;
  usedInspector: boolean;
}

/**
 * Calcula a pontuação de uma partida a partir dos contadores enviados pelo cliente.
 *
 * Regra: bruxas × 100 − inocentes × 250 − dano × 5 + max(0, 300 − segundos) × 10.
 * Os segundos são arredondados para baixo, e o resultado final nunca é negativo,
 * porque a tabela do banco só aceita pontuação maior ou igual a zero.
 *
 * Função pura: não acessa banco nem relógio, o que permite testá-la isoladamente.
 *
 * @param counters Contadores da partida (bruxas, inocentes, dano e duração em ms).
 * @returns Pontuação final, inteira e não negativa.
 */
export function calculateScore(counters: ScoreCounters): number {
  const elapsedSeconds = Math.floor(counters.durationMs / MILLISECONDS_PER_SECOND);
  const remainingSeconds = Math.max(0, GAME_RULES.timeLimitSeconds - elapsedSeconds);
  const timeBonus = remainingSeconds * GAME_RULES.timeBonusPerSecond;

  const points =
    counters.witchesKilled * GAME_RULES.witchPoints -
    counters.innocentsKilled * GAME_RULES.innocentPenalty -
    counters.damageTaken * GAME_RULES.damagePenalty +
    timeBonus;

  return Math.max(0, points);
}

/**
 * Registra uma partida no ranking.
 *
 * O servidor calcula a pontuação com calculateScore; o cliente só envia contadores,
 * para que ninguém consiga gravar uma pontuação inventada. A flag usedInspector é
 * apenas registrada, sem bloquear a partida (easter egg da seção 6 do CLAUDE.md).
 *
 * @param submission Dados já validados da partida.
 * @returns O registro salvo, com id, pontuação calculada e data de criação.
 */
export async function submitScore(submission: ScoreSubmission): Promise<ScoreRecord> {
  return insertScore({ ...submission, score: calculateScore(submission) });
}

/**
 * Busca as melhores partidas: maior pontuação primeiro e, em empate, a mais rápida.
 *
 * @param limit Quantidade de registros (já validada entre 1 e 50).
 * @returns Lista ordenada de partidas.
 */
export async function getRanking(limit: number): Promise<ScoreRecord[]> {
  return findTopScores(limit);
}
