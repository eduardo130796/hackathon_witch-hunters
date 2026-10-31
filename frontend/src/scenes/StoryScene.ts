import Phaser from 'phaser';
import { DIALOGUE_ADVANCE_KEYS } from '../config/controls';
import { STORY_01 } from '../levels/story-01';
import { getAudioSystem } from '../systems/AudioSystem';
import { StorySlideView } from '../ui/components/StorySlideView';
import { addVignette } from '../ui/effects/Vignette';
import { COLORS, FONTS, FONT_SIZES, SPACING, STORY_LAYOUT, TIMING_MS, cssColor } from '../ui/theme';
import { SCENE_KEYS } from './scene-keys';

const ADVANCE_HINT = 'Espaço / clique para continuar  ·  Esc para pular';
const SKIP_LABEL = 'Pular »';
const SKIP_KEY_EVENT = 'keydown-ESC';

// Abertura antes da fase: slides curtos com a história de Vellmark. Os textos ficam em
// levels/story-01.ts e o desenho de cada slide no StorySlideView; aqui fica só o fluxo.
export class StoryScene extends Phaser.Scene {
  // Atribuídos em create(), antes do primeiro slide.
  private slideView!: StorySlideView;
  private skipButton!: Phaser.GameObjects.Text;
  private slideIndex = 0;
  // Durante o fade entre slides, toques extras pulariam um slide inteiro sem ser lido.
  private changingSlide = false;
  private leaving = false;

  constructor() {
    super(SCENE_KEYS.story);
  }

  create(): void {
    addVignette(this);
    // A mesma instância da cena é reaproveitada a cada partida: o estado volta ao início.
    this.slideIndex = 0;
    this.changingSlide = false;
    this.leaving = false;
    // A trilha do menu segue tocando aqui; a fase faz a troca com fade, como vinda do menu.
    getAudioSystem(this.game).bindMuteKey(this);
    this.slideView = new StorySlideView(this);
    this.createHints();
    this.listenForInput();
    this.showCurrentSlide();
    this.cameras.main.fadeIn(TIMING_MS.slow);
  }

  // Aviso e botão de pular ficam acima da vinheta: no canto, ela apagaria o "Pular".
  private createHints(): void {
    const { width, height } = this.scale;
    const hintStyle = {
      fontFamily: FONTS.body,
      fontSize: STORY_LAYOUT.hintFontSize,
      color: cssColor(COLORS.textMuted),
    };
    this.add
      .text(width / 2, height * STORY_LAYOUT.hintYRatio, ADVANCE_HINT, hintStyle)
      .setOrigin(0.5)
      .setDepth(STORY_LAYOUT.textDepth);
    const skip = this.add
      .text(width - SPACING.lg, SPACING.lg, SKIP_LABEL, { ...hintStyle, fontSize: FONT_SIZES.body })
      .setOrigin(1, 0)
      .setPadding(SPACING.sm)
      .setDepth(STORY_LAYOUT.textDepth)
      .setInteractive({ useHandCursor: true });
    skip.on(Phaser.Input.Events.POINTER_OVER, () => skip.setColor(cssColor(COLORS.accent)));
    skip.on(Phaser.Input.Events.POINTER_OUT, () => skip.setColor(cssColor(COLORS.textMuted)));
    skip.on(Phaser.Input.Events.POINTER_DOWN, () => this.skip());
    this.skipButton = skip;
  }

  private listenForInput(): void {
    const keyboard = this.input.keyboard;
    const advance = (): void => this.advance();
    const skip = (): void => this.skip();
    const keyEvents = DIALOGUE_ADVANCE_KEYS.map((keyName) => `keydown-${keyName}`);
    keyEvents.forEach((eventName) => keyboard?.on(eventName, advance));
    keyboard?.on(SKIP_KEY_EVENT, skip);
    // O clique no "Pular" também chega aqui; ele já tem o próprio tratamento.
    const onPointerDown = (
      _: Phaser.Input.Pointer,
      over: Phaser.GameObjects.GameObject[],
    ): void => {
      if (!over.includes(this.skipButton)) {
        this.advance();
      }
    };
    this.input.on(Phaser.Input.Events.POINTER_DOWN, onPointerDown);
    // Sem remover os ouvintes, a próxima abertura teria dois de cada.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      keyEvents.forEach((eventName) => keyboard?.off(eventName, advance));
      keyboard?.off(SKIP_KEY_EVENT, skip);
      this.input.off(Phaser.Input.Events.POINTER_DOWN, onPointerDown);
    });
  }

  // Primeiro toque completa a digitação; o seguinte troca de slide ou, no último, abre a fase.
  private advance(): void {
    if (this.changingSlide || this.leaving) {
      return;
    }
    if (this.slideView.isTyping()) {
      this.slideView.completeTyping();
      return;
    }
    if (this.slideIndex >= STORY_01.length - 1) {
      this.startLevel();
      return;
    }
    this.changingSlide = true;
    this.slideView.hide(() => {
      this.slideIndex += 1;
      this.showCurrentSlide();
      this.changingSlide = false;
    });
  }

  private skip(): void {
    if (this.leaving) {
      return;
    }
    getAudioSystem(this.game).playClick();
    this.startLevel();
  }

  private showCurrentSlide(): void {
    const slide = STORY_01[this.slideIndex];
    if (slide) {
      this.slideView.show(slide);
    }
  }

  private startLevel(): void {
    this.leaving = true;
    this.cameras.main.fadeOut(TIMING_MS.slow);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () =>
      this.scene.start(SCENE_KEYS.level),
    );
  }
}
