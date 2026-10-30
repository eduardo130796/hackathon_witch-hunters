import Phaser from 'phaser';
import { BOSS_DAMAGE, BOSS_MAX_HEALTH, BOSS_SCALE, WITCH_DISPLAY_HEIGHT } from '../config/balance';
import type { EnemyPlacement } from './Enemy';
import { Witch } from './Witch';

// O chefe é uma bruxa mais forte, não uma criatura nova. Por isso herda de Witch (extends),
// e não usa composição: mesmas poses, mesmos estados (WitchState), mesmo setState e mesma
// inteligência de patrulha, perseguição e ataque. Só mudam os números, passados como
// características ao construtor da bruxa. Composição exigiria repassar cada método da bruxa
// sem ganho nenhum.
//
// O tamanho maior vem da altura de exibição, e não de setScale: a base Enemy reescala a
// imagem para essa altura a cada troca de pose, o que apagaria um setScale feito aqui.
export class Boss extends Witch {
  // Nome exibido na barra de vida do topo da tela.
  readonly displayName = 'A Bruxa Anciã';

  constructor(
    scene: Phaser.Scene,
    placement: EnemyPlacement,
    target: ConstructorParameters<typeof Witch>[2],
  ) {
    super(scene, placement, target, {
      maxHealth: BOSS_MAX_HEALTH,
      displayHeight: WITCH_DISPLAY_HEIGHT * BOSS_SCALE,
      attackDamage: BOSS_DAMAGE,
    });
  }
}
