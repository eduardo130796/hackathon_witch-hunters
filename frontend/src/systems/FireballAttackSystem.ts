import Phaser from 'phaser';
import {
  DEMON_ARENA_MARGIN,
  DEMON_DAMAGE_FIREBALL,
  DEMON_FIREBALL_COUNT,
  DEMON_FIREBALL_DISPLAY_HEIGHT,
  DEMON_FIREBALL_FALL_MS,
  DEMON_FIREBALL_SHAKE_INTENSITY,
  DEMON_FIREBALL_SHAKE_MS,
  DEMON_FIREBALL_SPACING,
  DEMON_FIREBALL_STAGGER_MS,
  DEMON_FIREBALL_TILT_DEGREES,
  FIREBALL_IMPACT_RADIUS,
} from '../config/balance';
import { isWithinImpactRadius, pickImpactTargets } from '../domain/demon-rules';
import { spawnFireExplosion } from '../ui/effects/FireExplosion';
import { DEMON_VISUALS } from '../ui/theme';
import type { DemonAttackContext } from './demon-attack-context';

export const FIREBALL_TEXTURE_KEY = 'demon-boss-fireball';

// Ataque de bolas de fogo em sistema próprio, e não dentro do DemonBoss: aviso, queda,
// impacto e limpeza somam bastante código, e separados o chefe fica só com a máquina de
// estados, fácil de ler e de explicar.
export class FireballAttackSystem {
  private readonly fireballs = new Set<Phaser.GameObjects.Image>();
  private readonly timers: Phaser.Time.TimerEvent[] = [];
  private targets: number[] = [];

  constructor(private readonly context: DemonAttackContext) {}

  // ms do início da queda até o último impacto: o chefe espera isto antes de ficar vulnerável.
  static get attackDurationMs(): number {
    return DEMON_FIREBALL_FALL_MS + (DEMON_FIREBALL_COUNT - 1) * DEMON_FIREBALL_STAGGER_MS;
  }

  // Escolhe os pontos de queda agora, perto do jogador, sem marcar o chão: por decisão de
  // design o ataque é surpresa, para a luta final ser mais difícil. Os pontos não acompanham
  // o jogador depois da escolha: quem continua se movendo ainda escapa.
  telegraph(): void {
    this.cancel();
    const { arena, player } = this.context;
    this.targets = pickImpactTargets({
      playerX: player.getHurtbox().centerX,
      arena,
      count: DEMON_FIREBALL_COUNT,
      spacing: DEMON_FIREBALL_SPACING,
      margin: DEMON_ARENA_MARGIN,
    });
  }

  // As bolas caem uma depois da outra, para cada impacto ser lido separado.
  launch(): void {
    this.targets.forEach((x, index) => {
      const timer = this.context.scene.time.delayedCall(index * DEMON_FIREBALL_STAGGER_MS, () =>
        this.dropFireball(x),
      );
      this.timers.push(timer);
    });
  }

  // Cai do topo da visão da câmera até o chão, levemente inclinada, como um meteoro.
  private dropFireball(x: number): void {
    const { scene, arena } = this.context;
    const fireball = scene.add
      .image(x, scene.cameras.main.worldView.top, FIREBALL_TEXTURE_KEY)
      .setOrigin(0.5, 1)
      .setAngle(-DEMON_FIREBALL_TILT_DEGREES)
      .setDepth(DEMON_VISUALS.attackDepth);
    fireball.setScale(DEMON_FIREBALL_DISPLAY_HEIGHT / fireball.height);
    this.fireballs.add(fireball);
    scene.tweens.add({
      targets: fireball,
      y: arena.groundY,
      angle: DEMON_FIREBALL_TILT_DEGREES,
      duration: DEMON_FIREBALL_FALL_MS,
      ease: Phaser.Math.Easing.Quadratic.In,
      onComplete: () => this.impact(fireball),
    });
  }

  private impact(fireball: Phaser.GameObjects.Image): void {
    const { scene, arena, player, effects, onPlayerHit } = this.context;
    const x = fireball.x;
    this.destroyFireball(fireball);
    spawnFireExplosion(scene, x, arena.groundY);
    effects.shakeCamera(scene, DEMON_FIREBALL_SHAKE_INTENSITY, DEMON_FIREBALL_SHAKE_MS);
    if (
      player.isAlive() &&
      isWithinImpactRadius(player.getHurtbox().centerX, x, FIREBALL_IMPACT_RADIUS)
    ) {
      onPlayerHit(DEMON_DAMAGE_FIREBALL, x);
    }
  }

  private destroyFireball(fireball: Phaser.GameObjects.Image): void {
    this.context.scene.tweens.killTweensOf(fireball);
    fireball.destroy();
    this.fireballs.delete(fireball);
  }

  // Interrompe o ataque em qualquer fase (morte do chefe, fim da cena) sem deixar restos.
  cancel(): void {
    this.timers.forEach((timer) => timer.remove(false));
    this.timers.length = 0;
    [...this.fireballs].forEach((fireball) => this.destroyFireball(fireball));
    this.targets = [];
  }
}
