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
  // Todos os chefes comuns da fase (hoje, a Bruxa Anciã da arena) já foram derrotados.
  allBossesDefeated: boolean;
  // O demônio, chefe final, já foi derrotado (estado 'dead', depois da animação de morte).
  demonDefeated: boolean;
}

/**
 * Diz se a partida foi vencida.
 *
 * Regra: é preciso derrotar o demônio E todos os chefes comuns. Exigir o chefe da arena
 * também impede vencer passando correndo por ele. Não há mais zona de saída: a arena do
 * demônio fica no fim do mundo e trava o jogador lá dentro, então derrotá-lo já é chegar ao
 * fim da fase.
 *
 * @param check Se os chefes comuns e o demônio já foram derrotados.
 * @returns true quando todos os chefes, inclusive o demônio, estão derrotados.
 */
export function isVictory(check: VictoryCheck): boolean {
  return check.allBossesDefeated && check.demonDefeated;
}
