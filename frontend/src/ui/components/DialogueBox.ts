import Phaser from 'phaser';
import { DIALOGUE_ADVANCE_KEYS } from '../../config/controls';
import { COLORS, DIALOGUE_BOX, FONTS, cssColor } from '../theme';
import { TypewriterText } from './TypewriterText';

// Quem segura a física. É o EffectsSystem, que também controla o hitstop: as duas pausas
// passam pelo mesmo lugar, e uma não retoma a física antes da hora da outra.
interface PhysicsPauser {
  holdPhysics(scene: Phaser.Scene): void;
  releasePhysics(scene: Phaser.Scene): void;
}

const ADVANCE_HINT = 'Espaço, Enter ou clique';

// Painel de fala na base da tela: nome de quem fala, texto com efeito de máquina de escrever
// e um aviso de como avançar. Preso à tela (scrollFactor 0), como o HUD.
//
// Enquanto está aberto, a física fica pausada e as animações param: o jogador não toma dano
// nem cai de uma plataforma enquanto lê, e ninguém anda no lugar ao fundo. A cena também
// deixa de atualizar o jogador e os inimigos (ver isBlocking).
export class DialogueBox {
  private readonly container: Phaser.GameObjects.Container;
  private readonly speakerText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private readonly typewriter: TypewriterText;
  private lines: readonly string[] = [];
  private lineIndex = 0;
  private onComplete?: () => void;
  private open = false;
  private closedOnFrame = -1;
  private openedAt = 0;
  private closedTotalMs = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly pauser: PhysicsPauser,
  ) {
    const { width, height, padding, speakerGap, borderWidth } = DIALOGUE_BOX;
    const left = -width / 2 + padding;
    const top = -height / 2 + padding;
    const background = scene.add
      .rectangle(0, 0, width, height, COLORS.panel)
      .setStrokeStyle(borderWidth, COLORS.panelBorder);
    this.speakerText = scene.add.text(left, top, '', {
      fontFamily: FONTS.title,
      fontSize: DIALOGUE_BOX.speakerFontSize,
      fontStyle: 'bold',
      color: cssColor(COLORS.accent),
    });
    this.bodyText = scene.add.text(left, top + this.speakerText.height + speakerGap, '', {
      fontFamily: FONTS.body,
      fontSize: DIALOGUE_BOX.textFontSize,
      color: cssColor(COLORS.text),
      wordWrap: { width: width - padding * 2 },
    });
    const hint = scene.add
      .text(width / 2 - padding, height / 2 - padding, ADVANCE_HINT, {
        fontFamily: FONTS.body,
        fontSize: DIALOGUE_BOX.hintFontSize,
        color: cssColor(COLORS.textMuted),
      })
      .setOrigin(1, 1);
    const centerY = DIALOGUE_BOX.topMargin + height / 2;
    this.container = scene.add
      .container(scene.scale.width / 2, centerY, [
        background,
        this.speakerText,
        this.bodyText,
        hint,
      ])
      .setScrollFactor(0)
      .setDepth(DIALOGUE_BOX.depth)
      .setVisible(false);
    this.typewriter = new TypewriterText(scene, this.bodyText);
    this.listenForAdvance();
  }

  show(speaker: string, lines: readonly string[], onComplete: () => void): void {
    this.lines = lines;
    this.lineIndex = 0;
    this.onComplete = onComplete;
    this.open = true;
    this.openedAt = this.scene.game.loop.time;
    this.speakerText.setText(speaker);
    this.container.setVisible(true);
    this.pauser.holdPhysics(this.scene);
    this.scene.anims.pauseAll();
    this.typeLine();
  }

  // Verdadeiro enquanto a fala está aberta E no quadro em que ela fechou: a tecla que fechou
  // é lida pelo teclado antes do update da cena, e sem esse quadro extra o mesmo toque viraria
  // um pulo (Espaço) ou um golpe (J).
  isBlocking(): boolean {
    return this.open || this.closedOnFrame === this.scene.game.loop.frame;
  }

  // Tempo total com a fala aberta, inclusive a atual. A partida desconta esse tempo do
  // cronômetro: ler a história não deve custar bônus de tempo.
  getOpenMs(): number {
    const current = this.open ? this.scene.game.loop.time - this.openedAt : 0;
    return this.closedTotalMs + current;
  }

  // Clique ou tecla: se a linha ainda está sendo escrita, mostra-a inteira (quem lê rápido
  // não espera); se já está inteira, passa para a próxima ou fecha depois da última.
  private advance(): void {
    if (!this.open) {
      return;
    }
    if (this.typewriter.isTyping()) {
      this.typewriter.complete();
      return;
    }
    this.lineIndex += 1;
    if (this.lineIndex < this.lines.length) {
      this.typeLine();
      return;
    }
    this.close();
  }

  private typeLine(): void {
    this.typewriter.type(this.lines[this.lineIndex] ?? '');
  }

  private close(): void {
    this.open = false;
    this.closedOnFrame = this.scene.game.loop.frame;
    this.closedTotalMs += this.scene.game.loop.time - this.openedAt;
    this.container.setVisible(false);
    this.scene.anims.resumeAll();
    this.pauser.releasePhysics(this.scene);
    const onComplete = this.onComplete;
    this.onComplete = undefined;
    onComplete?.();
  }

  private listenForAdvance(): void {
    const keyboard = this.scene.input.keyboard;
    const advance = (): void => this.advance();
    const keyEvents = DIALOGUE_ADVANCE_KEYS.map((keyName) => `keydown-${keyName}`);
    for (const eventName of keyEvents) {
      keyboard?.on(eventName, advance);
    }
    this.scene.input.on(Phaser.Input.Events.POINTER_DOWN, advance);
    // A cena é reiniciada a cada partida: sem remover os ouvintes, a próxima teria dois.
    // O gerenciador de animações é do jogo inteiro: se a cena fechar com a fala aberta, as
    // animações das outras cenas não podem ficar paradas.
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.open) {
        this.scene.anims.resumeAll();
      }
      for (const eventName of keyEvents) {
        keyboard?.off(eventName, advance);
      }
      this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, advance);
    });
  }
}
