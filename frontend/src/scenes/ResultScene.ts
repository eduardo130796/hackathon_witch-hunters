import Phaser from 'phaser';
import { validateNickname } from '../domain/nickname';
import type { MatchOutcome } from '../domain/match-rules';
import { scoreBreakdown } from '../domain/score-formula';
import { submitScore } from '../services/scores-api';
import type { MatchResult } from '../types/api';
import { GothicButton } from '../ui/components/GothicButton';
import { ScoreBreakdownPanel } from '../ui/components/ScoreBreakdownPanel';
import { addSceneTitle } from '../ui/components/SceneTitle';
import { addVignette } from '../ui/effects/Vignette';
import { NickInput } from '../ui/overlays/NickInput';
import { COLORS, FONTS, FONT_SIZES, LAYOUT, cssColor } from '../ui/theme';
import { SCENE_KEYS } from './scene-keys';

const { result } = LAYOUT;

// Mensagem de fechamento conforme o fim da partida. Na derrota, o texto lembra que a
// pontuação ainda vale e pode ir para o ranking: morrer não apaga o que o jogador fez.
const OUTCOME_MESSAGES = {
  victory: { text: 'Vitória! As bruxas foram derrotadas.', color: COLORS.magic },
  defeat: {
    text: 'Você caiu em combate, mas a pontuação ainda pode ir para o ranking.',
    color: COLORS.danger,
  },
} as const;

// Fim da partida: mostra a estimativa, pede o nick e envia os contadores ao servidor.
// A pontuação que vale é a que o servidor devolve, e é ela que aparece depois de salvar.
export class ResultScene extends Phaser.Scene {
  // Atribuídos em init() e create(), que o Phaser executa antes de qualquer clique.
  private match!: MatchResult;
  private victory = false;
  private nickInput!: NickInput;
  private feedback!: Phaser.GameObjects.Text;
  private saveButton!: GothicButton;
  private saving = false;

  constructor() {
    super(SCENE_KEYS.result);
  }

  // Os dados chegam da LevelScene em scene.start; ficam guardados para um novo envio
  // depois de erro de rede, sem precisar jogar de novo.
  // victory chega separado do MatchResult, para não ir junto no envio à API.
  init(outcome: MatchOutcome): void {
    this.match = outcome.match;
    this.victory = outcome.victory;
    this.saving = false;
  }

  create(): void {
    addVignette(this);
    const { width, height } = this.scale;
    const centerX = width / 2;

    addSceneTitle(this, 'Fim da caçada', result.titleYRatio);
    const outcomeMessage = this.victory ? OUTCOME_MESSAGES.victory : OUTCOME_MESSAGES.defeat;
    this.addBodyText(height * result.outcomeYRatio, outcomeMessage.text, outcomeMessage.color);
    new ScoreBreakdownPanel(
      this,
      { x: centerX, top: height * result.breakdownTopYRatio },
      this.match,
      scoreBreakdown(this.match),
    );
    this.addBodyText(
      height * result.noteYRatio,
      'Estimativa: o total oficial é calculado pelo servidor ao salvar.',
      COLORS.textMuted,
    );
    this.addBodyText(height * result.nicknameLabelYRatio, 'Seu nick para o ranking', COLORS.text);
    this.nickInput = new NickInput(this, {
      x: centerX,
      y: height * result.nicknameInputYRatio,
      onSubmit: () => void this.save(),
    });
    this.feedback = this.addBodyText(height * result.feedbackYRatio, '', COLORS.text);

    const buttonsY = height * result.buttonsYRatio;
    this.saveButton = new GothicButton(this, {
      x: centerX - result.buttonsGap / 2,
      y: buttonsY,
      label: 'Salvar',
      onClick: () => void this.save(),
    });
    new GothicButton(this, {
      x: centerX + result.buttonsGap / 2,
      y: buttonsY,
      label: 'Menu',
      onClick: () => this.scene.start(SCENE_KEYS.menu),
    });
  }

  private async save(): Promise<void> {
    if (this.saving) {
      return;
    }
    const nickname = validateNickname(this.nickInput.value);
    if (!nickname.ok) {
      this.showFeedback(nickname.message, COLORS.danger);
      return;
    }

    this.saving = true;
    this.saveButton.setEnabled(false).setLabel('Salvando...');
    this.showFeedback('Salvando...', COLORS.textMuted);
    const response = await submitScore({ ...this.match, nickname: nickname.nickname });
    // O jogador pode ter voltado ao menu enquanto esperava; a tela antiga já não existe.
    if (!this.sys.isActive()) {
      return;
    }
    this.saving = false;

    if (!response.ok) {
      this.showFeedback(`Não foi possível salvar. ${response.message}`, COLORS.danger);
      this.saveButton.setEnabled(true).setLabel('Tentar de novo');
      return;
    }
    this.nickInput.destroy();
    this.showFeedback(
      `${response.data.nickname}: ${response.data.score} pontos registrados no ranking.`,
      COLORS.magic,
    );
    this.showRankingButton();
  }

  // Troca o botão de salvar por "Ver ranking": depois de registrado, salvar de novo
  // duplicaria a partida no ranking.
  private showRankingButton(): void {
    const { x, y } = this.saveButton;
    this.saveButton.destroy();
    new GothicButton(this, {
      x,
      y,
      label: 'Ver ranking',
      onClick: () => this.scene.start(SCENE_KEYS.ranking),
    });
  }

  private showFeedback(message: string, color: number): void {
    this.feedback.setText(message).setColor(cssColor(color));
  }

  private addBodyText(y: number, text: string, color: number): Phaser.GameObjects.Text {
    return this.add
      .text(this.scale.width / 2, y, text, {
        fontFamily: FONTS.body,
        fontSize: FONT_SIZES.body,
        color: cssColor(color),
      })
      .setOrigin(0.5);
  }
}
