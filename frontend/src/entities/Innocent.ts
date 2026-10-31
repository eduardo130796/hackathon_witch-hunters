import Phaser from 'phaser';
import {
  INNOCENT_DISPLAY_HEIGHT,
  INNOCENT_MAX_HEALTH,
  INNOCENT_PATROL_SPEED,
} from '../config/balance';
import { Enemy, type ApproachPlan, type EnemyPlacement } from './Enemy';

// 'approach' e 'wait' são do inocente que vem falar com o jogador (a Anciã): ele espera
// parado, anda até o jogador quando o vê, fala e depois continua parado ali.
type InnocentState = 'patrol' | 'approach' | 'wait' | 'hurt' | 'dead';

// Mesma convenção da bruxa: uma textura por pose ('innocent-walk'), carregada pela BootScene
// de public/assets/sprites/innocent/.
export const INNOCENT_POSES = ['walk', 'hurt', 'death'] as const;
type InnocentPose = (typeof INNOCENT_POSES)[number];

const POSE_BY_STATE: Record<InnocentState, InnocentPose> = {
  patrol: 'walk',
  approach: 'walk',
  wait: 'walk',
  hurt: 'hurt',
  dead: 'death',
};

export function innocentTextureKey(pose: InnocentPose): string {
  return `innocent-${pose}`;
}

// O inocente nunca ataca: só anda e reage a golpes. Ele existe para punir o jogador que
// ataca sem olhar, por isso não tem hitbox de ataque. Com um ApproachPlan, em vez de
// patrulhar ele vai ao encontro do jogador para uma fala.
export class Innocent extends Enemy {
  constructor(
    scene: Phaser.Scene,
    placement: EnemyPlacement,
    private readonly approachPlan?: ApproachPlan,
  ) {
    super(scene, placement, {
      initialTextureKey: innocentTextureKey(POSE_BY_STATE.patrol),
      maxHealth: INNOCENT_MAX_HEALTH,
      displayHeight: INNOCENT_DISPLAY_HEIGHT,
    });
    this.applyState(approachPlan ? 'wait' : 'patrol');
  }

  update(): void {
    if (this.state === 'dead') {
      return;
    }
    this.refreshState();
    if (this.state === 'patrol') {
      this.patrol(INNOCENT_PATROL_SPEED);
    } else if (this.state === 'approach') {
      if (this.approachPlan) {
        this.advanceApproach(this.approachPlan);
      }
    } else {
      this.stopMoving();
    }
  }

  protected refreshState(): void {
    this.setState(this.resolveState(this.scene.time.now));
  }

  // Prioridade: dead > hurt > (approach ou wait, para quem tem encontro) > patrol.
  private resolveState(now: number): InnocentState {
    if (!this.isAlive()) {
      return 'dead';
    }
    if (now < this.hurtEndsAt) {
      return 'hurt';
    }
    if (this.approachPlan) {
      return this.approachArrived ? 'wait' : 'approach';
    }
    return 'patrol';
  }

  // Único ponto de troca de estado (seção 9.6), como no Player.
  override setState(next: InnocentState): this {
    if (next !== this.state) {
      this.applyState(next);
    }
    return this;
  }

  private applyState(next: InnocentState): void {
    this.state = next;
    this.showTexture(innocentTextureKey(POSE_BY_STATE[next]));
    if (next === 'dead') {
      this.becomeCorpse();
    }
  }
}
