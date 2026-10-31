import type { EnemySpawn } from '../levels/level-01';

// Regras dos portões de trecho, puras e sem Phaser: o jogador só passa para o trecho seguinte
// depois de derrotar os inimigos hostis do trecho atual.

/**
 * Diz se um inimigo precisa morrer para o portão do seu trecho abrir.
 *
 * Regra: contam só os hostis que lutam. Inocentes (inclusive a Anciã) não contam, porque
 * matá-los é punido; a bruxa que só provoca e foge (fleesAfterTrigger) também não, porque
 * ela nunca luta e não pode ser morta.
 *
 * @param spawn Tipo do inimigo e se ele foge depois de uma fala.
 * @returns true se o portão espera a morte deste inimigo.
 */
export function countsForGate(spawn: Pick<EnemySpawn, 'type' | 'fleesAfterTrigger'>): boolean {
  return spawn.type !== 'innocent' && spawn.fleesAfterTrigger === undefined;
}

/**
 * Diz se um trecho está limpo, ou seja, se o portão no fim dele já pode abrir.
 *
 * Regra: todos os hostis que contam (countsForGate) estão mortos. Um trecho sem nenhum está
 * sempre limpo. Mortos continuam mortos depois de um respawn, então o portão aberto não fecha.
 *
 * @param hostilesAlive Se cada hostil do trecho ainda está vivo.
 * @returns true quando nenhum hostil do trecho está vivo.
 */
export function isSegmentCleared(hostilesAlive: readonly boolean[]): boolean {
  return hostilesAlive.every((alive) => !alive);
}
