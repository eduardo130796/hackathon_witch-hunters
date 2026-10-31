import Phaser from 'phaser';
import {
  WITCH_ATTACK_COOLDOWN_MS,
  WITCH_ATTACK_DAMAGE,
  WITCH_ATTACK_DURATION_MS,
  WITCH_ATTACK_RANGE,
  WITCH_ATTACK_REACH,
  WITCH_ATTACK_WINDUP_MS,
  WITCH_CHASE_SPEED,
  WITCH_DETECTION_RADIUS,
  WITCH_DISPLAY_HEIGHT,
  WITCH_FLEE_SPEED,
  WITCH_FLEE_VANISH_DISTANCE,
  WITCH_MAX_HEALTH,
  WITCH_PATROL_SPEED,
} from '../config/balance';
import { Enemy, type ApproachPlan, type EnemyPlacement } from './Enemy';
import {
  registerEnemySheetAnimations,
  WITCH_SHEET,
  type EnemySheet,
  type EnemySheetState,
} from './enemy-animations';
import { frontHitbox, type HitOutcome } from './hitbox';

// 'dormant' é a bruxa adormecida: parada, sem detectar nem atacar até awaken(). 'approach' é a
// adormecida que vem ao encontro do jogador para provocá-lo (approachPlan), ainda sem atacar.
// 'flee' e 'gone' tiram a bruxa da luta sem matá-la (flee e dismiss): ela foge e depois some.
type WitchState =
  'dormant' | 'approach' | 'patrol' | 'chase' | 'attack' | 'flee' | 'gone' | 'hurt' | 'dead';

// O que a bruxa precisa saber do alvo. Uma interface, e não o Player, para a bruxa não
// depender de outra entidade.
export interface WitchTarget {
  readonly x: number;
  readonly y: number;
  isAlive(): boolean;
}

// O que muda entre a bruxa comum e suas versões mais fortes (o chefe, as bruxas de trechos
// avançados). Opcionais no construtor: sem nada, vale a bruxa comum de balance.ts.
// Lobo e lobisomem também usam estas características: são a mesma inteligência com outros
// números e outra sprite sheet.
export interface WitchTraits {
  maxHealth: number;
  displayHeight: number;
  attackDamage: number;
  detectionRadius: number;
  patrolSpeed: number;
  chaseSpeed: number;
  // Começa adormecida (parada, sem detectar nem atacar) até alguém chamar awaken(). Usado
  // pela narrativa na bruxa que provoca o jogador antes da luta.
  startsDormant: boolean;
  // Só para a adormecida: vai ao encontro do jogador e avisa a chegada, que abre a fala.
  approachPlan?: ApproachPlan;
  // Ataque mágico: o AudioCueSystem toca o som de magia a cada golpe. Lobos mordem e arranham.
  castsMagic: boolean;
  // Sprite sheet e mapa estado → animação (enemy-animations.ts).
  sheet: EnemySheet;
}

const COMMON_WITCH_TRAITS: WitchTraits = {
  maxHealth: WITCH_MAX_HEALTH,
  displayHeight: WITCH_DISPLAY_HEIGHT,
  attackDamage: WITCH_ATTACK_DAMAGE,
  detectionRadius: WITCH_DETECTION_RADIUS,
  patrolSpeed: WITCH_PATROL_SPEED,
  chaseSpeed: WITCH_CHASE_SPEED,
  startsDormant: false,
  castsMagic: true,
  sheet: WITCH_SHEET,
};

// Estados sem animação própria nas sprite sheets usam uma das existentes: o encontro e a fuga
// andam (patrulha e perseguição); a bruxa que sumiu fica invisível.
const WITCH_ANIMATION_STATE: Record<WitchState, EnemySheetState> = {
  dormant: 'dormant',
  approach: 'patrol',
  patrol: 'patrol',
  chase: 'chase',
  attack: 'attack',
  flee: 'chase',
  gone: 'dormant',
  hurt: 'hurt',
  dead: 'dead',
};

export class Witch extends Enemy {
  // Lido pelo CombatSystem, que aplica o dano: assim o chefe fere mais sem regra especial lá.
  readonly attackDamage: number;
  // Lido pelo AudioCueSystem para decidir se o golpe toca o som de magia.
  readonly castsMagic: boolean;
  private readonly detectionRadius: number;
  private readonly patrolSpeed: number;
  private readonly chaseSpeed: number;
  private readonly sheet: EnemySheet;
  private dormant: boolean;
  private readonly approachPlan?: ApproachPlan;
  // Saída da luta pedida por flee() ou dismiss(); sem valor, a bruxa luta normalmente.
  private leaving?: 'flee' | 'gone';
  private attackStartedAt = 0;
  private attackEndsAt = 0;
  private nextAttackAt = 0;
  private swingCount = 0;

