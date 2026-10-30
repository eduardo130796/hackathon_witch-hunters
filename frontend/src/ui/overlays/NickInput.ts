import Phaser from 'phaser';
import { NICKNAME_MAX_LENGTH } from '../../domain/nickname';
import { COLORS, FONTS, LAYOUT, cssColor } from '../theme';

const { width, height, fontSizePx, borderWidth } = LAYOUT.nicknameInput;

interface NickInputOptions {
  // Centro do campo, em coordenadas do jogo (1280×720).
  x: number;
  y: number;
  onSubmit: () => void;
}

// Campo de texto HTML posicionado sobre o canvas (seção 9.9). O Phaser não tem campo de texto
// próprio, e um <input> de verdade abre o teclado do celular, aceita colar e acentos.
export class NickInput {
  private readonly element: HTMLInputElement;
  private readonly reposition = (): void => this.position();
  private destroyed = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: NickInputOptions,
  ) {
    this.element = this.createElement();
    document.body.append(this.element);
    this.position();

    // O canvas muda de tamanho com a janela (Scale.FIT); o campo acompanha.
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.reposition);
    window.addEventListener('resize', this.reposition);
    // A fase registra teclas como A, D, W, J e espaço com captura, e o Phaser bloqueia essas
    // teclas na página inteira. Sem desligar a captura, essas letras não chegariam ao campo.
    scene.input.keyboard?.disableGlobalCapture();
    // O elemento vive fora do canvas: sem isto, ele ficaria na página depois da troca de cena.
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());

    this.element.focus();
  }

  get value(): string {
    return this.element.value;
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.element.remove();
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.reposition);
    window.removeEventListener('resize', this.reposition);
    this.scene.input.keyboard?.enableGlobalCapture();
  }

  private createElement(): HTMLInputElement {
    const element = document.createElement('input');
    element.type = 'text';
    element.maxLength = NICKNAME_MAX_LENGTH;
    element.autocomplete = 'off';
    element.spellcheck = false;
    element.enterKeyHint = 'done';
    element.placeholder = 'Seu nick';
    element.setAttribute('aria-label', 'Nick para o ranking');
    Object.assign(element.style, {
      position: 'fixed',
      boxSizing: 'border-box',
      margin: '0',
      padding: '0',
      textAlign: 'center',
      outline: 'none',
      fontFamily: FONTS.body,
      color: cssColor(COLORS.text),
      background: cssColor(COLORS.panel),
      borderStyle: 'solid',
      borderColor: cssColor(COLORS.panelBorder),
    });
    // Borda de destaque ao focar, a mesma cor do botão sob o mouse.
    element.addEventListener('focus', () => {
      element.style.borderColor = cssColor(COLORS.accent);
    });
    element.addEventListener('blur', () => {
      element.style.borderColor = cssColor(COLORS.panelBorder);
    });
    element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        this.options.onSubmit();
      }
    });
    return element;
  }

  // Converte as coordenadas do jogo em pixels da página, usando o tamanho real do canvas na tela.
  private position(): void {
    const canvasBounds = this.scene.game.canvas.getBoundingClientRect();
    const scale = canvasBounds.width / this.scene.scale.width;
    Object.assign(this.element.style, {
      left: `${canvasBounds.left + (this.options.x - width / 2) * scale}px`,
      top: `${canvasBounds.top + (this.options.y - height / 2) * scale}px`,
      width: `${width * scale}px`,
      height: `${height * scale}px`,
      fontSize: `${fontSizePx * scale}px`,
      borderWidth: `${borderWidth * scale}px`,
    });
  }
}
