import Phaser from 'phaser';
import { COLORS, FONTS, LOCATION_TITLE, cssColor } from '../theme';

// Cartão gótico com o nome do lugar: linha fina, nome em FONTS.title, subtítulo e outra
// linha. Preso à tela (scrollFactor 0) e invisível até show(). Um cartão por cena, reusado a
// cada trecho novo, para nunca haver dois títulos empilhados.
export class LocationTitle {
  private readonly container: Phaser.GameObjects.Container;
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly subtitleText: Phaser.GameObjects.Text;

  constructor(private readonly scene: Phaser.Scene) {
    const { lineWidth, lineThickness, gap } = LOCATION_TITLE;
    this.nameText = this.createText(LOCATION_TITLE.nameFontSize, COLORS.text, FONTS.title);
    // Subtítulo na cor do texto principal e com contorno escuro: o cinza (textMuted) tinha
    // pouco contraste sobre o céu vermelho do trecho final.
    this.subtitleText = this.createText(
      LOCATION_TITLE.subtitleFontSize,
      COLORS.text,
      FONTS.body,
    ).setStroke(cssColor(COLORS.background), LOCATION_TITLE.subtitleStrokeThickness);
    // Posições relativas ao centro do cartão; as do texto são ajustadas em layout().
    const topLine = scene.add.rectangle(0, 0, lineWidth, lineThickness, COLORS.panelBorder);
    const bottomLine = scene.add.rectangle(0, 0, lineWidth, lineThickness, COLORS.panelBorder);
    this.container = scene.add
      .container(scene.scale.width / 2, LOCATION_TITLE.centerY, [
        topLine,
        this.nameText,
        this.subtitleText,
        bottomLine,
      ])
      .setScrollFactor(0)
      .setDepth(LOCATION_TITLE.depth)
      .setAlpha(0);
    this.layout(topLine, bottomLine, gap);
  }

  // Mostra o cartão: espera, aparece subindo, fica e some. Um show() no meio de outro
  // recomeça do zero, sem tweens acumulados nem cartão meio transparente parado na tela.
  show(name: string, subtitle: string): void {
    this.nameText.setText(name);
    this.subtitleText.setText(subtitle);
    this.scene.tweens.killTweensOf(this.container);
    this.container.setAlpha(0).setY(LOCATION_TITLE.centerY + LOCATION_TITLE.rise);
    // Um único tween com yoyo: hold é a pausa no topo antes de voltar. Assim killTweensOf
    // basta para cancelar tudo, sem uma segunda etapa agendada que escapasse do cancelamento.
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      y: LOCATION_TITLE.centerY,
      delay: LOCATION_TITLE.enterDelayMs,
      duration: LOCATION_TITLE.fadeMs,
      hold: LOCATION_TITLE.holdMs,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
  }

  // Esconde na hora, para um cenário de tela cheia (a arena do demônio) não abrir com o nome
  // de outro lugar ainda na tela.
  hide(): void {
    this.scene.tweens.killTweensOf(this.container);
    this.container.setAlpha(0);
  }

  private createText(fontSize: string, color: number, fontFamily: string): Phaser.GameObjects.Text {
    return (
      this.scene.add
        .text(0, 0, '', { fontFamily, fontSize, color: cssColor(color) })
        .setOrigin(0.5)
        // Sombra escura: o nome continua legível sobre partes claras da arte (lua, fogo).
        .setShadow(0, 0, cssColor(COLORS.background), LOCATION_TITLE.shadowBlur, true, true)
    );
  }

  // Empilha linha, nome, subtítulo e linha em torno do centro do cartão. A altura do texto
  // vem do próprio objeto, que já usa a fonte certa (a BootScene espera as fontes carregarem).
  private layout(
    topLine: Phaser.GameObjects.Rectangle,
    bottomLine: Phaser.GameObjects.Rectangle,
    gap: number,
  ): void {
    this.nameText.setText(' ');
    this.subtitleText.setText(' ');
    const nameHeight = this.nameText.height;
    const subtitleHeight = this.subtitleText.height;
    const totalHeight = nameHeight + gap + subtitleHeight;
    const top = -totalHeight / 2;
    this.nameText.setY(top + nameHeight / 2);
    this.subtitleText.setY(top + nameHeight + gap + subtitleHeight / 2);
    topLine.setY(top - gap);
    bottomLine.setY(top + totalHeight + gap);
  }
}
