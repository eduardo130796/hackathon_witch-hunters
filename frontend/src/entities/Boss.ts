import Phaser from 'phaser';
import { BOSS_DAMAGE, BOSS_MAX_HEALTH, BOSS_SCALE, WITCH_DISPLAY_HEIGHT } from '../config/balance';
import type { EnemyPlacement } from './Enemy';
import { Witch } from './Witch';

// Números do chefe, num perfil para um chefe novo poder mudá-los sem outra classe.
interface BossProfile {
  maxHealth: number;
  damage: number;
  scale: number;
}

export const ARENA_BOSS_PROFILE: BossProfile = {
  maxHealth: BOSS_MAX_HEALTH,
  damage: BOSS_DAMAGE,
  scale: BOSS_SCALE,
};

// O chefe é uma bruxa mais forte, não uma criatura nova. Por isso herda de Witch (extends),
// e não usa composição: mesmas animações, mesmos estados (WitchState), mesmo setState e mesma
// inteligência de patrulha, perseguição e ataque. Só mudam os números, passados como
// características ao construtor da bruxa. Composição exigiria repassar cada método da bruxa
// sem ganho nenhum. O nome exibido na barra de vida vem de levels/level-01.ts.
//
// O tamanho maior vem da altura de exibição, e não de setScale: a base Enemy calcula a
// escala da sprite sheet a partir dessa altura, o que apagaria um setScale feito aqui.
export class Boss extends Witch {
  constructor(
    scene: Phaser.Scene,
    placement: EnemyPlacement,
    target: ConstructorParameters<typeof Witch>[2],
    profile: BossProfile = ARENA_BOSS_PROFILE,
  ) {
    super(scene, placement, target, {
      maxHealth: profile.maxHealth,
      displayHeight: WITCH_DISPLAY_HEIGHT * profile.scale,
      attackDamage: profile.damage,
    });
  }
}
