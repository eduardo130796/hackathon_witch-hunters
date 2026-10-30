import Phaser from 'phaser';
import { COLORS } from '../ui/theme';
import { GRAVITY_Y } from './balance';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const GAME_CONTAINER_ID = 'game';

// As cenas ficam de fora: main.ts as registra, para que config não dependa de scenes.
export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: GAME_CONTAINER_ID,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.background,
  // Sem suavização ao ampliar: mantém a arte em pixel nítida em qualquer tamanho de tela.
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: GRAVITY_Y },
    },
  },
};
