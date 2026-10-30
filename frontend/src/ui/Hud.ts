import Phaser from 'phaser';
import { PLAYER_MAX_HEALTH } from '../config/balance';
import { estimateScore, type MatchCounters } from '../domain/score-formula';
import { formatElapsed } from '../domain/time-format';
import { COLORS, FONTS, FONT_SIZES, LAYOUT, SPACING, cssColor } from './theme';

const { candle } = LAYOUT.hud;

// HUD da fase: vida em velas, pontuação estimada e tempo. É um componente desenhado dentro
// da LevelScene, e não uma cena sobreposta: com uma única cena de jogo, não há troca de
// dados entre cenas, e setScrollFactor(0) já o mantém fixo na tela quando a câmera andar.
// A fonte "Press Start 2P" tem largura fixa por caractere, então os números não tremem.
export class Hud {
  private readonly candles: Phaser.GameObjects.Graphics;
  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly timeText: Phaser.GameObjects.Text;
  // Evita redesenhar as velas a cada quadro quando a vida não mudou.
  private shownHealth = -1;

  constructor(scene: Phaser.Scene) {
    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: FONTS.hud,
      fontSize: FONT_SIZES.hud,
      color: cssColor(COLORS.text),
    };
    const candlesBottom = SPACING.md + candle.flameHeight + candle.height;

    this.candles = scene.add.graphics();
    this.scoreText = scene.add.text(SPACING.md, candlesBottom + SPACING.md, '', textStyle);
    this.timeText = scene.add
      .text(scene.scale.width - SPACING.md, SPACING.md, '', textStyle)
      .setOrigin(1, 0);

    for (const element of [this.candles, this.scoreText, this.timeText]) {
      element.setScrollFactor(0).setDepth(LAYOUT.hud.depth);
    }
  }

  render(health: number, counters: MatchCounters): void {
    if (health !== this.shownHealth) {
      this.drawCandles(health);
      this.shownHealth = health;
    }
    const score = String(estimateScore(counters)).padStart(LAYOUT.hud.scoreDigits, '0');
    this.scoreText.setText(`PONTOS ${score}`);
    this.timeText.setText(`TEMPO ${formatElapsed(counters.durationMs)}`);
  }

  // Uma vela por ponto de vida máxima: acesa (com chama) enquanto a vida existe, apagada
  // depois. Assim o jogador vê quanto perdeu, e não só quanto resta.
  private drawCandles(health: number): void {
    this.candles.clear();
    const flameOffsetX = (candle.width - candle.flameWidth) / 2;
    for (let index = 0; index < PLAYER_MAX_HEALTH; index += 1) {
      const x = SPACING.md + index * (candle.width + candle.gap);
      const bodyY = SPACING.md + candle.flameHeight;
      const lit = index < health;
      this.candles.fillStyle(lit ? COLORS.text : COLORS.textMuted);
      this.candles.fillRect(x, bodyY, candle.width, candle.height);
      if (lit) {
        this.candles.fillStyle(COLORS.accent);
        this.candles.fillRect(x + flameOffsetX, SPACING.md, candle.flameWidth, candle.flameHeight);
      }
    }
  }
}
