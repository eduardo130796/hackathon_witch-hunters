import Phaser from 'phaser';
import {
  WITCH_ATTACK_COOLDOWN_MS,
  WITCH_ATTACK_DURATION_MS,
  WITCH_ATTACK_RANGE,
  WITCH_ATTACK_REACH,
  WITCH_ATTACK_WINDUP_MS,
  WITCH_CHASE_SPEED,
  WITCH_DETECTION_RADIUS,
  WITCH_DISPLAY_HEIGHT,
  WITCH_MAX_HEALTH,
  WITCH_PATROL_SPEED,
} from '../config/balance';
import { Enemy, type EnemyPlacement } from './Enemy';
import { frontHitbox } from './hitbox';

type WitchState = 'patrol' | 'chase' | 'attack' | 'hurt' | 'dead';

// As imagens são poses, com os mesmos nomes do cavaleiro ('knight-walk'). Estado é
// comportamento: patrulhar e perseguir usam a mesma pose de caminhada. A BootScene carrega
// cada pose de public/assets/sprites/witch/ com estas chaves.
export const WITCH_POSES = ['walk', 'attack', 'hurt', 'death'] as const;
type WitchPose = (typeof WITCH_POSES)[number];

const POSE_BY_STATE: Record<WitchState, WitchPose> = {
  patrol: 'walk',
  chase: 'walk',
  attack: 'attack',
  hurt: 'hurt',
  dead: 'death',
};

export function witchTextureKey(pose: WitchPose): string {
  return `witch-${pose}`;
}

// O que a bruxa precisa saber do alvo. Uma interface, e não o Player, para a bruxa não
// depender de outra entidade.
interface WitchTarget {
  readonly x: number;
  readonly y: number;
  isAlive(): boolean;
}

export class Witch extends Enemy {
  private attackStartedAt = 0;
  private attackEndsAt = 0;
  private nextAttackAt = 0;
  private swingCount = 0;

  constructor(
    scene: Phaser.Scene,
    placement: EnemyPlacement,
    private readonly target: WitchTarget,
  ) {
    super(scene, placement, {
      initialTextureKey: witchTextureKey(POSE_BY_STATE.patrol),
      maxHealth: WITCH_MAX_HEALTH,
      displayHeight: WITCH_DISPLAY_HEIGHT,
    });
    this.applyState('patrol');
  }

  update(): void {
    if (this.state === 'dead') {
      return;
    }
    this.refreshState();
    this.move();
  }

  get swingId(): number {
    return this.swingCount;
  }

  // O golpe só fere depois da preparação: antes disso a pose de ataque é só um aviso.
  getAttackHitbox(): Phaser.Geom.Rectangle | null {
    const strikesAt = this.attackStartedAt + WITCH_ATTACK_WINDUP_MS;
    if (this.state !== 'attack' || this.scene.time.now < strikesAt) {
      return null;
    }
    return frontHitbox(this.arcadeBody, this.facing, WITCH_ATTACK_REACH);
  }

  protected refreshState(): void {
    this.setState(this.resolveState(this.scene.time.now));
  }

  // Prioridade: dead > hurt > attack > chase > patrol. Dano interrompe o ataque, o que
  // recompensa o jogador que golpeia primeiro; perseguir vence patrulhar porque reagir ao
  // jogador é o comportamento mais importante da bruxa.
  private resolveState(now: number): WitchState {
    if (!this.isAlive()) {
      return 'dead';
    }
    if (now < this.hurtEndsAt) {
      return 'hurt';
    }
    if (now < this.attackEndsAt) {
      return 'attack';
    }
    if (!this.target.isAlive()) {
      return 'patrol';
    }
    const distance = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
    if (distance <= WITCH_ATTACK_RANGE && now >= this.nextAttackAt) {
      return 'attack';
    }
    return distance <= WITCH_DETECTION_RADIUS ? 'chase' : 'patrol';
  }

  // Único ponto de troca de estado (seção 9.6), como no Player.
  override setState(next: WitchState): this {
    if (next !== this.state) {
      this.applyState(next);
    }
    return this;
  }

  // Troca a textura e faz o que só acontece na entrada do estado.
  private applyState(next: WitchState): void {
    this.state = next;
    this.showTexture(witchTextureKey(POSE_BY_STATE[next]));
    if (next === 'attack') {
      this.startAttack();
    } else if (next === 'hurt') {
      // Cancela o golpe em andamento; o tempo de espera até o próximo continua valendo.
      this.attackEndsAt = 0;
    } else if (next === 'dead') {
      this.becomeCorpse();
    }
  }

  private startAttack(): void {
    const now = this.scene.time.now;
    this.faceTarget();
    this.attackStartedAt = now;
    this.attackEndsAt = now + WITCH_ATTACK_DURATION_MS;
    this.nextAttackAt = this.attackEndsAt + WITCH_ATTACK_COOLDOWN_MS;
    this.swingCount += 1;
  }

  // Movimento contínuo de cada estado, executado a cada quadro.
  private move(): void {
    if (this.state === 'patrol') {
      this.patrol(WITCH_PATROL_SPEED);
      return;
    }
    if (this.state === 'chase') {
      this.chase();
      return;
    }
    this.stopMoving();
  }

  // Para ao chegar à distância de ataque, em vez de grudar no jogador, e espera ali o
  // tempo de recarga. A comparação é só na horizontal para a bruxa não girar sem parar
  // quando o jogador pula por cima dela.
  private chase(): void {
    this.faceTarget();
    const horizontalDistance = Math.abs(this.target.x - this.x);
    if (horizontalDistance > WITCH_ATTACK_RANGE) {
      this.setVelocityX(this.facing * WITCH_CHASE_SPEED);
    } else {
      this.stopMoving();
    }
  }

  private faceTarget(): void {
    this.face(this.target.x < this.x ? -1 : 1);
  }
}
