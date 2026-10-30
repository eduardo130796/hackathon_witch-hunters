import Phaser from 'phaser';
import { getAudioSystem } from '../systems/AudioSystem';
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

    // A trilha do menu continua tocando no ranking (playMenuTheme ignora a trilha atual) e só
    // dá lugar à da fase quando a partida começa, com fade feito pela própria fase: um fade
    // iniciado aqui seria cortado no meio, porque o menu é encerrado logo após o clique.
    const audio = getAudioSystem(this.game);
    audio.playMenuTheme(this);
    audio.bindMuteKey(this);
    // O clique toca antes da troca de cena; sem o arquivo de clique, nada acontece.
    const goTo = (sceneKey: string) => (): void => {
      audio.playClick();
      this.scene.start(sceneKey);
    };

    const firstButtonY = height * firstButtonYRatio;
    new GothicButton(this, {
      x: centerX,
      y: firstButtonY,
      label: 'Iniciar',
      onClick: goTo(SCENE_KEYS.level),
    });
    new GothicButton(this, {
      x: centerX,
      y: firstButtonY + buttonGap,
      label: 'Ranking',
      onClick: goTo(SCENE_KEYS.ranking),
    });

    this.cameras.main.fadeIn(TIMING_MS.slow);
  }
}
