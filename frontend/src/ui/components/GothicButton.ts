import Phaser from 'phaser';
import { COLORS, FONTS, FONT_SIZES, LAYOUT, TIMING_MS, cssColor } from '../theme';

const { width, height, borderWidth, hoverScale, disabledAlpha } = LAYOUT.button;

interface GothicButtonOptions {
  x: number;
  y: number;
  label: string;
  onClick: () => void;
}

export class GothicButton extends Phaser.GameObjects.Container {
  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, options: GothicButtonOptions) {
    super(scene, options.x, options.y);

    this.background = scene.add
      .rectangle(0, 0, width, height, COLORS.panel)
      .setStrokeStyle(borderWidth, COLORS.panelBorder);
    this.label = scene.add
      .text(0, 0, options.label, {
        fontFamily: FONTS.body,
        fontSize: FONT_SIZES.button,
        color: cssColor(COLORS.text),
      })
      .setOrigin(0.5);
    this.add([this.background, this.label]);

    // Container não tem tamanho próprio; sem setSize o clique não teria área para acertar.
    this.setSize(width, height);
    this.setInteractive({ useHandCursor: true });
    this.on(Phaser.Input.Events.POINTER_OVER, () => this.highlight());
    this.on(Phaser.Input.Events.POINTER_OUT, () => this.removeHighlight());
    this.on(Phaser.Input.Events.POINTER_DOWN, options.onClick);

    scene.add.existing(this);
  }

  setLabel(text: string): this {
    this.label.setText(text);
    return this;
  }

  // Desabilitar tira o clique de verdade (não só a aparência), para uma requisição em
  // andamento não ser disparada duas vezes.
  setEnabled(enabled: boolean): this {
    if (enabled) {
      this.setInteractive({ useHandCursor: true });
    } else {
      this.disableInteractive();
      this.removeHighlight();
    }
    return this.setAlpha(enabled ? 1 : disabledAlpha);
  }

  private highlight(): void {
    this.background.setStrokeStyle(borderWidth, COLORS.accent);
    this.scaleTo(hoverScale);
  }

  private removeHighlight(): void {
    this.background.setStrokeStyle(borderWidth, COLORS.panelBorder);
    this.scaleTo(1);
  }

  private scaleTo(scale: number): void {
    this.scene.tweens.add({ targets: this, scale, duration: TIMING_MS.fast });
  }
}
