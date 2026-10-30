import Phaser from 'phaser';
import { PLAYER_ATTACK_DAMAGE, WITCH_ATTACK_DAMAGE } from '../config/balance';
import type { HitOutcome } from '../entities/hitbox';
import type { Innocent } from '../entities/Innocent';
import type { Player } from '../entities/Player';
import type { Witch } from '../entities/Witch';
import type { ScoreTracker } from './ScoreTracker';

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

  constructor(private readonly combatants: Combatants) {}

  // Chamado a cada quadro, depois que todas as entidades se moveram.
  update(): void {
    const { player, witches, innocents, scoreTracker } = this.combatants;

    for (const witch of witches) {
      if (this.resolveHit(player, witch, PLAYER_ATTACK_DAMAGE) === 'killed') {
        scoreTracker.recordWitchKill();
      }
      if (this.resolveHit(witch, player, WITCH_ATTACK_DAMAGE) !== 'ignored') {
        scoreTracker.recordDamage(WITCH_ATTACK_DAMAGE);
      }
    }
    // Acertar um inocente não é bloqueado: o golpe vale normalmente e a punição é só na
    // pontuação, para a escolha de onde golpear ser do jogador.
    for (const innocent of innocents) {
      if (this.resolveHit(player, innocent, PLAYER_ATTACK_DAMAGE) === 'killed') {
        scoreTracker.recordInnocentKill();
      }
    }
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
