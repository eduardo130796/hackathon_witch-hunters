import Phaser from 'phaser';
import { formatElapsed } from '../../domain/time-format';
import type { ScoreRecord } from '../../types/api';
import { COLORS, FONTS, FONT_SIZES, LAYOUT, SPACING, cssColor } from '../theme';

const { tableTopYRatio, rowHeight, columns } = LAYOUT.ranking;

// Tabela do ranking: cabeçalho e uma linha por partida. Fonte de largura fixa para os
// números das colunas ficarem alinhados.
export class RankingTable extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, records: readonly ScoreRecord[]) {
    super(scene, 0, 0);
    const top = scene.scale.height * tableTopYRatio;
    this.addRow(top, ['#', 'NICK', 'PONTOS', 'TEMPO'], COLORS.textMuted);
    records.forEach((record, index) => {
      const y = top + (index + 1) * rowHeight;
      const cells = [
        String(index + 1),
        record.nickname,
        String(record.score),
        formatElapsed(record.durationMs),
      ];
      const nicknameText = this.addRow(y, cells, COLORS.text);
      if (record.usedInspector) {
        this.addInspectorMark(nicknameText, y);
      }
    });
    scene.add.existing(this);
  }

  // Devolve o texto do nick, para a marca "inspetor" ser posicionada logo depois dele.
  private addRow(y: number, cells: readonly string[], color: number): Phaser.GameObjects.Text {
    const { width } = this.scene.scale;
    const style = { fontFamily: FONTS.hud, fontSize: FONT_SIZES.table, color: cssColor(color) };
    const [rank, nickname, score, time] = cells;
    const nicknameText = this.scene.add
      .text(width * columns.nicknameXRatio, y, nickname, style)
      .setOrigin(0, 0.5);
    this.add([
      this.scene.add.text(width * columns.rankXRatio, y, rank, style).setOrigin(0, 0.5),
      nicknameText,
      this.scene.add.text(width * columns.scoreXRatio, y, score, style).setOrigin(1, 0.5),
      this.scene.add.text(width * columns.timeXRatio, y, time, style).setOrigin(1, 0.5),
    ]);
    return nicknameText;
  }

  // Easter egg: quem mexeu nos valores do jogo pelo inspetor aparece marcado, sem ser
  // removido do ranking (seção 6 do CLAUDE.md).
  private addInspectorMark(nicknameText: Phaser.GameObjects.Text, y: number): void {
    this.add(
      this.scene.add
        .text(nicknameText.x + nicknameText.width + SPACING.sm, y, 'inspetor', {
          fontFamily: FONTS.hud,
          fontSize: FONT_SIZES.hud,
          color: cssColor(COLORS.danger),
        })
        .setOrigin(0, 0.5),
    );
  }
}
