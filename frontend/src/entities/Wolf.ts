import Phaser from 'phaser';
import {
  WOLF_CHASE_SPEED,
  WOLF_DISPLAY_HEIGHT,
  WOLF_MAX_HEALTH,
  WOLF_PATROL_SPEED,
} from '../config/balance';
import type { EnemyPlacement } from './Enemy';
import { WOLF_SHEET } from './enemy-animations';
import { Witch, type WitchTarget, type WitchTraits } from './Witch';

// O lobo herda de Witch, como o chefe: a mesma inteligência de patrulha, perseguição e
// ataque, sem duplicar regra. Só mudam os números (mais rápido, menos vida) e a sprite sheet.
//
// Pontuação: o lobo conta como bruxa abatida. O CombatSystem recebe witches: Witch[], então
// ele entra na contagem sem regra especial, e a API só conhece bruxas, inocentes e dano;
// criar um contador novo exigiria mudar fórmula, banco e ranking.
//
// Som: castsMagic = false, porque o lobo morde e não lança magia. Não há arquivo de som de
// mordida, então o golpe fica em silêncio em vez de tocar um som que não combina.
export class Wolf extends Witch {
  constructor(
    scene: Phaser.Scene,
    placement: EnemyPlacement,
    target: WitchTarget,
    overrides: Partial<WitchTraits> = {},
  ) {
    super(scene, placement, target, {
      maxHealth: WOLF_MAX_HEALTH,
      displayHeight: WOLF_DISPLAY_HEIGHT,
      patrolSpeed: WOLF_PATROL_SPEED,
      chaseSpeed: WOLF_CHASE_SPEED,
      castsMagic: false,
      sheet: WOLF_SHEET,
      ...overrides,
    });
  }
}
