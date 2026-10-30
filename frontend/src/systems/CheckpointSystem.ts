import type { Player } from '../entities/Player';

// Ponto onde o jogador reaparece: a posição da bandeira, e não a do jogador ao tocá-la, para
// ele nunca renascer no ar ou dentro de um inimigo.
interface SpawnPoint {
  x: number;
  y: number;
}

interface SavedCheckpoint {
  spawn: SpawnPoint;
  health: number;
}

// Guarda o último ponto de controle e devolve o jogador a ele depois de uma morte.
//
// Os contadores de pontuação ficam de fora de propósito: o respawn não volta inocentes
// mortos nem dano sofrido. Se voltasse, morrer viraria um jeito de apagar erros e "farmar"
// pontos, e a pontuação final deixaria de contar tudo o que aconteceu na partida. Como nada
// é restaurado, também não há cópia dos contadores para guardar.
export class CheckpointSystem {
  private readonly activatedIds = new Set<string>();
  private saved: SavedCheckpoint;

  // O início da fase funciona como ponto de controle zero: quem morre antes da primeira
  // bandeira volta ao começo com a vida inicial.
  constructor(start: SpawnPoint, startHealth: number) {
    this.saved = { spawn: start, health: startHealth };
  }

  isActivated(checkpointId: string): boolean {
    return this.activatedIds.has(checkpointId);
  }

  // Cada bandeira vale uma vez: voltar a ela depois não sobrescreve a vida guardada.
  activate(checkpointId: string, spawn: SpawnPoint, player: Player): void {
    if (this.isActivated(checkpointId)) {
      return;
    }
    this.activatedIds.add(checkpointId);
    this.saved = { spawn, health: player.getHealth() };
  }

  respawn(player: Player): void {
    const { spawn, health } = this.saved;
    player.respawnAt(spawn.x, spawn.y, health);
  }
}
