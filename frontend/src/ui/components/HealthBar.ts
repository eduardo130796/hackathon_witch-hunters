import Phaser from 'phaser';
import { COLORS, FONTS, FONT_SIZES, LAYOUT, TIMING_MS, cssColor } from '../theme';

const { bossBar } = LAYOUT;

// Barra de vida fixa no topo da tela, com nome: fundo escuro e preenchimento que encolhe da
// direita para a esquerda conforme a vida cai. Começa escondida; a cena a mostra quando a
// luta começa, para a barra não ocupar a tela antes da hora.
export class HealthBar {
  private readonly container: Phaser.GameObjects.Container;
  private readonly fill: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, label: string) {
    const left = -bossBar.width / 2;
    const background = scene.add
      .rectangle(0, 0, bossBar.width, bossBar.height, COLORS.panel)
      .setStrokeStyle(bossBar.borderWidth, COLORS.panelBorder);
    // Origem na borda esquerda: escalar a largura encolhe a barra em direção a ela.
    this.fill = scene.add
      .rectangle(left, 0, bossBar.width, bossBar.height, COLORS.danger)
      .setOrigin(0, 0.5);
    const title = scene.add
      .text(0, -bossBar.height / 2 - bossBar.labelGap, label, {
        fontFamily: FONTS.title,
        fontSize: FONT_SIZES.body,
        fontStyle: 'bold',
        color: cssColor(COLORS.text),
      })
      .setOrigin(0.5, 1);

    // scrollFactor 0 prende a barra à tela quando a câmera segue o jogador, como o HUD.
    this.container = scene.add
      .container(scene.scale.width / 2, bossBar.topY + bossBar.height, [
        background,
        this.fill,
        title,
      ])
      .setScrollFactor(0)
      .setDepth(LAYOUT.hud.depth)
      .setAlpha(0)
      .setVisible(false);
  }

  show(): void {
    if (this.container.visible) {
      return;
    }
    this.container.setVisible(true);
    this.container.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: TIMING_MS.normal,
    });
  }

  // ratio de 0 a 1; valores fora disso são presos ao intervalo para a barra nunca vazar.
  setRatio(ratio: number): void {
    this.fill.scaleX = Phaser.Math.Clamp(ratio, 0, 1);
  }
}
