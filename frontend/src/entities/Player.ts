import Phaser from 'phaser';
import {
  ATTACK_DURATION_MS,
  HURT_DURATION_MS,
  INVINCIBILITY_MS,
  KNIGHT_FEET_Y,
  KNIGHT_FIGURE_HEIGHT,
  KNIGHT_FRAME_SIZE,
  KNIGHT_HITBOX_HEIGHT,
  KNIGHT_HITBOX_WIDTH,
  PLAYER_ATTACK_REACH,
  PLAYER_FIGURE_DISPLAY_HEIGHT,
  PLAYER_JUMP_VELOCITY,
  PLAYER_KNOCKBACK_DURATION_MS,
  PLAYER_MAX_HEALTH,
  PLAYER_MOVE_SPEED,
} from '../config/balance';
import type { EffectsSystem } from '../systems/EffectsSystem';
import type { PlayerInput } from '../systems/PlayerInput';
import { bodyBounds, dynamicBody, frontHitbox, type HitOutcome } from './hitbox';
import {
  KNIGHT_SHEET_KEY,
  registerKnightAnimations,
  type KnightAnimationKey,
} from './knight-animations';

type PlayerState = 'idle' | 'walk' | 'jump' | 'attack' | 'hurt' | 'death' | 'victory';

// Animação de cada estado. O ataque não está aqui porque alterna entre dois golpes (veja
// attackAnimation). A sheet tem linhas próprias para parado, passos, salto, morte e vitória;
// só o dano não tem, e usa a recuperação do ataque 1, em que o cavaleiro se curva e volta,
// como quem recebe um golpe.
const STATE_ANIMATIONS: Record<Exclude<PlayerState, 'attack'>, KnightAnimationKey> = {
  idle: 'knight-idle',
  walk: 'knight-walk',
  jump: 'knight-jump',
  hurt: 'knight-attack-1-recovery',
  death: 'knight-death',
  victory: 'knight-victory',
};

