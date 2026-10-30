import type { Innocent } from '../entities/Innocent';
import type { Player } from '../entities/Player';
import type { Witch } from '../entities/Witch';
import type { AudioSystem } from './AudioSystem';

type EntityState = Player['state'];

// Liga o que acontece na fase aos sons, observando as entidades a cada quadro: compara o estado
// e o número do golpe de agora com os do quadro anterior. Assim as entidades não precisam
// conhecer o áudio, e as trocas de estado continuam num único lugar (o setState de cada uma).
export class AudioCueSystem {
  private playerState: EntityState;
  private playerSwingId: number;
  private readonly witchSwingIds = new Map<Witch, number>();
  private readonly livingEnemies = new Set<Witch | Innocent>();

  constructor(
    private readonly audio: AudioSystem,
    private readonly player: Player,
    private readonly witches: readonly Witch[],
    innocents: readonly Innocent[],
  ) {
    this.playerState = player.state;
    this.playerSwingId = player.swingId;
    for (const witch of witches) {
      this.witchSwingIds.set(witch, witch.swingId);
    }
    for (const enemy of [...witches, ...innocents]) {
      this.livingEnemies.add(enemy);
    }
  }

  // Chamado a cada quadro, depois do combate e do andamento da partida.
  update(): void {
    this.updatePlayerSounds();
    this.updateWitchAttacks();
    this.updateEnemyDeaths();
  }

  // O som do golpe segue o número do golpe, e não a entrada no estado 'attack': golpes
  // encadeados podem começar sem o estado sair de 'attack', e cada um precisa do seu som.
  private updatePlayerSounds(): void {
    const { swingId, state } = this.player;
    if (swingId !== this.playerSwingId) {
      this.playerSwingId = swingId;
      this.audio.playAttack();
    }
    if (state === this.playerState) {
      return;
    }
    const previous = this.playerState;
    this.playerState = state;
    if (previous === 'walk') {
      this.audio.stopFootsteps();
    }
    if (state === 'walk') {
      this.audio.startFootsteps();
    } else if (state === 'hurt') {
      this.audio.playHurt();
    } else if (state === 'death') {
      this.audio.stopFootsteps();
      this.audio.playDeath();
    }
  }

  // Mesmo critério do jogador: um golpe novo da bruxa (o chefe incluído) toca o som mágico.
  private updateWitchAttacks(): void {
    for (const witch of this.witches) {
      if (witch.swingId !== this.witchSwingIds.get(witch)) {
        this.witchSwingIds.set(witch, witch.swingId);
        this.audio.playAttackMagic();
      }
    }
  }

  // A pontuação só sobe ao matar uma bruxa: matar um inocente tira pontos, então ele leva só
  // o som de morte.
  private updateEnemyDeaths(): void {
    for (const enemy of this.livingEnemies) {
      if (enemy.isAlive()) {
        continue;
      }
      this.livingEnemies.delete(enemy);
      this.audio.playEnemyDeath();
      if (this.witches.some((witch) => witch === enemy)) {
        this.audio.playScoreUp();
      }
    }
  }
}
