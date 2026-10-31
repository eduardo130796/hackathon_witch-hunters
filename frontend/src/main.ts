import Phaser from 'phaser';
import { gameConfig } from './config/game-config';
import { BootScene } from './scenes/BootScene';
import { HowToPlayScene } from './scenes/HowToPlayScene';
import { LevelScene } from './scenes/LevelScene';
import { MenuScene } from './scenes/MenuScene';
import { RankingScene } from './scenes/RankingScene';
import { ResultScene } from './scenes/ResultScene';
import { StoryScene } from './scenes/StoryScene';
import { COLORS, cssColor } from './ui/theme';

// A página usa a mesma cor do jogo, para as faixas ao redor do canvas (Scale.FIT) não destoarem.
document.body.style.backgroundColor = cssColor(COLORS.background);

// BootScene vem primeiro: o Phaser inicia automaticamente a primeira cena da lista.
new Phaser.Game({
  ...gameConfig,
  scene: [BootScene, MenuScene, StoryScene, HowToPlayScene, LevelScene, ResultScene, RankingScene],
});
