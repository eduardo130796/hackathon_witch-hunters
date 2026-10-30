import Phaser from 'phaser';
import { EFFECTS, TIMING_MS } from '../ui/theme';

interface BreathingEffect {
  tween: Phaser.Tweens.Tween;
  baseScaleY: number;
}

// Concentra os efeitos visuais de jogo (tweens de feedback), para que entidades e cenas
// só peçam "respire" ou "pisque" sem conhecer duração, curva ou intensidade.
export class EffectsSystem {
  private readonly breathingByTarget = new Map<Phaser.GameObjects.Sprite, BreathingEffect>();

  constructor(private readonly tweens: Phaser.Tweens.TweenManager) {}

  startBreathing(target: Phaser.GameObjects.Sprite): void {
    this.stopBreathing(target);
    // Parte da escala atual, porque cada pose pode ter sido escalada para a altura-alvo.
    const baseScaleY = target.scaleY;
    const tween = this.tweens.add({
      targets: target,
      scaleY: baseScaleY * EFFECTS.breathing.minScaleRatio,
      duration: TIMING_MS.slow,
      ease: Phaser.Math.Easing.Sine.InOut,
      yoyo: true,
      repeat: -1,
    });
    this.breathingByTarget.set(target, { tween, baseScaleY });
  }

  stopBreathing(target: Phaser.GameObjects.Sprite): void {
    const breathing = this.breathingByTarget.get(target);
    if (!breathing) {
      return;
    }
    breathing.tween.stop();
    target.scaleY = breathing.baseScaleY;
    this.breathingByTarget.delete(target);
  }

  // Cada piscada é ida e volta (yoyo), por isso o número de repetições usa o dobro do tempo.
  blink(target: Phaser.GameObjects.Sprite, durationMs: number): void {
    const blinkCount = Math.max(1, Math.floor(durationMs / (TIMING_MS.fast * 2)));
    this.tweens.add({
      targets: target,
      alpha: EFFECTS.blink.alpha,
      duration: TIMING_MS.fast,
      yoyo: true,
      repeat: blinkCount - 1,
      onComplete: () => target.setAlpha(1),
    });
  }
}
