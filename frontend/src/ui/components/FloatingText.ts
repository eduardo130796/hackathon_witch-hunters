import Phaser from 'phaser';
import { COLORS, FONTS, FONT_SIZES, LAYOUT, SPACING, TIMING_MS, cssColor } from '../theme';

// announcement: aviso para ler com calma ("Ponto de controle"), com a fonte de títulos.
// score: pontos que saltam do inimigo morto, na fonte do HUD para o jogador ligar o número ao
// placar; sobem quase na hora, porque a luta continua e o texto não pode ficar no caminho.
type FloatingTextVariant = 'announcement' | 'score';

const VARIANT_STYLES = {
  announcement: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.button,
    fontStyle: 'bold',
    strokeThickness: 0,
    holdMs: TIMING_MS.slow,
  },
  // O contorno na cor do fundo separa o número do sangue e dos personagens atrás dele.
  score: {
    fontFamily: FONTS.hud,
    fontSize: FONT_SIZES.floatingScore,
    fontStyle: 'normal',
    strokeThickness: SPACING.xs,
    holdMs: TIMING_MS.fast,
  },
} as const;

interface FloatingTextConfig {
  x: number;
  y: number;
  text: string;
  color: number;
  // Sem variante, vale o aviso: quem já chamava esta função continua com o mesmo visual.
  variant?: FloatingTextVariant;
}

// Texto curto no mundo do jogo: aparece, fica um instante para ser lido e depois sobe
// sumindo. Destrói a si mesmo, então a cena não precisa guardá-lo.
export function showFloatingText(scene: Phaser.Scene, config: FloatingTextConfig): void {
  const style = VARIANT_STYLES[config.variant ?? 'announcement'];
  const label = scene.add
    .text(config.x, config.y, config.text, {
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontStyle: style.fontStyle,
      color: cssColor(config.color),
      stroke: cssColor(COLORS.background),
      strokeThickness: style.strokeThickness,
    })
    .setOrigin(0.5, 1)
    .setDepth(LAYOUT.hud.depth);
  scene.tweens.add({
    targets: label,
    y: config.y - LAYOUT.level.floatingTextRise,
    alpha: 0,
    delay: style.holdMs,
    duration: TIMING_MS.slow,
    onComplete: () => label.destroy(),
  });
}
