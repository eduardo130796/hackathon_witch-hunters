import Phaser from 'phaser';
import { VICTORY_POSE_MS } from '../config/balance';
import type { Player } from '../entities/Player';
import type { NarrativeTrigger } from '../levels/narrative-01';
import type { DialogueBox } from '../ui/components/DialogueBox';
import { COLORS, TIMING_MS } from '../ui/theme';

interface VictorySequenceDependencies {
  scene: Phaser.Scene;
  player: Player;
  dialogue: DialogueBox;
  epilogue: NarrativeTrigger;
  // Aviso para quem reage sem mudar o andamento (o som de vitória). Callback, e não o
  // AudioSystem, pelo mesmo motivo do LevelFlowSystem: este sistema não sabe que há áudio.
  onStart?: () => void;
}

// Encerramento da vitória, entre a queda do demônio e a tela de resultado:
// 1. o cavaleiro para e toca a animação de vitória (Player.freeze);
// 2. depois de VICTORY_POSE_MS, o epílogo abre no mesmo painel das outras falas;
// 3. ao fechar a fala, a câmera escurece e só então onDone leva à tela de resultado.
// Quem chama é o LevelFlowSystem, que já congelou o placar; a cena para jogador e combate
// assim que a partida termina, então a entrada fica travada durante toda a sequência.
export class VictorySequenceSystem {
  private started = false;

  constructor(private readonly deps: VictorySequenceDependencies) {}

  // A trava started garante uma sequência só, mesmo se pedida duas vezes.
  play(onDone: () => void): void {
    if (this.started) {
      return;
    }
    this.started = true;
    const { scene, player, dialogue, epilogue } = this.deps;
    player.freeze();
    this.deps.onStart?.();
    scene.time.delayedCall(VICTORY_POSE_MS, () => {
      dialogue.show(epilogue.speaker, epilogue.lines, () => this.fadeOut(onDone));
    });
  }

  // Escurece até a cor de fundo do jogo, a mesma da tela de resultado, para a troca de cena
  // parecer contínua em vez de um corte seco.
  private fadeOut(onDone: () => void): void {
    const camera = this.deps.scene.cameras.main;
    const { r, g, b } = Phaser.Display.Color.IntegerToRGB(COLORS.background);
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, onDone);
    camera.fadeOut(TIMING_MS.slow, r, g, b);
  }
}
