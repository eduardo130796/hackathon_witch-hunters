import Phaser from 'phaser';
import {
  DEMON_ATTACK_ORDER,
  DEMON_CLAW_TELEGRAPH_MS,
  DEMON_DEATH_BRIGHTNESS,
  DEMON_DEATH_DISPLAY_MS,
  DEMON_DEATH_SHAKE_INTENSITY,
  DEMON_DEATH_SHAKE_MS,
  DEMON_FIREBALL_TELEGRAPH_MS,
  DEMON_HURT_DURATION_MS,
  DEMON_INTRO_DURATION_MS,
  DEMON_MAX_HEALTH,
  DEMON_VULNERABLE_DURATION_MS,
  DEMON_WEAK_POINT,
} from '../config/balance';
import { nextDemonAttack, type DemonAttackPattern } from '../domain/demon-rules';
import { ClawAttackSystem } from '../systems/ClawAttackSystem';
import type { EffectsSystem } from '../systems/EffectsSystem';
import { FireballAttackSystem } from '../systems/FireballAttackSystem';
import { COLORS, DEMON_VISUALS, TIMING_MS } from '../ui/theme';
import type { HitOutcome } from './hitbox';
import type { Player } from './Player';

export type DemonState =
  | 'intro'
  | 'telegraph-fireball'
  | 'attack-fireball'
  | 'telegraph-claw'
  | 'attack-claw'
  | 'vulnerable'
  | 'hurt'
  | 'dead';

// Limites da arena travada, em coordenadas do mundo.
export interface DemonArena {
  left: number;
  right: number;
  groundY: number;
}

export interface DemonBossDeps {
  scene: Phaser.Scene;
  arena: DemonArena;
  player: Player;
  effects: EffectsSystem;
  // knockbackForce só vem da garra, que arremessa mais longe que um golpe comum.
  onPlayerHit: (damage: number, sourceX: number, knockbackForce?: number) => void;
  onDefeated: () => void;
}

const FULL_BRIGHTNESS = 255;

// O demônio não anda nem tem sprite próprio: ele é a figura pintada no cenário (body.png),
// e esta entidade só guarda a vida, a máquina de estados e o ponto fraco invisível sobre a
// arte. Os ataques ficam em FireballAttackSystem e ClawAttackSystem; aqui só se decide quando
// cada um começa. Todos os tempos usam scene.time, então pausam junto com a cena.
export class DemonBoss {
  readonly displayName = 'Demônio';
  private currentState: DemonState = 'intro';
  private health = DEMON_MAX_HEALTH;
  private started = false;
  private defeatAnnounced = false;
  private lastPattern: DemonAttackPattern | null = null;
  private backdrop?: Phaser.GameObjects.Image;
  // Um único temporizador da máquina de estados: trocar de estado cancela o anterior, então
  // um aviso atrasado nunca dispara depois da morte.
  private stateTimer?: Phaser.Time.TimerEvent;
  private hurtTimer?: Phaser.Time.TimerEvent;
  private readonly fireball: FireballAttackSystem;
  private readonly claw: ClawAttackSystem;
  private readonly highlight: Phaser.GameObjects.Ellipse;
  private highlightTween?: Phaser.Tweens.Tween;
  // Instante em que a janela vulnerável atual termina; zero fora dela.
  private vulnerableEndsAt = 0;

  constructor(private readonly deps: DemonBossDeps) {
    const context = {
      scene: deps.scene,
      arena: deps.arena,
      player: deps.player,
      effects: deps.effects,
      onPlayerHit: deps.onPlayerHit,
    };
    this.fireball = new FireballAttackSystem(context);
    this.claw = new ClawAttackSystem(context);
    this.highlight = deps.scene.add
      .ellipse(0, 0, 1, 1, COLORS.magic, DEMON_VISUALS.weakPoint.maxAlpha)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(DEMON_VISUALS.weakPoint.depth)
      .setVisible(false);
  }

  get state(): DemonState {
    return this.currentState;
  }

