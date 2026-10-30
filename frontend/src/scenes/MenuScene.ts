import Phaser from 'phaser';
import { GothicButton } from '../ui/components/GothicButton';
import { addFogLayers } from '../ui/effects/FogLayer';
import { addVignette } from '../ui/effects/Vignette';
import { COLORS, FONTS, FONT_SIZES, LAYOUT, SPACING, TIMING_MS, cssColor } from '../ui/theme';
import { SCENE_KEYS } from './scene-keys';

const GAME_TITLE = 'Caçadores de Bruxas';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.menu);
  }

  create(): void {
    addVignette(this);
    const { width, height } = this.scale;
    const centerX = width / 2;
    const { titleYRatio, firstButtonYRatio, buttonGap } = LAYOUT.menu;

    addFogLayers(this);
    this.add
      .text(centerX, height * titleYRatio, GAME_TITLE, {
        fontFamily: FONTS.title,
        fontSize: FONT_SIZES.title,
        fontStyle: 'bold',
        color: cssColor(COLORS.accent),
      })
      .setOrigin(0.5)
      .setShadow(0, SPACING.xs, cssColor(COLORS.danger), SPACING.sm);

    const firstButtonY = height * firstButtonYRatio;
    new GothicButton(this, {
      x: centerX,
      y: firstButtonY,
      label: 'Iniciar',
      onClick: () => this.scene.start(SCENE_KEYS.level),
    });
    new GothicButton(this, {
      x: centerX,
      y: firstButtonY + buttonGap,
      label: 'Ranking',
      onClick: () => this.scene.start(SCENE_KEYS.ranking),
    });

    this.cameras.main.fadeIn(TIMING_MS.slow);
  }
}
