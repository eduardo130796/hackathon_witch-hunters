import Phaser from 'phaser';
import {
  ATTACK_DURATION_MS,
  HURT_DURATION_MS,
  INVINCIBILITY_MS,
  PLAYER_ATTACK_REACH,
  PLAYER_DISPLAY_HEIGHT,
  PLAYER_HITBOX_HEIGHT_RATIO,
  PLAYER_HITBOX_WIDTH_RATIO,
  PLAYER_JUMP_VELOCITY,
  PLAYER_MAX_HEALTH,
  PLAYER_MOVE_SPEED,
} from '../config/balance';
import type { EffectsSystem } from '../systems/EffectsSystem';
import type { PlayerInput } from '../systems/PlayerInput';
import { bodyBounds, dynamicBody, frontHitbox, type HitOutcome } from './hitbox';

export const PLAYER_STATES = ['idle', 'walk', 'jump', 'attack', 'hurt', 'death'] as const;
export type PlayerState = (typeof PLAYER_STATES)[number];

// Cada estado tem uma imagem própria; a BootScene carrega todas com estas chaves.
export function playerTextureKey(state: PlayerState): string {
  return `knight-${state}`;
}

// Só nestes estados o corpo fica de pé e parado o bastante para "respirar".
const BREATHING_STATES: readonly PlayerState[] = ['idle', 'walk'];

// O personagem é uma imagem estática por pose, gerada uma a uma por IA, e não uma sprite
// sheet com quadros de animação. Por isso a "animação" é a troca de textura conforme o
// estado, e a sensação de vida vem de efeitos do EffectsSystem.
export class Player extends Phaser.Physics.Arcade.Sprite {
  private health = PLAYER_MAX_HEALTH;
  private attackEndsAt = 0;
  private hurtEndsAt = 0;
  private invincibleUntil = 0;
  // Muda a cada novo golpe. O CombatSystem compara este número para saber que começou outro
  // golpe e que os alvos já atingidos podem ser acertados de novo.
  private swingCount = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly effects: EffectsSystem,
  ) {
    super(scene, x, y, playerTextureKey('idle'));
    scene.add.existing(this);
    scene.physics.add.existing(this);
    // Origem nos pés: a coordenada y é a linha do chão, e a respiração comprime o corpo
    // em direção aos pés em vez de fazê-lo flutuar.
    this.setOrigin(0.5, 1);
    this.setCollideWorldBounds(true);
    this.applyState('idle');
  }

  update(input: PlayerInput): void {
    // Morte é definitiva: nenhuma tecla tira o personagem desse estado.
    if (this.state === 'death') {
      return;
    }
    const now = this.scene.time.now;
    const direction = Number(input.isDown('moveRight')) - Number(input.isDown('moveLeft'));
    this.setVelocityX(direction * PLAYER_MOVE_SPEED);
    // As imagens olham para a direita; espelhar evita precisar de PNGs para a esquerda.
    if (direction !== 0) {
      this.setFlipX(direction < 0);
    }

    // Só pula quem está apoiado em algo: sem isso, apertar no ar daria pulos infinitos.
    if (input.justPressed('jump') && this.arcadeBody.blocked.down) {
      this.setVelocityY(PLAYER_JUMP_VELOCITY);
    }
    if (input.justPressed('attack') && now >= this.attackEndsAt) {
      this.attackEndsAt = now + ATTACK_DURATION_MS;
      this.swingCount += 1;
    }

    this.setState(this.resolveState(direction, now));
  }

  get swingId(): number {
    return this.swingCount;
  }

  // A espada só fere enquanto a pose de ataque está na tela: se o dano interromper o golpe,
  // o golpe deixa de valer, coerente com o que o jogador vê.
  getAttackHitbox(): Phaser.Geom.Rectangle | null {
    if (this.state !== 'attack') {
      return null;
    }
    return frontHitbox(this.arcadeBody, this.flipX ? -1 : 1, PLAYER_ATTACK_REACH);
  }

  getHurtbox(): Phaser.Geom.Rectangle {
    return bodyBounds(this.arcadeBody);
  }

  getHealth(): number {
    return this.health;
  }

  isAlive(): boolean {
    return this.health > 0;
  }

  // Devolve se o dano foi aplicado: durante a invencibilidade o golpe não conta, e o
  // CombatSystem não deve registrá-lo na pontuação.
  takeDamage(amount: number): HitOutcome {
    const now = this.scene.time.now;
    if (this.state === 'death' || now < this.invincibleUntil) {
      return 'ignored';
    }
    this.health = Math.max(0, this.health - amount);
    this.hurtEndsAt = now + HURT_DURATION_MS;
    this.invincibleUntil = now + INVINCIBILITY_MS;

    if (this.health === 0) {
      this.setVelocityX(0);
      this.setState('death');
      return 'killed';
    }
    this.effects.blink(this, INVINCIBILITY_MS);
    this.setState('hurt');
    return 'hurt';
  }

  // Prioridade: death > hurt > attack > jump > walk > idle. Estados mais raros e mais
  // importantes vencem os comuns: morrer cancela tudo; levar dano interrompe o ataque,
  // para o jogador perceber que foi atingido; atacar no ar mostra o golpe, não o pulo;
  // e andar só aparece quando nada mais urgente está acontecendo.
  private resolveState(direction: number, now: number): PlayerState {
    if (this.health <= 0) {
      return 'death';
    }
    if (now < this.hurtEndsAt) {
      return 'hurt';
    }
    if (now < this.attackEndsAt) {
      return 'attack';
    }
    if (!this.arcadeBody.blocked.down) {
      return 'jump';
    }
    return direction === 0 ? 'idle' : 'walk';
  }

  // Único ponto de troca de estado (seção 9.6). Sobrescreve o setState genérico do Phaser,
  // que só guarda um valor, para também trocar textura, hitbox e efeitos.
  override setState(next: PlayerState): this {
    if (next !== this.state) {
      this.applyState(next);
    }
    return this;
  }

  private applyState(next: PlayerState): void {
    this.state = next;
    this.effects.stopBreathing(this);
    this.setTexture(playerTextureKey(next));
    this.fitToTexture();
    if (BREATHING_STATES.includes(next)) {
      this.effects.startBreathing(this);
    }
  }

  // Escala pela altura, mantendo a proporção: a pose de morte, mais larga, fica com a
  // mesma escala das outras. O hitbox é recalculado porque cada textura tem seu tamanho,
  // e é medido em pixels da imagem original, pois o Phaser aplica a escala ao corpo.
  private fitToTexture(): void {
    this.setScale(PLAYER_DISPLAY_HEIGHT / this.frame.height);
    this.setBodySize(
      this.frame.width * PLAYER_HITBOX_WIDTH_RATIO,
      this.frame.height * PLAYER_HITBOX_HEIGHT_RATIO,
      true,
    );
  }

  private get arcadeBody(): Phaser.Physics.Arcade.Body {
    return dynamicBody(this);
  }
}
