import Phaser from 'phaser';
import type { Facing } from '../entities/hitbox';
import { EFFECTS, TIMING_MS } from '../ui/theme';

// Quem pode ser empurrado: a entidade recebe a velocidade e decide por quanto tempo a mantém.
interface Knockbackable {
  applyKnockback(velocityX: number, velocityY: number): void;
}

// Força do empurrão em px/s: horizontal no sentido do golpe e lift vertical (negativo sobe).
interface KnockbackForce {
  horizontal: number;
  lift: number;
}

interface BreathingEffect {
  tween: Phaser.Tweens.Tween;
  baseScaleY: number;
}

// Concentra os efeitos visuais de jogo (tweens de feedback), para que entidades e cenas
// só peçam "respire" ou "pisque" sem conhecer duração, curva ou intensidade.
export class EffectsSystem {
  private readonly breathingByTarget = new Map<Phaser.GameObjects.Sprite, BreathingEffect>();
  private hitstopEndsAt = 0;
  private hitstopTimer?: Phaser.Time.TimerEvent;
  private shakeIntensity = 0;
  private physicsHeld = false;

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

  // Congela a física por um instante quando um golpe conecta (hitstop): o quadro do impacto
  // fica parado tempo bastante para o olho registrar o contato.
  //
  // Só a física para; o relógio da cena (scene.time) segue. Por isso os tempos de ataque, dano
  // e invencibilidade continuam correndo durante a pausa. Com 70 a 220 ms isso é aceitável:
  // as janelas encurtam um pouco na tela, e a invencibilidade correndo favorece o jogador.
  // Parar o relógio também pararia o delayedCall que retoma a física.
  //
  // Golpes sobrepostos: a pausa termina no fim mais distante entre a atual e a nova, e nunca
  // na soma das duas. Um segundo golpe no meio da pausa não a encerra cedo nem a prolonga sem fim.
  hitstop(scene: Phaser.Scene, durationMs: number): void {
    const endsAt = scene.time.now + durationMs;
    if (endsAt <= this.hitstopEndsAt) {
      return;
    }
    this.hitstopEndsAt = endsAt;
    this.hitstopTimer?.remove(false);
    scene.physics.world.isPaused = true;
    this.hitstopTimer = scene.time.delayedCall(durationMs, () => {
      this.hitstopTimer = undefined;
      // Um diálogo aberto durante o hitstop continua segurando a física: o fim do golpe não
      // pode soltar o jogador enquanto ele ainda está lendo.
      if (!this.physicsHeld) {
        scene.physics.world.isPaused = false;
      }
    });
  }

  // Pausa longa e sem prazo (diálogo). Passa pelo mesmo lugar que o hitstop para que uma
  // pausa não retome a física antes da hora da outra.
  holdPhysics(scene: Phaser.Scene): void {
    this.physicsHeld = true;
    scene.physics.world.isPaused = true;
  }

  // Só retoma se nenhum hitstop estiver em andamento; senão o fim do hitstop retoma.
  releasePhysics(scene: Phaser.Scene): void {
    this.physicsHeld = false;
    if (!this.hitstopTimer) {
      scene.physics.world.isPaused = false;
    }
  }

  // Treme a câmera principal. Um tremor fraco não substitui um forte em andamento (o golpe
  // comum logo depois da morte não pode apagar o tremor pesado); um mais forte substitui o
  // fraco na hora, para o evento mais grave sempre ser sentido.
  shakeCamera(scene: Phaser.Scene, intensity: number, durationMs: number): void {
    const camera = scene.cameras.main;
    if (camera.shakeEffect.isRunning && intensity < this.shakeIntensity) {
      return;
    }
    this.shakeIntensity = intensity;
    camera.shake(durationMs, intensity, true);
  }

  // Empurra o alvo para longe do golpe. A direção é a do golpe (de quem bate para quem
  // apanha), então o alvo recua para o lado oposto ao atacante, como num impacto real.
  // Quem mantém o empurrão por alguns quadros é a própria entidade, porque só ela sabe quando
  // a IA ou o controle deixariam de sobrescrever a velocidade.
  knockback(target: Knockbackable, direction: Facing, force: KnockbackForce): void {
    target.applyKnockback(direction * force.horizontal, force.lift);
  }
}
