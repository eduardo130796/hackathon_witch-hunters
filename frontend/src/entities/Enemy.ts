import Phaser from 'phaser';
import {
  ENEMY_HITBOX_HEIGHT_RATIO,
  ENEMY_HITBOX_WIDTH_RATIO,
  ENEMY_HURT_DURATION_MS,
  KNOCKBACK_DURATION_MS,
} from '../config/balance';
import { bodyBounds, dynamicBody, type Facing, type HitOutcome } from './hitbox';

// Posição e rota de patrulha, definidas pela fase.
export interface EnemyPlacement {
  x: number;
  groundY: number;
  patrolFromX: number;
  patrolToX: number;
}

// Características fixas de cada tipo de inimigo, definidas pela subclasse.
interface EnemyTraits {
  initialTextureKey: string;
  maxHealth: number;
  displayHeight: number;
}

// Base de Witch e Innocent. Concentra o que os dois fazem igual (patrulha, vida, dano,
// morte e ajuste da imagem), para a regra não ficar duplicada. Os estados e o setState
// ficam em cada subclasse, porque cada inimigo tem sua própria lista de estados.
export abstract class Enemy extends Phaser.Physics.Arcade.Sprite {
  protected facing: Facing = 1;
  protected hurtEndsAt = 0;
  private knockbackEndsAt = 0;
  private health: number;
  private readonly maxHealth: number;
  private readonly patrolFromX: number;
  private readonly patrolToX: number;
  private readonly targetDisplayHeight: number;

  constructor(scene: Phaser.Scene, placement: EnemyPlacement, traits: EnemyTraits) {
    super(scene, placement.x, placement.groundY, traits.initialTextureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    // Origem nos pés, como no Player: a coordenada y é a linha do chão.
    this.setOrigin(0.5, 1);
    this.setCollideWorldBounds(true);
    this.health = traits.maxHealth;
    this.maxHealth = traits.maxHealth;
    this.patrolFromX = placement.patrolFromX;
    this.patrolToX = placement.patrolToX;
    this.targetDisplayHeight = traits.displayHeight;
  }

  // Chamado a cada quadro pela cena.
  abstract override update(): void;

  // Recalcula o estado depois de um evento externo, como levar dano.
  protected abstract refreshState(): void;

  takeDamage(amount: number): HitOutcome {
    if (!this.isAlive()) {
      return 'ignored';
    }
    this.health = Math.max(0, this.health - amount);
    this.hurtEndsAt = this.scene.time.now + ENEMY_HURT_DURATION_MS;
    this.refreshState();
    return this.isAlive() ? 'hurt' : 'killed';
  }

  isAlive(): boolean {
    return this.health > 0;
  }

  // Fração de 0 a 1, para barras de vida não precisarem conhecer a vida máxima de cada tipo.
  getHealthRatio(): number {
    return this.health / this.maxHealth;
  }

  getHurtbox(): Phaser.Geom.Rectangle {
    return bodyBounds(this.arcadeBody);
  }

  // Vai e volta entre os dois pontos. Testar "passou do ponto" em vez de "chegou no ponto"
  // também traz de volta um inimigo que saiu da rota (por exemplo, perseguindo o jogador).
  protected patrol(speed: number): void {
    if (this.x >= this.patrolToX) {
      this.face(-1);
    } else if (this.x <= this.patrolFromX) {
      this.face(1);
    }
    this.setVelocityX(this.facing * speed);
  }

  protected face(direction: Facing): void {
    this.facing = direction;
    // As imagens olham para a direita, como as do cavaleiro.
    this.setFlipX(direction === -1);
  }

  // Durante o empurrão a velocidade é mantida: a pose de dano chama isto a cada quadro e,
  // sem a exceção, zeraria o recuo no quadro seguinte ao golpe. Basta proteger este método
  // porque KNOCKBACK_DURATION_MS é menor que ENEMY_HURT_DURATION_MS: o empurrão sempre
  // termina dentro da pose de dano, antes de patrulha ou perseguição voltarem a mover.
  protected stopMoving(): void {
    if (this.scene.time.now < this.knockbackEndsAt) {
      return;
    }
    this.setVelocityX(0);
  }

  // Chamado pelo EffectsSystem quando um golpe não fatal conecta.
  applyKnockback(velocityX: number, velocityY: number): void {
    this.setVelocity(velocityX, velocityY);
    this.knockbackEndsAt = this.scene.time.now + KNOCKBACK_DURATION_MS;
  }

  // O corpo é desligado para o cadáver não colidir nem receber golpes; a imagem fica na
  // cena para o jogador ver o resultado da luta.
  protected becomeCorpse(): void {
    this.stopMoving();
    this.arcadeBody.enable = false;
  }

  // Igual ao fitToTexture do Player: escala pela altura e recalcula o hitbox, porque cada
  // textura (provisória ou PNG) pode ter um tamanho diferente.
  protected showTexture(key: string): void {
    this.setTexture(key);
    this.setScale(this.targetDisplayHeight / this.frame.height);
    this.setBodySize(
      this.frame.width * ENEMY_HITBOX_WIDTH_RATIO,
      this.frame.height * ENEMY_HITBOX_HEIGHT_RATIO,
      true,
    );
  }

  protected get arcadeBody(): Phaser.Physics.Arcade.Body {
    return dynamicBody(this);
  }
}
