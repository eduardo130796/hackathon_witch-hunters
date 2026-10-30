import type { MatchResult } from '../types/api';

// Regras de fim de partida, puras e sem Phaser, para serem testadas e explicadas sozinhas.

// O que a tela de resultado recebe. victory fica fora de MatchResult de propósito: o
// MatchResult vai inteiro para a API, que não aceita esse campo.
export interface MatchOutcome {
  match: MatchResult;
  victory: boolean;
}

export type DeathOutcome = 'respawn' | 'defeat';

/**
 * Decide o que acontece quando o jogador morre.
 *
 * Regra: toda morte consome um respawn, esteja o jogador antes ou dentro da arena do chefe.
 * Enquanto houver respawns, ele volta ao último ponto de controle; quando eles acabam, a
 * morte é final. Com maxRespawns = 3, o jogador tem 4 tentativas na partida. Uma regra
 * única, sem exceção para a arena, é mais fácil de entender jogando e de explicar.
 *
 * @param respawnsUsed Quantos respawns já foram usados nesta partida.
 * @param maxRespawns Limite de respawns da partida (MAX_RESPAWNS).
 * @returns 'respawn' se ainda resta tentativa; 'defeat' se a partida termina.
 */
export function resolveDeath(respawnsUsed: number, maxRespawns: number): DeathOutcome {
  return respawnsUsed < maxRespawns ? 'respawn' : 'defeat';
}

interface VictoryCheck {
  playerX: number;
  finalZoneStartX: number;
  bossDefeated: boolean;
}

/**
 * Diz se a partida foi vencida.
 *
 * Regra: é preciso as duas coisas, derrotar o chefe e chegar à saída. Só derrotar o chefe
 * não basta, para a vitória ser um gesto do jogador; só chegar à saída também não, para
 * ninguém vencer passando correndo pelo chefe.
 *
 * @param check Posição do jogador, início da zona final e se o chefe já morreu.
 * @returns true quando o jogador está na zona final com o chefe derrotado.
 */
export function isVictory(check: VictoryCheck): boolean {
  return check.bossDefeated && check.playerX >= check.finalZoneStartX;
}