  constructor(
    scene: Phaser.Scene,
    placement: EnemyPlacement,
    private readonly target: WitchTarget,
    overrides: Partial<WitchTraits> = {},
  ) {
    const traits = { ...COMMON_WITCH_TRAITS, ...overrides };
    super(scene, placement, {
      initialTextureKey: traits.sheet.textureKey,
      maxHealth: traits.maxHealth,
      displayHeight: traits.displayHeight,
    });
    this.attackDamage = traits.attackDamage;
    this.castsMagic = traits.castsMagic;
    this.detectionRadius = traits.detectionRadius;
    this.patrolSpeed = traits.patrolSpeed;
    this.chaseSpeed = traits.chaseSpeed;
    this.sheet = traits.sheet;
    this.dormant = traits.startsDormant;
    this.approachPlan = traits.approachPlan;
    registerEnemySheetAnimations(scene.anims, traits.sheet);
    this.applyState(this.dormant ? 'dormant' : 'patrol');
  }

  // Acorda a bruxa adormecida: a partir do próximo quadro ela patrulha, detecta e ataca.
  awaken(): void {
    this.dormant = false;
  }

  // Um golpe acorda a bruxa adormecida: ignorar o ataque do jogador pareceria um defeito.
  override takeDamage(amount: number): HitOutcome {
    // Quem saiu da luta não apanha: não vira morte de bruxa no placar nem alvo para farmar.
    if (this.leaving) {
      return 'ignored';
    }
    this.awaken();
    return super.takeDamage(amount);
  }

  // Foge para a direita e some quando estiver longe do jogador, fora da tela. Usado pela
  // bruxa da provocação, que corre para avisar as outras bruxas.
  flee(): void {
    this.leaving = 'flee';
  }

  // Sai da fase na hora, sem animação: o fim da fuga, já fora da tela.
  private dismiss(): void {
    this.leaving = 'gone';
  }

  update(): void {
    if (this.state === 'dead' || this.state === 'gone') {
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
    if (this.leaving) {
      return this.leaving;
    }
    if (now < this.hurtEndsAt) {
      return 'hurt';
    }
    if (this.dormant) {
      return this.approachPlan && !this.approachArrived ? 'approach' : 'dormant';
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
    return distance <= this.detectionRadius ? 'chase' : 'patrol';
  }

  // Único ponto de troca de estado (seção 9.6), como no Player.
  override setState(next: WitchState): this {
    if (next !== this.state) {
      this.applyState(next);
    }
    return this;
  }

  // Troca a animação e faz o que só acontece na entrada do estado.
  private applyState(next: WitchState): void {
    this.state = next;
    // O encontro usa a caminhada da patrulha: as sprite sheets não têm uma animação própria.
    const animationState = WITCH_ANIMATION_STATE[next];
    this.showSheetAnimation(this.sheet, this.sheet.animationByState[animationState]);
    if (next === 'attack') {
      this.startAttack();
    } else if (next === 'hurt') {
      // Cancela o golpe em andamento; o tempo de espera até o próximo continua valendo.
      this.attackEndsAt = 0;
    } else if (next === 'dead') {
      this.becomeCorpse();
    } else if (next === 'gone') {
      this.becomeCorpse();
      this.setVisible(false);
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
    if (this.state === 'flee') {
      this.runAway();
      return;
    }
    if (this.state === 'patrol') {
      this.patrol(this.patrolSpeed);
      return;
    }
    if (this.state === 'chase') {
      this.chase();
      return;
    }
    if (this.state === 'approach') {
      if (this.approachPlan) {
        this.advanceApproach(this.approachPlan);
      }
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
      this.setVelocityX(this.facing * this.chaseSpeed);
    } else {
      this.stopMoving();
    }
  }

  private runAway(): void {
    this.face(1);
    this.setVelocityX(WITCH_FLEE_SPEED);
    if (Math.abs(this.x - this.target.x) > WITCH_FLEE_VANISH_DISTANCE) {
      this.dismiss();
    }
  }

  private faceTarget(): void {
    this.face(this.target.x < this.x ? -1 : 1);
  }
}
