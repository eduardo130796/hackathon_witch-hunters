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
}

// Quem reage aos golpes (efeitos visuais). O combate só avisa o que aconteceu; câmera,
// partículas e flash ficam fora daqui, para as regras não dependerem da apresentação.
export interface CombatListener {
  onEnemyHit(event: EnemyHitEvent): void;
  onPlayerHit(event: PlayerHitEvent): void;
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
