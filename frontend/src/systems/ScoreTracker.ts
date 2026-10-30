import {
  INNOCENT_MAX_HEALTH,
  INVINCIBILITY_MS,
  PLAYER_ATTACK_DAMAGE,
  PLAYER_MAX_HEALTH,
  WITCH_ATTACK_DAMAGE,
  WITCH_MAX_HEALTH,
} from '../config/balance';
import type { MatchCounters } from '../domain/score-formula';

// Valores de balanceamento que mudam a pontuação: mais vida ou mais dano no jogador deixam a
// partida mais fácil e o placar maior.
function readScoreRelevantBalance() {
  return {
    PLAYER_MAX_HEALTH,
    PLAYER_ATTACK_DAMAGE,
    INVINCIBILITY_MS,
    WITCH_MAX_HEALTH,
    WITCH_ATTACK_DAMAGE,
    INNOCENT_MAX_HEALTH,
  };
}

// Guarda os contadores da partida. O cliente só conta; quem calcula a pontuação oficial é o
// servidor (seção 9.7).
export class ScoreTracker {
  // Cópia congelada no início da partida, para a ResultScene comparar com os valores do
  // fim e descobrir se o jogador os alterou pelo inspetor (easter egg usedInspector).
  readonly balanceSnapshot = Object.freeze(readScoreRelevantBalance());
  private readonly startTime: number;
  private witchesKilled = 0;
  private innocentsKilled = 0;
  private damageTaken = 0;

  // O relógio vem de fora para esta classe não depender do Phaser e para a cena escolher
  // qual relógio vale como tempo de partida.
  constructor(private readonly now: () => number) {
    this.startTime = now();
  }

  recordWitchKill(): void {
    this.witchesKilled += 1;
  }

  recordInnocentKill(): void {
    this.innocentsKilled += 1;
  }

  recordDamage(amount: number): void {
    this.damageTaken += amount;
  }

  getElapsedMs(): number {
    return this.now() - this.startTime;
  }

  // Formato aceito por estimateScore e, depois, pelo envio à API.
  getCounters(): MatchCounters {
    return {
      witchesKilled: this.witchesKilled,
      innocentsKilled: this.innocentsKilled,
      damageTaken: this.damageTaken,
      durationMs: this.getElapsedMs(),
    };
  }
}
