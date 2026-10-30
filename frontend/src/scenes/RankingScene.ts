import Phaser from 'phaser';
import { GothicButton } from '../ui/components/GothicButton';
import { addVignette } from '../ui/effects/Vignette';
import { COLORS, FONTS, FONT_SIZES, LAYOUT, SPACING, cssColor } from '../ui/theme';
import { SCENE_KEYS } from './scene-keys';

// Tela provisória: a lista vinda de /api/ranking entra na etapa do ranking funcional.
export class RankingScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.ranking);
  }

  create(): void {
    addVignette(this);
    const { width, height } = this.scale;
    const centerX = width / 2;
    const { titleYRatio, messageYRatio, backButtonYRatio } = LAYOUT.ranking;

    this.add
      .text(centerX, height * titleYRatio, 'Ranking', {
        fontFamily: FONTS.title,
        fontSize: FONT_SIZES.heading,
        fontStyle: 'bold',
        color: cssColor(COLORS.accent),
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, height * messageYRatio, 'Em breve: os maiores caçadores do mundo.', {
        fontFamily: FONTS.body,
        fontSize: FONT_SIZES.body,
        color: cssColor(COLORS.textMuted),
      })
      .setOrigin(0.5)
      .setPadding(SPACING.sm);

    new GothicButton(this, {
      x: centerX,
      y: height * backButtonYRatio,
      label: 'Voltar',
      onClick: () => this.scene.start(SCENE_KEYS.menu),
    });
  }
}