  // Chamado quando o diálogo de provocação termina. Chamar de novo não reinicia a luta.
  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    this.setState('intro');
  }

  // A máquina de estados anda pelos temporizadores; aqui só se mantém o destaque colado ao
  // ponto fraco, caso o cenário mude de posição ou escala.
  update(): void {
    const weakPoint = this.getHurtbox();
    this.highlight.setPosition(weakPoint.centerX, weakPoint.centerY);
    this.highlight.setSize(weakPoint.width, weakPoint.height);
  }

  isAlive(): boolean {
    return this.health > 0;
  }

  getHealthRatio(): number {
    return this.health / DEMON_MAX_HEALTH;
  }

  setBackdrop(image: Phaser.GameObjects.Image): void {
    this.backdrop = image;
  }

  // Ponto fraco em coordenadas do mundo, derivado da imagem EXIBIDA do cenário: vale para
  // qualquer escala que a arena use. Sem cenário ainda, a área é vazia e nada a atinge.
  getHurtbox(): Phaser.Geom.Rectangle {
    if (!this.backdrop) {
      return new Phaser.Geom.Rectangle(0, 0, 0, 0);
    }
    const bounds = this.backdrop.getBounds();
    // getBounds devolve a posição na tela se o cenário não rola com a câmera (scrollFactor
    // menor que 1); somar a parte da rolagem que ele não acompanha leva ao mundo.
    const camera = this.deps.scene.cameras.main;
    const left = bounds.x + camera.scrollX * (1 - this.backdrop.scrollFactorX);
    const top = bounds.y + camera.scrollY * (1 - this.backdrop.scrollFactorY);
    return new Phaser.Geom.Rectangle(
      left + bounds.width * DEMON_WEAK_POINT.leftRatio,
      top + bounds.height * DEMON_WEAK_POINT.topRatio,
      bounds.width * (DEMON_WEAK_POINT.rightRatio - DEMON_WEAK_POINT.leftRatio),
      bounds.height * (DEMON_WEAK_POINT.bottomRatio - DEMON_WEAK_POINT.topRatio),
    );
  }

  // Só a janela vulnerável aceita dano. Fora dela o golpe é bloqueado com um aviso visual;
  // durante a reação a um golpe ('hurt') ele é só ignorado, sem aviso, porque o jogador acertou.
  takeDamage(amount: number): HitOutcome {
    if (this.currentState === 'hurt' || this.currentState === 'dead') {
      return 'ignored';
    }
    if (this.currentState !== 'vulnerable') {
      this.showBlocked();
      return 'ignored';
    }
    this.health = Math.max(0, this.health - amount);
    if (this.health === 0) {
      this.setState('dead');
      return 'killed';
    }
    this.setState('hurt');
    return 'hurt';
  }

  destroy(): void {
    this.clearTimers();
    this.fireball.cancel();
    this.claw.cancel();
    this.stopHighlight();
    this.highlight.destroy();
  }

  // Único lugar onde o estado muda: cada entrada de estado diz o que mostrar e quando sair.
  private setState(next: DemonState): void {
    this.currentState = next;
    this.stateTimer?.remove(false);
    this.stateTimer = undefined;
    switch (next) {
      case 'intro':
        this.after(DEMON_INTRO_DURATION_MS, () => this.startNextAttack());
        return;
      case 'telegraph-fireball':
        this.fireball.telegraph();
        this.after(DEMON_FIREBALL_TELEGRAPH_MS, () => this.setState('attack-fireball'));
        return;
      case 'attack-fireball':
        this.fireball.launch();
        this.after(FireballAttackSystem.attackDurationMs, () => this.setState('vulnerable'));
        return;
      case 'telegraph-claw':
        this.claw.telegraph();
        this.after(DEMON_CLAW_TELEGRAPH_MS, () => this.setState('attack-claw'));
        return;
      case 'attack-claw':
        this.claw.launch();
        this.after(ClawAttackSystem.attackDurationMs, () => this.setState('vulnerable'));
        return;
      case 'vulnerable':
        this.enterVulnerable();
        return;
      case 'hurt':
        this.enterHurt();
        return;
      case 'dead':
        this.enterDead();
        return;
    }
  }

  private after(delayMs: number, callback: () => void): void {
    this.stateTimer = this.deps.scene.time.delayedCall(delayMs, callback);
  }

  private startNextAttack(): void {
    this.stopHighlight();
    this.lastPattern = nextDemonAttack(this.lastPattern, DEMON_ATTACK_ORDER, Math.random());
    this.setState(this.lastPattern === 'fireball' ? 'telegraph-fireball' : 'telegraph-claw');
  }

  // Ao voltar de 'hurt' a janela não recomeça: o prazo guardado em vulnerableEndsAt continua
  // valendo, então golpear rápido não estende a janela.
  private enterVulnerable(): void {
    const now = this.deps.scene.time.now;
    if (this.vulnerableEndsAt === 0) {
      this.vulnerableEndsAt = now + DEMON_VULNERABLE_DURATION_MS;
    }
    const remainingMs = this.vulnerableEndsAt - now;
    if (remainingMs <= 0) {
      this.endVulnerable();
      return;
    }
    this.startHighlight(COLORS.magic);
    this.after(remainingMs, () => this.endVulnerable());
  }

  private endVulnerable(): void {
    this.vulnerableEndsAt = 0;
    this.startNextAttack();
  }

  // A reação ao golpe é curta e não move o demônio: o destaque fica vermelho por um instante.
  // O prazo da janela vulnerável é guardado em vulnerableEndsAt e retomado ao fim da reação.
  private enterHurt(): void {
    this.startHighlight(COLORS.danger);
    this.hurtTimer?.remove(false);
    this.hurtTimer = this.deps.scene.time.delayedCall(DEMON_HURT_DURATION_MS, () => {
      if (this.currentState === 'hurt') {
        this.setState('vulnerable');
      }
    });
  }

  // Morte: para os ataques, treme pesado, escurece o cenário e só então avisa a vitória.
  private enterDead(): void {
    this.clearTimers();
    this.fireball.cancel();
    this.claw.cancel();
    this.stopHighlight();
    const { scene, effects } = this.deps;
    effects.shakeCamera(scene, DEMON_DEATH_SHAKE_INTENSITY, DEMON_DEATH_SHAKE_MS);
    this.fadeBackdrop();
    this.stateTimer = scene.time.delayedCall(DEMON_DEATH_DISPLAY_MS, () => {
      if (this.defeatAnnounced) {
        return;
      }
      this.defeatAnnounced = true;
      this.deps.onDefeated();
    });
  }

  // Escurece o cenário pelo tint (multiplica as cores), do brilho normal até
  // DEMON_DEATH_BRIGHTNESS, durante quase toda a exibição da morte.
  private fadeBackdrop(): void {
    const backdrop = this.backdrop;
    if (!backdrop) {
      return;
    }
    this.deps.scene.tweens.addCounter({
      from: FULL_BRIGHTNESS,
      to: DEMON_DEATH_BRIGHTNESS,
      duration: DEMON_DEATH_DISPLAY_MS - TIMING_MS.slow,
      onUpdate: (tween) => {
        const level = Math.round(tween.getValue() ?? DEMON_DEATH_BRIGHTNESS);
        backdrop.setTint(Phaser.Display.Color.GetColor(level, level, level));
      },
    });
  }

  // O destaque pulsa sobre o ponto fraco para dizer "agora!" sem texto na tela.
  private startHighlight(color: number): void {
    this.stopHighlight();
    const { minAlpha, maxAlpha } = DEMON_VISUALS.weakPoint;
    this.highlight.setFillStyle(color, maxAlpha).setAlpha(1).setVisible(true);
    this.highlightTween = this.deps.scene.tweens.add({
      targets: this.highlight,
      alpha: minAlpha / maxAlpha,
      duration: TIMING_MS.normal,
      yoyo: true,
      repeat: -1,
    });
  }

  private stopHighlight(): void {
    this.highlightTween?.remove();
    this.highlightTween = undefined;
    this.highlight.setVisible(false);
  }

  // Golpe bloqueado: um anel cinza se abre no ponto fraco e some. Sem som de acerto, para o
  // jogador não confundir com dano.
  private showBlocked(): void {
    const { scene } = this.deps;
    const weakPoint = this.getHurtbox();
    const { lineWidth, endScale } = DEMON_VISUALS.blockedRing;
    const ring = scene.add
      .ellipse(weakPoint.centerX, weakPoint.centerY, weakPoint.width, weakPoint.height)
      .setStrokeStyle(lineWidth, COLORS.textMuted)
      .setDepth(DEMON_VISUALS.attackDepth);
    scene.tweens.add({
      targets: ring,
      scale: endScale,
      alpha: 0,
      duration: TIMING_MS.normal,
      onComplete: () => ring.destroy(),
    });
  }

  private clearTimers(): void {
    this.stateTimer?.remove(false);
    this.stateTimer = undefined;
    this.hurtTimer?.remove(false);
    this.hurtTimer = undefined;
  }
}
