import Phaser from 'phaser';
import {
  WEREWOLF_CHASE_SPEED,
  WEREWOLF_DAMAGE,
  WEREWOLF_DISPLAY_HEIGHT,
  WEREWOLF_MAX_HEALTH,
  WEREWOLF_PATROL_SPEED,
} from '../config/balance';
import type { EnemyPlacement } from './Enemy';
import { WEREWOLF_SHEET } from './enemy-animations';
import { Witch, type WitchTarget, type WitchTraits } from './Witch';

// O lobisomem é o mini-chefe da floresta. Herda de Witch, como o chefe e o lobo: mesma
// inteligência, outros números (mais lento, mais vida, golpe mais forte, maior na tela) e
// outra sprite sheet. A barra de vida usa getHealthRatio(), herdado de Enemy.
//
// Pontuação: conta como bruxa abatida. O CombatSystem recebe witches: Witch[], então ele
// entra na contagem sem regra especial, e a API só conhece bruxas, inocentes e dano.
//
// Som: castsMagic = false, porque o golpe é de garra, não de magia. Não há arquivo de som
// de garra ou rugido, então o golpe fica em silêncio.
export class Werewolf extends Witch {
  // Nome exibido na barra de vida do mini-chefe, como o displayName do Boss.
  readonly displayName = 'O Lobisomem';

  constructor(
    scene: Phaser.Scene,
    placement: EnemyPlacement,
    target: WitchTarget,
    overrides: Partial<WitchTraits> = {},
  ) {
    super(scene, placement, target, {
      maxHealth: WEREWOLF_MAX_HEALTH,
      displayHeight: WEREWOLF_DISPLAY_HEIGHT,
      attackDamage: WEREWOLF_DAMAGE,
      patrolSpeed: WEREWOLF_PATROL_SPEED,
      chaseSpeed: WEREWOLF_CHASE_SPEED,
      castsMagic: false,
      sheet: WEREWOLF_SHEET,
      ...overrides,
    });
  }
}
