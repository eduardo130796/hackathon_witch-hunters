import Phaser from 'phaser';
import type { ArenaSpan } from '../domain/demon-rules';
import type { Player } from '../entities/Player';
import type { EffectsSystem } from './EffectsSystem';

// O que os ataques do demônio recebem de quem os cria. O dano no jogador passa só por
// onPlayerHit, nunca por player.takeDamage: assim invencibilidade, flash, empurrão e placar
// seguem o mesmo fluxo de qualquer outro golpe. knockbackForce é opcional e só a garra o usa.
export interface DemonAttackContext {
  scene: Phaser.Scene;
  arena: ArenaSpan & { groundY: number };
  player: Player;
  effects: EffectsSystem;
  onPlayerHit: (damage: number, sourceX: number, knockbackForce?: number) => void;
}
