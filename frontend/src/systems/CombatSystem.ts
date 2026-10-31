import Phaser from 'phaser';
import { PLAYER_ATTACK_DAMAGE } from '../config/balance';
import { SCORE_RULES } from '../config/score-rules';
import type { Facing, HitOutcome } from '../entities/hitbox';
import type { Innocent } from '../entities/Innocent';
import type { Player } from '../entities/Player';
import type { Witch } from '../entities/Witch';
import type { ScoreTracker } from './ScoreTracker';

// Golpe que conectou, do ponto de vista de quem apanhou. direction é o sentido do golpe (de
// quem bate para quem apanha), usado para empurrar o alvo e espirrar o sangue para o lado certo.
type LandedOutcome = Exclude<HitOutcome, 'ignored'>;

export interface EnemyHitEvent {
  enemy: Witch | Innocent;
  outcome: LandedOutcome;
  direction: Facing;
  // Pontos que este golpe somou (+) ou tirou (-) do placar; zero se só feriu.
  scoreDelta: number;
}

export interface PlayerHitEvent {
  outcome: LandedOutcome;
  direction: Facing;
  // Força do empurrão, só para golpes mais pesados que o padrão (a garra do demônio). Sem
  // valor, vale o empurrão padrão do jogador.
  knockbackForce?: number;
}

// Golpe que conectou no ponto fraco do demônio. Separado de EnemyHitEvent porque o demônio
// é parte do cenário: não recua nem sangra como uma bruxa.
export interface DemonHitEvent {
  outcome: LandedOutcome;
  weakPoint: Phaser.Geom.Rectangle;
  direction: Facing;
  scoreDelta: number;
}

// Quem reage aos golpes (efeitos visuais). O combate só avisa o que aconteceu; câmera,
// partículas e flash ficam fora daqui, para as regras não dependerem da apresentação.
export interface CombatListener {
  onEnemyHit(event: EnemyHitEvent): void;
  onPlayerHit(event: PlayerHitEvent): void;
  onDemonHit(event: DemonHitEvent): void;
}

// Comparar posições, e não para onde o atacante olha, acerta o sentido mesmo quando os
// corpos se sobrepõem.
function hitDirection(attacker: { readonly x: number }, target: { readonly x: number }): Facing {
  return target.x >= attacker.x ? 1 : -1;
}

// Quem golpeia: expõe a área do golpe atual e um número que muda a cada novo golpe.
interface Attacker {
  readonly swingId: number;
  getAttackHitbox(): Phaser.Geom.Rectangle | null;
}

// Quem pode ser atingido.
interface Damageable {
  getHurtbox(): Phaser.Geom.Rectangle;
  takeDamage(amount: number): HitOutcome;
}

interface SwingRecord {
  swingId: number;
  targetsHit: Set<Damageable>;
}

interface Combatants {
  player: Player;
  // Inclui o chefe, que é uma Witch: derrotá-lo conta como uma bruxa a mais no placar, porque
  // a API só conhece bruxas, inocentes e dano, e a fórmula precisa ser a mesma do servidor.
  witches: readonly Witch[];
  innocents: readonly Innocent[];
  scoreTracker: ScoreTracker;
}

// Único lugar com as regras de combate: quem fere quem, quanto, e o que vira pontuação.
export class CombatSystem {
  // Alvos já atingidos no golpe atual de cada atacante. Um golpe dura vários quadros e a
  // sobreposição continua verdadeira em todos eles; sem este registro, um único golpe
  // tiraria uma vida por quadro.
  private readonly swingsByAttacker = new Map<Attacker, SwingRecord>();
  // Ponto fraco do chefe demônio, presente só enquanto a arena final está ativa.
  private demon: Damageable | null = null;

  // O ouvinte é opcional: as regras funcionam iguais sem nenhum efeito visual conectado.
  constructor(
    private readonly combatants: Combatants,
    private readonly listener?: CombatListener,
  ) {}

