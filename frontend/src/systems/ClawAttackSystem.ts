import Phaser from 'phaser';
import {
  CLAW_IMPACT_RADIUS,
  DEMON_ARENA_MARGIN,
  DEMON_CLAW_DISPLAY_HEIGHT,
  DEMON_CLAW_HITSTOP_MS,
  DEMON_CLAW_HOLD_MS,
  DEMON_CLAW_KNOCKBACK_FORCE,
  DEMON_CLAW_RETRACT_MS,
  DEMON_CLAW_RISE_MS,
  DEMON_CLAW_SHAKE_INTENSITY,
  DEMON_CLAW_SHAKE_MS,
  DEMON_CLAW_SINK,
  DEMON_CLAW_TELEGRAPH_MS,
  DEMON_CLAW_TELEGRAPH_SHAKE_INTENSITY,
  DEMON_DAMAGE_CLAW,
} from '../config/balance';
import { isWithinImpactRadius, pickImpactTargets } from '../domain/demon-rules';
import { DEMON_VISUALS } from '../ui/theme';
import type { DemonAttackContext } from './demon-attack-context';

export const CLAW_TEXTURE_KEY = 'demon-boss-claw';

// Garra em sistema próprio pelo mesmo motivo da bola de fogo: o DemonBoss fica só com a
// máquina de estados, e cada ataque cuida da própria mira, impacto e limpeza.
export class ClawAttackSystem {
  private claw?: Phaser.GameObjects.Image;
  private holdTimer?: Phaser.Time.TimerEvent;
  private targetX = 0;

  constructor(private readonly context: DemonAttackContext) {}

  // ms do início da subida até a garra sumir: o chefe espera isto antes de ficar vulnerável.
  static get attackDurationMs(): number {
    return DEMON_CLAW_RISE_MS + DEMON_CLAW_HOLD_MS + DEMON_CLAW_RETRACT_MS;
  }

  // Mira no jogador sem marcar o chão: o ataque é surpresa, por decisão de design, para a
  // luta final ser mais difícil. Só um tremor leve anuncia que algo vem de baixo.
  telegraph(): void {
    this.cancel();
    const { scene, arena, player, effects } = this.context;
    // Mesma regra de mira da bola de fogo, com um único ponto: o jogador, longe das paredes.
    const playerX = player.getHurtbox().centerX;
    const [targetX] = pickImpactTargets({
      playerX,
      arena,
      count: 1,
      spacing: 0,
      margin: DEMON_ARENA_MARGIN,
    });
    this.targetX = targetX ?? playerX;
    effects.shakeCamera(scene, DEMON_CLAW_TELEGRAPH_SHAKE_INTENSITY, DEMON_CLAW_TELEGRAPH_MS);
  }

  // A garra irrompe de baixo da tela até o chão, fica um instante e volta para baixo.
  launch(): void {
    const { scene, arena } = this.context;
    const hiddenY = scene.cameras.main.worldView.bottom + DEMON_CLAW_DISPLAY_HEIGHT;
    const claw = scene.add
      .image(this.targetX, hiddenY, CLAW_TEXTURE_KEY)
      .setOrigin(0.5, 1)
      .setDepth(DEMON_VISUALS.attackDepth);
    claw.setScale(DEMON_CLAW_DISPLAY_HEIGHT / claw.height);
    this.claw = claw;
    scene.tweens.add({
      targets: claw,
      y: arena.groundY + DEMON_CLAW_SINK,
      duration: DEMON_CLAW_RISE_MS,
      ease: Phaser.Math.Easing.Cubic.Out,
      onComplete: () => this.impact(hiddenY),
    });
  }

  private impact(hiddenY: number): void {
    const { scene, player, effects, onPlayerHit } = this.context;
    effects.shakeCamera(scene, DEMON_CLAW_SHAKE_INTENSITY, DEMON_CLAW_SHAKE_MS);
    effects.hitstop(scene, DEMON_CLAW_HITSTOP_MS);
    if (
      player.isAlive() &&
      isWithinImpactRadius(player.getHurtbox().centerX, this.targetX, CLAW_IMPACT_RADIUS)
    ) {
      onPlayerHit(DEMON_DAMAGE_CLAW, this.targetX, DEMON_CLAW_KNOCKBACK_FORCE);
    }
    this.holdTimer = scene.time.delayedCall(DEMON_CLAW_HOLD_MS, () => this.retract(hiddenY));
  }

  private retract(hiddenY: number): void {
    const claw = this.claw;
    if (!claw) {
      return;
    }
    this.context.scene.tweens.add({
      targets: claw,
      y: hiddenY,
      duration: DEMON_CLAW_RETRACT_MS,
      ease: Phaser.Math.Easing.Cubic.In,
      onComplete: () => this.destroyClaw(),
    });
  }

  private destroyClaw(): void {
    if (this.claw) {
      this.context.scene.tweens.killTweensOf(this.claw);
      this.claw.destroy();
      this.claw = undefined;
    }
  }

  // Interrompe o ataque em qualquer fase (morte do chefe, fim da cena) sem deixar restos.
  cancel(): void {
    this.holdTimer?.remove(false);
    this.holdTimer = undefined;
    this.destroyClaw();
  }
}