// O personagem vem de uma sprite sheet com uma sequência de quadros por ação, que substitui
// as antigas imagens estáticas por pose: com quadros de verdade, o idle já respira sozinho e
// o golpe mostra a espada em movimento. Por isso o tween de respiração do EffectsSystem
// deixou de ser usado aqui: somado ao loop de quadros, ele deformaria a animação.
export class Player extends Phaser.Physics.Arcade.Sprite {
  private health = PLAYER_MAX_HEALTH;
  private attackEndsAt = 0;
  private hurtEndsAt = 0;
  private invincibleUntil = 0;
  private knockbackEndsAt = 0;
  // Muda a cada novo golpe. O CombatSystem compara este número para saber que começou outro
  // golpe e que os alvos já atingidos podem ser acertados de novo.
  private swingCount = 0;
  // Último golpe cuja animação já começou; distingue um golpe novo de um que está tocando.
  private animatedSwing = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly effects: EffectsSystem,
  ) {
    super(scene, x, y, KNIGHT_SHEET_KEY);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    registerKnightAnimations(scene.anims);
    this.fitToSheet();
    this.setCollideWorldBounds(true);
    this.applyState('idle');
  }

  update(input: PlayerInput): void {
    // Nenhuma tecla tira o personagem da morte; só respawnAt, chamado pela regra de respawn.
    if (this.state === 'death') {
      return;
    }
    const now = this.scene.time.now;
    const direction = Number(input.isDown('moveRight')) - Number(input.isDown('moveLeft'));
    // Durante o empurrão do dano a entrada não comanda a velocidade horizontal; sem isso o
    // recuo seria apagado no quadro seguinte e o golpe recebido não seria sentido.
    if (now >= this.knockbackEndsAt) {
      this.setVelocityX(direction * PLAYER_MOVE_SPEED);
    }
    // Os quadros olham para a direita; espelhar evita precisar de uma sheet para a esquerda.
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

  // Chamado pelo EffectsSystem depois de um dano não fatal. O morto não é empurrado: a pose
  // de morte fica onde caiu.
  applyKnockback(velocityX: number, velocityY: number): void {
    if (this.state === 'death') {
      return;
    }
    this.setVelocity(velocityX, velocityY);
    this.knockbackEndsAt = this.scene.time.now + PLAYER_KNOCKBACK_DURATION_MS;
  }

  // Única saída do estado 'death', usada só pelo CheckpointSystem. Fica explícita, e não
  // escondida no update, porque morrer continua definitivo para teclas e inimigos: só a regra
  // de respawn pode trazer o personagem de volta. A invencibilidade com piscar impede que um
  // inimigo parado no ponto de controle mate o jogador assim que ele reaparece.
  respawnAt(x: number, y: number, health: number): void {
    const now = this.scene.time.now;
    this.health = health;
    this.attackEndsAt = 0;
    this.hurtEndsAt = 0;
    this.knockbackEndsAt = 0;
    this.invincibleUntil = now + INVINCIBILITY_MS;
    // reset move a imagem e zera a velocidade de uma vez, sem herdar a queda da morte.
    this.arcadeBody.reset(x, y);
    this.setFlipX(false);
    this.setState('idle');
    this.effects.blink(this, INVINCIBILITY_MS);
  }

  // Parado esperando alguém chegar para falar: sem entrada, mas com gravidade, para quem estava
  // no ar pousar. A pose sai da mesma regra de sempre (repouso no chão, queda no ar).
  holdStill(): void {
    if (this.state === 'death') {
      return;
    }
    const now = this.scene.time.now;
    if (now >= this.knockbackEndsAt) {
      this.setVelocityX(0);
    }
    this.setState(this.resolveState(0, now));
  }

  // Para o personagem no lugar na vitória: sem velocidade e sem física, ele não cai nem é
  // empurrado enquanto a tela de resultado não chega. O estado 'victory' só é alcançado por
  // aqui, pois depois do fim da partida a LevelScene não chama mais o update.
  freeze(): void {
    this.setVelocity(0, 0);
    this.arcadeBody.moves = false;
    this.setState('victory');
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
  // que só guarda um valor, para também trocar a animação. Um golpe emendado no fim do
  // anterior não muda o estado ('attack' continua 'attack'), mas precisa tocar de novo.
  override setState(next: PlayerState): this {
    const isNewSwing = next === 'attack' && this.animatedSwing !== this.swingCount;
    if (next !== this.state || isNewSwing) {
      this.applyState(next);
    }
    return this;
  }

  private applyState(next: PlayerState): void {
    this.state = next;
    if (next === 'attack') {
      this.animatedSwing = this.swingCount;
    }
    // ignoreIfPlaying = false: ao reentrar num estado, a animação recomeça do primeiro quadro.
    this.anims.play(next === 'attack' ? this.attackAnimation() : STATE_ANIMATIONS[next], false);
  }

  // Golpes alternados (corte, depois estocada) deixam ataques seguidos menos repetitivos.
  // As duas linhas têm 6 quadros e o mesmo ritmo, então duram o mesmo ATTACK_DURATION_MS.
  private attackAnimation(): KnightAnimationKey {
    return this.swingCount % 2 === 1 ? 'knight-attack-1' : 'knight-attack-2';
  }

  // Todos os quadros têm o mesmo tamanho e os pés na mesma linha, então escala, origem e
  // corpo são definidos uma vez só. A escala usa a altura da figura, não a do quadro, que
  // tem muita sobra transparente. Corpo e offset são medidos em pixels do quadro, pois o
  // Phaser aplica a escala a eles; o corpo termina exatamente na linha dos pés.
  private fitToSheet(): void {
    this.setScale(PLAYER_FIGURE_DISPLAY_HEIGHT / KNIGHT_FIGURE_HEIGHT);
    // Origem nos pés: a coordenada y do jogador é a linha do chão.
    this.setOrigin(0.5, KNIGHT_FEET_Y / KNIGHT_FRAME_SIZE);
    this.arcadeBody.setSize(KNIGHT_HITBOX_WIDTH, KNIGHT_HITBOX_HEIGHT, false);
    this.arcadeBody.setOffset(
      (KNIGHT_FRAME_SIZE - KNIGHT_HITBOX_WIDTH) / 2,
      KNIGHT_FEET_Y - KNIGHT_HITBOX_HEIGHT,
    );
  }

  private get arcadeBody(): Phaser.Physics.Arcade.Body {
    return dynamicBody(this);
  }
}