  // Chamado a cada quadro, depois que todas as entidades se moveram.
  update(): void {
    const { player, witches, innocents, scoreTracker } = this.combatants;

    for (const witch of witches) {
      const witchOutcome = this.resolveHit(player, witch, PLAYER_ATTACK_DAMAGE);
      if (witchOutcome === 'killed') {
        scoreTracker.recordWitchKill();
      }
      this.reportEnemyHit(witch, witchOutcome, SCORE_RULES.witchPoints);
      // O dano vem de cada bruxa: o chefe tira mais vida, e isso também pesa mais no placar.
      const playerOutcome = this.resolveHit(witch, player, witch.attackDamage);
      if (playerOutcome !== 'ignored') {
        scoreTracker.recordDamage(witch.attackDamage);
        this.listener?.onPlayerHit({
          outcome: playerOutcome,
          direction: hitDirection(witch, player),
        });
      }
    }
    // Acertar um inocente não é bloqueado: o golpe vale normalmente e a punição é só na
    // pontuação, para a escolha de onde golpear ser do jogador.
    for (const innocent of innocents) {
      const innocentOutcome = this.resolveHit(player, innocent, PLAYER_ATTACK_DAMAGE);
      if (innocentOutcome === 'killed') {
        scoreTracker.recordInnocentKill();
      }
      this.reportEnemyHit(innocent, innocentOutcome, -SCORE_RULES.innocentPenalty);
    }
    this.resolveDemonHit();
  }

  // A arena liga o demônio ao entrar e o desliga ao sair (null). O dano no jogador não passa
  // por aqui: os ataques do demônio têm zona de impacto própria, não golpe corpo a corpo.
  setDemon(demon: Damageable | null): void {
    this.demon = demon;
  }

  // Dano no jogador vindo de algo que não é um golpe corpo a corpo (bola de fogo, garra do
  // demônio). Passa pelas mesmas regras do golpe de uma bruxa: o Player decide se vale
  // (invencibilidade), o dano entra no placar e o ouvinte faz flash e empurrão.
  applyEnvironmentHit(damage: number, sourceX: number, knockbackForce?: number): void {
    const { player, scoreTracker } = this.combatants;
    const outcome = player.takeDamage(damage);
    if (outcome === 'ignored') {
      return;
    }
    scoreTracker.recordDamage(damage);
    this.listener?.onPlayerHit({
      outcome,
      direction: hitDirection({ x: sourceX }, player),
      knockbackForce,
    });
  }

  // Golpes no ponto fraco não valem pontos por acerto, porque o servidor só conhece bruxas,
  // inocentes e dano. A morte do demônio conta como uma bruxa, como a do chefe Boss.
  private resolveDemonHit(): void {
    const { player, scoreTracker } = this.combatants;
    if (!this.demon) {
      return;
    }
    const outcome = this.resolveHit(player, this.demon, PLAYER_ATTACK_DAMAGE);
    if (outcome === 'ignored') {
      return;
    }
    if (outcome === 'killed') {
      scoreTracker.recordWitchKill();
    }
    const weakPoint = this.demon.getHurtbox();
    this.listener?.onDemonHit({
      outcome,
      weakPoint,
      direction: hitDirection(player, { x: weakPoint.centerX }),
      scoreDelta: outcome === 'killed' ? SCORE_RULES.witchPoints : 0,
    });
  }

  // A variação de pontos sai da mesma tabela da fórmula (SCORE_RULES), e só a morte muda o
  // placar: um golpe que só fere vale zero.
  private reportEnemyHit(
    enemy: Witch | Innocent,
    outcome: HitOutcome,
    killScoreDelta: number,
  ): void {
    if (outcome === 'ignored' || !this.listener) {
      return;
    }
    this.listener.onEnemyHit({
      enemy,
      outcome,
      direction: hitDirection(this.combatants.player, enemy),
      scoreDelta: outcome === 'killed' ? killScoreDelta : 0,
    });
  }

  // Aplica o dano se a área do golpe encosta no corpo do alvo e se este golpe ainda não o
  // atingiu. O alvo decide se o dano vale (invencibilidade, já morto) e devolve o resultado.
  resolveHit(attacker: Attacker, target: Damageable, damage: number): HitOutcome {
    const hitbox = attacker.getAttackHitbox();
    if (!hitbox) {
      return 'ignored';
    }
    const swing = this.currentSwing(attacker);
    if (swing.targetsHit.has(target)) {
      return 'ignored';
    }
    if (!Phaser.Geom.Intersects.RectangleToRectangle(hitbox, target.getHurtbox())) {
      return 'ignored';
    }
    swing.targetsHit.add(target);
    return target.takeDamage(damage);
  }

  // Um swingId diferente do registrado significa golpe novo: a lista de alvos recomeça.
  private currentSwing(attacker: Attacker): SwingRecord {
    const recorded = this.swingsByAttacker.get(attacker);
    if (recorded && recorded.swingId === attacker.swingId) {
      return recorded;
    }
    const fresh: SwingRecord = { swingId: attacker.swingId, targetsHit: new Set() };
    this.swingsByAttacker.set(attacker, fresh);
    return fresh;
  }
}
