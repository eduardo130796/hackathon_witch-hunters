import Phaser from 'phaser';
import { NARRATIVE_TRIGGER_WIDTH } from '../config/balance';
import type { NarrativeTrigger } from '../levels/narrative-01';
import type { DialogueBox } from '../ui/components/DialogueBox';

interface PlacedTrigger {
  trigger: NarrativeTrigger;
  // Só nos gatilhos com x; os outros são pedidos por requestTrigger.
  zone?: Phaser.GameObjects.Zone;
  requested: boolean;
  fired: boolean;
}

interface NarrativeDependencies {
  scene: Phaser.Scene;
  dialogue: DialogueBox;
  triggers: readonly NarrativeTrigger[];
  // Altura da linha do chão: a zona vai do topo da tela até ela, para valer mesmo se o
  // jogador passar pulando.
  groundY: number;
  // Chamado quando a fala de um gatilho termina (por exemplo, para acordar a bruxa que
  // esperava o fim da provocação).
  onTriggerComplete: (triggerId: string) => void;
}

// Gatilhos de diálogo da fase (levels/narrative-01.ts). Um gatilho com x tem uma zona
// invisível (Phaser.GameObjects.Zone) e dispara quando o jogador entra nela; um sem x dispara
// quando alguém o pede (requestTrigger), por exemplo o personagem que chegou até o jogador.
// Cada fala abre UMA ÚNICA VEZ: a flag fired impede que ela se repita depois de um respawn.
export class NarrativeTriggerSystem {
  private readonly placed: PlacedTrigger[];

  constructor(private readonly deps: NarrativeDependencies) {
    this.placed = deps.triggers.map((trigger) => ({
      trigger,
      zone:
        trigger.x === undefined
          ? undefined
          : deps.scene.add
              .zone(trigger.x, 0, NARRATIVE_TRIGGER_WIDTH, deps.groundY)
              .setOrigin(0.5, 0),
      requested: false,
      fired: false,
    }));
  }

  // Pede a fala de um gatilho. Ela abre no próximo update, ou assim que a fala aberta agora
  // terminar, para duas falas nunca se sobreporem.
  requestTrigger(triggerId: string): void {
    const placed = this.placed.find((candidate) => candidate.trigger.id === triggerId);
    if (placed) {
      placed.requested = true;
    }
  }

  // Chamado a cada quadro. Devolve true enquanto o diálogo bloqueia o jogo, para a cena não
  // atualizar jogador, inimigos nem combate. A sobreposição é testada por retângulos, e não
  // por um collider da física, porque a física fica pausada justamente durante as falas.
  update(playerBounds: Phaser.Geom.Rectangle): boolean {
    const { dialogue } = this.deps;
    if (dialogue.isBlocking()) {
      return true;
    }
    const reached = this.placed.find(
      (placed) => !placed.fired && (placed.requested || this.overlaps(placed, playerBounds)),
    );
    if (!reached) {
      return false;
    }
    reached.fired = true;
    const { id, speaker, lines } = reached.trigger;
    dialogue.show(speaker, lines, () => this.deps.onTriggerComplete(id));
    return true;
  }

  private overlaps(placed: PlacedTrigger, playerBounds: Phaser.Geom.Rectangle): boolean {
    return (
      placed.zone !== undefined &&
      Phaser.Geom.Intersects.RectangleToRectangle(placed.zone.getBounds(), playerBounds)
    );
  }
}
