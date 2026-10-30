import {
  BOSS_DAMAGE,
  BOSS_MAX_HEALTH,
  INNOCENT_MAX_HEALTH,
  INVINCIBILITY_MS,
  PLAYER_ATTACK_DAMAGE,
  PLAYER_MAX_HEALTH,
  WITCH_ATTACK_DAMAGE,
  WITCH_MAX_HEALTH,
} from '../config/balance';
import type { MatchCounters } from '../domain/score-formula';
import type { MatchResult } from '../types/api';

// Valores de balanceamento que mudam a pontuação: mais vida ou mais dano no jogador deixam a
// partida mais fácil e o placar maior.
function readScoreRelevantBalance(): Record<string, number> {
  return {
    PLAYER_MAX_HEALTH,
    PLAYER_ATTACK_DAMAGE,
    INVINCIBILITY_MS,
    WITCH_MAX_HEALTH,
    WITCH_ATTACK_DAMAGE,
    INNOCENT_MAX_HEALTH,
    BOSS_MAX_HEALTH,
    BOSS_DAMAGE,
  };
}

// Guarda os contadores da partida. O cliente só conta; quem calcula a pontuação oficial é o
// servidor (seção 9.7).
export class ScoreTracker {
  // Cópia congelada no início da partida. No fim, é comparada com os valores atuais para
  // descobrir se o jogador os alterou pelo inspetor (easter egg usedInspector).
  private readonly balanceSnapshot = Object.freeze(readScoreRelevantBalance());
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

  // Arredondado porque o relógio do Phaser tem frações de milissegundo e a API só aceita
  // durationMs inteiro.
  getElapsedMs(): number {
    return Math.round(this.now() - this.startTime);
  }

  // Formato aceito por estimateScore, para o HUD.
  getCounters(): MatchCounters {
    return {
      witchesKilled: this.witchesKilled,
      innocentsKilled: this.innocentsKilled,
      damageTaken: this.damageTaken,
      durationMs: this.getElapsedMs(),
    };
  }

  // Fecha a partida: contadores mais a flag do easter egg, prontos para o envio à API.
  getFinalResult(): MatchResult {
    return { ...this.getCounters(), usedInspector: this.balanceChanged() };
  }

  private balanceChanged(): boolean {
    const current = readScoreRelevantBalance();
    return Object.entries(this.balanceSnapshot).some(([key, value]) => current[key] !== value);
  }
}
