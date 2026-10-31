import { APPROACH_MAX_DURATION_MS } from '../config/balance';

// Trava do jogador enquanto um personagem vem ao encontro dele para uma fala (a Anciã, a
// bruxa da provocação). Começa quando o personagem começa a andar e termina quando ele chega
// (a fala assume o bloqueio dali em diante) ou, como garantia, depois de
// APPROACH_MAX_DURATION_MS: o controle sempre volta, mesmo se o personagem não chegar.
export class ApproachLockSystem {
  private lockedUntil = 0;

  // Relógio da cena em ms, recebido pronto para este sistema não depender do Phaser.
  constructor(private readonly now: () => number) {}

  begin(): void {
    this.lockedUntil = this.now() + APPROACH_MAX_DURATION_MS;
  }

  release(): void {
    this.lockedUntil = 0;
  }

  isLocked(): boolean {
    return this.now() < this.lockedUntil;
  }
}
