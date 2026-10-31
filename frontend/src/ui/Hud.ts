import Phaser from 'phaser';
import { PLAYER_MAX_HEALTH } from '../config/balance';
import { actionPoints, scoreBreakdown, type MatchCounters } from '../domain/score-formula';
import { formatElapsed } from '../domain/time-format';
import { COLORS, FONTS, FONT_SIZES, LAYOUT, SPACING, cssColor } from './theme';

const { candle } = LAYOUT.hud;

// HUD da fase: vida em velas, pontos, bônus de tempo e tempo. É um componente desenhado dentro
// da LevelScene, e não uma cena sobreposta: com uma única cena de jogo, não há troca de
// dados entre cenas, e setScrollFactor(0) já o mantém fixo na tela quando a câmera andar.
// A fonte "Press Start 2P" tem largura fixa por caractere, então os números não tremem.
//
// Pontos e bônus aparecem separados de propósito. Somados num número só, o total caía 10 a
// cada segundo e o jogador lia a passagem do tempo como pontos perdidos. Separados, "PONTOS"
// só muda quando ele age, e o bônus mostra claramente que é o tempo que está correndo.
// A soma oficial continua sendo a do servidor, exibida na tela de resultado.
export class Hud {
  private readonly candles: Phaser.GameObjects.Graphics;
  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly bonusText: Phaser.GameObjects.Text;
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
    // Texto inicial não vazio para a altura da linha já estar medida ao posicionar o bônus.
    this.scoreText = scene.add.text(SPACING.md, candlesBottom + SPACING.md, 'PONTOS', textStyle);
    const bonusY = this.scoreText.y + this.scoreText.height + SPACING.sm;
    this.bonusText = scene.add.text(SPACING.md, bonusY, '', textStyle);
    this.timeText = scene.add
      .text(scene.scale.width - SPACING.md, SPACING.md, '', textStyle)
      .setOrigin(1, 0);

    for (const element of [this.candles, this.scoreText, this.bonusText, this.timeText]) {
      element.setScrollFactor(0).setDepth(LAYOUT.hud.depth);
    }
  }

  render(health: number, counters: MatchCounters): void {
    if (health !== this.shownHealth) {
      this.drawCandles(health);
      this.shownHealth = health;
    }
    const breakdown = scoreBreakdown(counters);
    this.scoreText.setText(`PONTOS ${formatSignedPoints(actionPoints(breakdown))}`);
    this.renderTimeBonus(breakdown.timeBonus);
    this.timeText.setText(`TEMPO ${formatElapsed(counters.durationMs)}`);
  }

  // Laranja enquanto ainda vale algo; apagado quando zera, para o jogador notar que o tempo
  // limite passou sem precisar ler o número.
  private renderTimeBonus(timeBonus: number): void {
    const digits = String(timeBonus).padStart(LAYOUT.hud.scoreDigits, '0');
    const color = timeBonus > 0 ? COLORS.accent : COLORS.textMuted;
    this.bonusText.setText(`BONUS DE TEMPO ${digits}`).setColor(cssColor(color));
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

// Mostra o sinal de menos em vez de travar em zero: matar um inocente cedo deixa os pontos
// negativos, e esconder isso faria a penalidade parecer não ter efeito. O espaço no lugar do
// sinal mantém a largura fixa, então o número não pula ao cruzar o zero.
function formatSignedPoints(points: number): string {
  const sign = points < 0 ? '-' : ' ';
  return sign + String(Math.abs(points)).padStart(LAYOUT.hud.scoreDigits, '0');
}
