import Phaser from 'phaser';
import { SCORE_RULES } from '../../config/score-rules';
import type { MatchCounters, ScoreBreakdown } from '../../domain/score-formula';
import { COLORS, FONTS, FONT_SIZES, LAYOUT, SPACING, cssColor } from '../theme';

const { breakdownWidth, breakdownRowHeight } = LAYOUT.result;

interface BreakdownRow {
  label: string;
  detail: string;
  value: string;
  color: number;
}

// Sinal explícito: o jogador lê "+200" e "-250" como ganho e perda sem precisar de legenda.
// Zero fica sem sinal, porque "-0" parece erro.
function signed(value: number, sign: '+' | '-'): string {
  return value === 0 ? '0' : `${sign}${value}`;
}

function breakdownRows(counters: MatchCounters, breakdown: ScoreBreakdown): BreakdownRow[] {
  return [
    {
      label: 'Bruxas abatidas',
      detail: `${counters.witchesKilled} × ${SCORE_RULES.witchPoints}`,
      value: signed(breakdown.witchPoints, '+'),
      color: COLORS.magic,
    },
    {
      label: 'Inocentes atingidos',
      detail: `${counters.innocentsKilled} × ${SCORE_RULES.innocentPenalty}`,
      value: signed(breakdown.innocentPenalty, '-'),
      color: COLORS.danger,
    },
    {
      label: 'Dano recebido',
      detail: `${counters.damageTaken} × ${SCORE_RULES.damagePenalty}`,
      value: signed(breakdown.damagePenalty, '-'),
      color: COLORS.danger,
    },
    {
      label: 'Bônus de tempo',
      detail: `${breakdown.elapsedSeconds} s`,
      value: signed(breakdown.timeBonus, '+'),
      color: COLORS.magic,
    },
  ];
}

// Painel com cada parcela da pontuação e o total estimado. O total oficial vem do servidor;
// este painel só explica de onde a estimativa saiu.
export class ScoreBreakdownPanel extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    position: { x: number; top: number },
    counters: MatchCounters,
    breakdown: ScoreBreakdown,
  ) {
    super(scene, position.x, position.top);
    const rows = breakdownRows(counters, breakdown);
    // Uma linha a mais para o total.
    const panelHeight = (rows.length + 1) * breakdownRowHeight + SPACING.md * 2;

    this.add(
      scene.add
        .rectangle(0, 0, breakdownWidth, panelHeight, COLORS.panel)
        .setOrigin(0.5, 0)
        .setStrokeStyle(LAYOUT.button.borderWidth, COLORS.panelBorder),
    );
    rows.forEach((row, index) => this.addRow(row, index));
    this.addRow(
      {
        label: 'Total estimado',
        detail: '',
        value: String(breakdown.total),
        color: COLORS.accent,
      },
      rows.length,
    );
    scene.add.existing(this);
  }

  // Rótulo à esquerda, detalhe (quantidade × valor) no meio e resultado alinhado à direita.
  private addRow(row: BreakdownRow, index: number): void {
    const y = SPACING.md + index * breakdownRowHeight + breakdownRowHeight / 2;
    const left = -breakdownWidth / 2 + SPACING.lg;
    const right = breakdownWidth / 2 - SPACING.lg;
    const bodyStyle = {
      fontFamily: FONTS.body,
      fontSize: FONT_SIZES.body,
      color: cssColor(COLORS.text),
    };
    this.add([
      this.scene.add.text(left, y, row.label, bodyStyle).setOrigin(0, 0.5),
      this.scene.add
        .text(0, y, row.detail, { ...bodyStyle, color: cssColor(COLORS.textMuted) })
        .setOrigin(0, 0.5),
      this.scene.add
        .text(right, y, row.value, {
          fontFamily: FONTS.hud,
          fontSize: FONT_SIZES.table,
          color: cssColor(row.color),
        })
        .setOrigin(1, 0.5),
    ]);
  }
}
