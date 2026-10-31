import Phaser from 'phaser';
import { CONTROLS, DIALOGUE_ADVANCE_KEYS } from '../config/controls';
import { getAudioSystem } from '../systems/AudioSystem';
import { GothicButton } from '../ui/components/GothicButton';
import { addSceneTitle } from '../ui/components/SceneTitle';
import { addFogLayers } from '../ui/effects/FogLayer';
import { addVignette } from '../ui/effects/Vignette';
import { COLORS, FONTS, FONT_SIZES, HOW_TO_PLAY_LAYOUT, cssColor } from '../ui/theme';
import { SCENE_KEYS } from './scene-keys';

const layout = HOW_TO_PLAY_LAYOUT;

// Nome da tecla como o jogador o reconhece; as demais (letras) aparecem como estão. As setas
// vão por extenso porque a Cinzel não tem os glifos ← → ↑ e o canvas os desenhava vazios.
const KEY_LABELS: Readonly<Record<string, string>> = {
  LEFT: 'Seta esquerda',
  RIGHT: 'Seta direita',
  UP: 'Seta para cima',
  SPACE: 'Espaço',
  ENTER: 'Enter',
};

// As teclas vêm de config/controls.ts: se um atalho mudar lá, esta tela muda junto.
const CONTROL_ROWS: readonly { action: string; keys: readonly string[] }[] = [
  { action: 'Mover para a esquerda', keys: CONTROLS.moveLeft },
  { action: 'Mover para a direita', keys: CONTROLS.moveRight },
  { action: 'Pular', keys: CONTROLS.jump },
  { action: 'Atacar', keys: CONTROLS.attack },
  { action: 'Ligar/desligar som', keys: CONTROLS.mute },
  { action: 'Avançar diálogo', keys: [...DIALOGUE_ADVANCE_KEYS, 'clique'] },
];

const TIPS: readonly string[] = [
  'Derrote todos os inimigos de cada trecho para abrir o caminho.',
  'Não ataque os inocentes: cada um morto custa pontos.',
  'Contra o Demônio, pule e golpeie o ponto fraco quando ele brilhar.',
  'Ao morrer, você volta ao início do trecho atual.',
  'Quanto mais rápida a caçada, maior o bônus de tempo.',
];

function formatKeys(keys: readonly string[]): string {
  return keys.map((key) => KEY_LABELS[key] ?? key).join(' / ');
}

// Tela de instruções aberta pelo menu: controles à esquerda, dicas à direita.
export class HowToPlayScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.howToPlay);
  }

  create(): void {
    addVignette(this);
    const { width, height } = this.scale;
    addFogLayers(this);
    addSceneTitle(this, 'Como jogar', layout.titleYRatio);
    // A trilha do menu continua: esta tela é uma extensão dele.
    const audio = getAudioSystem(this.game);
    audio.playMenuTheme(this);
    audio.bindMuteKey(this);

    this.addHeading(width * layout.actionXRatio, 'Controles');
    this.addControlRows();
    this.addHeading(width * layout.tipsXRatio, 'Dicas');
    this.addTips();

    new GothicButton(this, {
      x: width / 2,
      y: height * layout.backButtonYRatio,
      label: 'Voltar',
      onClick: () => {
        audio.playClick();
        this.scene.start(SCENE_KEYS.menu);
      },
    });
  }

  private addHeading(x: number, text: string): void {
    this.add.text(x, this.scale.height * layout.headingYRatio, text, {
      fontFamily: FONTS.title,
      fontSize: FONT_SIZES.button,
      fontStyle: 'bold',
      color: cssColor(COLORS.accent),
    });
  }

  private addControlRows(): void {
    const { width, height } = this.scale;
    const bodyStyle = { fontFamily: FONTS.body, fontSize: FONT_SIZES.body };
    CONTROL_ROWS.forEach((row, index) => {
      const y = height * layout.firstRowYRatio + index * layout.rowHeight;
      this.add.text(width * layout.actionXRatio, y, row.action, {
        ...bodyStyle,
        color: cssColor(COLORS.text),
      });
      this.add.text(width * layout.keysXRatio, y, formatKeys(row.keys), {
        ...bodyStyle,
        color: cssColor(COLORS.magic),
      });
    });
  }

  // Cada dica começa logo abaixo da anterior: dicas longas quebram em duas linhas.
  private addTips(): void {
    const { width, height } = this.scale;
    let y = height * layout.firstRowYRatio;
    for (const tip of TIPS) {
      const text = this.add.text(width * layout.tipsXRatio, y, `• ${tip}`, {
        fontFamily: FONTS.body,
        fontSize: FONT_SIZES.body,
        color: cssColor(COLORS.text),
        wordWrap: { width: width * layout.tipsWidthRatio },
      });
      y += text.height + layout.tipGap;
    }
  }
}
