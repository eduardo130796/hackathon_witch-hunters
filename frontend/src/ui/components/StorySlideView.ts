import Phaser from 'phaser';
import type { StorySlide } from '../../levels/story-01';
import { addFogLayers } from '../effects/FogLayer';
import { COLORS, FONTS, FONT_SIZES, SPACING, STORY_LAYOUT, TIMING_MS, cssColor } from '../theme';
import { TypewriterText } from './TypewriterText';

// Um slide da abertura: cenário esmaecido ao fundo, névoa, título e texto em máquina de
// escrever. Separado da StoryScene para a cena cuidar só do fluxo (avançar, pular, sair).
export class StorySlideView {
  private readonly background: Phaser.GameObjects.Image;
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private readonly typewriter: TypewriterText;

  // O fundo vem antes da névoa e o texto depois: a névoa passa entre o cenário e as letras.
  // Tudo começa transparente, para o primeiro slide também entrar com fade.
  constructor(private readonly scene: Phaser.Scene) {
    const { width, height } = scene.scale;
    this.background = scene.add.image(width / 2, height / 2, '__DEFAULT').setAlpha(0);
    addFogLayers(scene);
    this.titleText = scene.add
      .text(width / 2, height * STORY_LAYOUT.titleYRatio, '', {
        fontFamily: FONTS.title,
        fontSize: FONT_SIZES.heading,
        fontStyle: 'bold',
        color: cssColor(COLORS.accent),
      })
      .setOrigin(0.5)
      .setShadow(0, SPACING.xs, cssColor(COLORS.danger), SPACING.sm)
      .setAlpha(0);
    this.bodyText = scene.add
      .text(width / 2, height * STORY_LAYOUT.textTopYRatio, '', {
        fontFamily: FONTS.body,
        fontSize: STORY_LAYOUT.textFontSize,
        color: cssColor(COLORS.text),
        align: 'center',
        lineSpacing: STORY_LAYOUT.lineSpacing,
        wordWrap: { width: STORY_LAYOUT.textWidth },
      })
      .setOrigin(0.5, 0)
      .setAlpha(0);
    this.typewriter = new TypewriterText(scene, this.bodyText);
  }

  show(slide: StorySlide): void {
    this.showBackground(slide.backgroundKey);
    this.titleText.setText(slide.title);
    this.typewriter.type(slide.text);
    this.fade(true);
  }

  hide(onComplete: () => void): void {
    this.fade(false, onComplete);
  }

  isTyping(): boolean {
    return this.typewriter.isTyping();
  }

  completeTyping(): void {
    this.typewriter.complete();
  }

  // Sem a arte (arquivo faltando), o slide fica só com o fundo escuro e a névoa.
  private showBackground(textureKey: string): void {
    if (!this.scene.textures.exists(textureKey)) {
      this.background.setVisible(false);
      return;
    }
    const { width, height } = this.scene.scale;
    this.background.setTexture(textureKey).setVisible(true);
    // Cobre a tela inteira sem distorcer: a escala maior entre as duas direções vence.
    const coverScale = Math.max(width / this.background.width, height / this.background.height);
    this.background.setScale(coverScale);
  }

  private fade(visible: boolean, onComplete?: () => void): void {
    const duration = TIMING_MS.normal;
    const texts = [this.titleText, this.bodyText];
    this.scene.tweens.add({ targets: texts, alpha: visible ? 1 : 0, duration });
    const backgroundAlpha = visible ? STORY_LAYOUT.backgroundAlpha : 0;
    this.scene.tweens.add({
      targets: this.background,
      alpha: backgroundAlpha,
      duration,
      onComplete,
    });
  }
}
