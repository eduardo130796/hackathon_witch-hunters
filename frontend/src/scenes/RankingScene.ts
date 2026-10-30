import Phaser from 'phaser';
import { fetchRanking } from '../services/scores-api';
import { GothicButton } from '../ui/components/GothicButton';
import { RankingTable } from '../ui/components/RankingTable';
import { addSceneTitle } from '../ui/components/SceneTitle';
import { addVignette } from '../ui/effects/Vignette';
import { COLORS, FONTS, FONT_SIZES, LAYOUT, SPACING, cssColor } from '../ui/theme';
import { SCENE_KEYS } from './scene-keys';

const { ranking } = LAYOUT;

// Ranking mundial: busca a lista no servidor e mostra carregamento, erro ou tabela.
export class RankingScene extends Phaser.Scene {
  // Atribuído em create(), antes da primeira busca.
  private message!: Phaser.GameObjects.Text;
  private retryButton?: GothicButton;

  constructor() {
    super(SCENE_KEYS.ranking);
  }

  create(): void {
    addVignette(this);
    const { width, height } = this.scale;
    addSceneTitle(this, 'Ranking', ranking.titleYRatio);
    this.message = this.add
      .text(width / 2, height * ranking.messageYRatio, '', {
        fontFamily: FONTS.body,
        fontSize: FONT_SIZES.body,
        color: cssColor(COLORS.textMuted),
        align: 'center',
      })
      .setOrigin(0.5)
      .setPadding(SPACING.sm);
    new GothicButton(this, {
      x: width / 2,
      y: height * ranking.backButtonYRatio,
      label: 'Voltar',
      onClick: () => this.scene.start(SCENE_KEYS.menu),
    });
    void this.loadRanking();
  }

  private async loadRanking(): Promise<void> {
    this.retryButton?.destroy();
    this.retryButton = undefined;
    this.showMessage('Carregando ranking...', COLORS.textMuted);

    const response = await fetchRanking();
    // O jogador pode ter clicado em "Voltar" durante a espera.
    if (!this.sys.isActive()) {
      return;
    }
    if (!response.ok) {
      this.showMessage(`Não foi possível carregar o ranking.\n${response.message}`, COLORS.danger);
      this.showRetryButton();
      return;
    }
    if (response.data.length === 0) {
      this.showMessage('Nenhuma caçada registrada ainda. Seja o primeiro!', COLORS.textMuted);
      return;
    }
    this.message.setVisible(false);
    new RankingTable(this, response.data);
  }

  private showRetryButton(): void {
    this.retryButton = new GothicButton(this, {
      x: this.scale.width / 2,
      y: this.scale.height * ranking.retryButtonYRatio,
      label: 'Tentar de novo',
      onClick: () => void this.loadRanking(),
    });
  }

  private showMessage(text: string, color: number): void {
    this.message.setText(text).setColor(cssColor(color)).setVisible(true);
  }
}
