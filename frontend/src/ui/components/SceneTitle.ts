import Phaser from 'phaser';
import { COLORS, FONTS, FONT_SIZES, cssColor } from '../theme';

// Título de tela secundária (resultado, ranking): mesmo estilo em todas, centralizado.
export function addSceneTitle(scene: Phaser.Scene, text: string, yRatio: number): void {
  scene.add
    .text(scene.scale.width / 2, scene.scale.height * yRatio, text, {
      fontFamily: FONTS.title,
      fontSize: FONT_SIZES.heading,
      fontStyle: 'bold',
      color: cssColor(COLORS.accent),
    })
    .setOrigin(0.5);
}
