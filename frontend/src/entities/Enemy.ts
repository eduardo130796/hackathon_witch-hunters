import Phaser from 'phaser';
import {
  ENEMY_HITBOX_HEIGHT_RATIO,
  ENEMY_HITBOX_WIDTH_RATIO,
  ENEMY_HURT_DURATION_MS,
  KNOCKBACK_DURATION_MS,
  NARRATIVE_APPROACH_SPEED,
  NARRATIVE_APPROACH_START_RADIUS,
  NARRATIVE_APPROACH_STOP_DISTANCE,
} from '../config/balance';
import type { EnemySheet } from './enemy-animations';
import { bodyBounds, dynamicBody, type Facing, type HitOutcome } from './hitbox';

// Posição e rota de patrulha, definidas pela fase.
export interface EnemyPlacement {
  x: number;
  groundY: number;
  patrolFromX: number;
  patrolToX: number;
}

// Personagem que vai ao encontro do jogador para falar com ele (a Anciã, a bruxa da
// provocação). Avisa uma única vez quando começa a andar (onStart: o jogador para e espera) e
// quando chega (onArrive: quem a criou abre a fala).
export interface ApproachPlan {
  target: { readonly x: number };
  // Se o encontro já pode começar (a bruxa da floresta espera os lobos e o lobisomem morrerem).
  canStart: () => boolean;
  onStart: () => void;
  onArrive: () => void;
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
  // Andamento do encontro (ApproachPlan), lido pelas subclasses para escolher o estado.
  protected approachArrived = false;
  private approachStarted = false;
  protected hurtEndsAt = 0;
  private knockbackEndsAt = 0;
  // Sheet já ajustada por fitToSheet. Comparar a chave da textura não basta: o sprite já
  // nasce com a textura da sheet, mas ainda sem escala, origem e corpo ajustados.
  private fittedSheet: EnemySheet | null = null;
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

  // Um passo do encontro: só começa quando o jogador está à vista, anda até ele e para a uma
  // distância de conversa. Devolve true no quadro em que chega. Só na horizontal, como a
  // perseguição da bruxa, para um pulo do jogador não desfazer a chegada.
  // Um quadro do encontro, com os avisos de início e chegada dados uma única vez cada.
  protected advanceApproach(plan: ApproachPlan): void {
    if (this.approachArrived) {
      this.stopMoving();
      return;
    }
    if (!plan.canStart()) {
      this.stopMoving();
      return;
    }
    const step = this.stepTowards(plan.target);
    if (step === 'walking' && !this.approachStarted) {
      this.approachStarted = true;
      plan.onStart();
    }
    if (step === 'arrived') {
      this.approachArrived = true;
      plan.onArrive();
    }
  }

  protected stepTowards(target: { readonly x: number }): 'waiting' | 'walking' | 'arrived' {
    const distance = Math.abs(target.x - this.x);
    if (distance > NARRATIVE_APPROACH_START_RADIUS) {
      this.stopMoving();
      return 'waiting';
    }
    this.face(target.x < this.x ? -1 : 1);
    if (distance <= NARRATIVE_APPROACH_STOP_DISTANCE) {
      this.stopMoving();
      return 'arrived';
    }
    this.setVelocityX(this.facing * NARRATIVE_APPROACH_SPEED);
    return 'walking';
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

  // Versão do showTexture para inimigos com sprite sheet. Na primeira chamada troca para a
  // sheet e ajusta escala, origem e corpo, como o fitToSheet do Player: todos os quadros têm
  // o mesmo tamanho e os pés na mesma linha, então isso só precisa ser feito uma vez.
  // ignoreIfPlaying = true: patrulha e perseguição podem usar a mesma animação, e a troca
  // entre elas não deve reiniciar a corrida. Ataque e dano tocam uma vez e já terminaram
  // quando o estado volta a eles, então recomeçam do primeiro quadro.
  protected showSheetAnimation(sheet: EnemySheet, animationKey: string): void {
    if (this.fittedSheet !== sheet) {
      this.setTexture(sheet.textureKey);
      this.fitToSheet(sheet);
      this.fittedSheet = sheet;
    }
    this.anims.play(animationKey, true);
  }

  // A escala usa a altura da figura, não a do quadro, que tem muita sobra transparente.
  // Corpo e offset são medidos em pixels do quadro (o Phaser aplica a escala a eles); o
  // corpo termina exatamente na linha dos pés e fica centralizado, então o espelhamento
  // (setFlipX) não o desloca.
  private fitToSheet(sheet: EnemySheet): void {
    this.setScale(this.targetDisplayHeight / sheet.figureHeight);
    this.setOrigin(0.5, sheet.feetY / sheet.frameHeight);
    this.arcadeBody.setSize(sheet.hitboxWidth, sheet.hitboxHeight, false);
    this.arcadeBody.setOffset(
      (sheet.frameWidth - sheet.hitboxWidth) / 2,
      sheet.feetY - sheet.hitboxHeight,
    );
  }

  protected get arcadeBody(): Phaser.Physics.Arcade.Body {
    return dynamicBody(this);
  }
}
