import Phaser from 'phaser';
import {
  ANIMATION_LOOP_FOREVER,
  ANIMATION_PLAY_ONCE,
  KNIGHT_ATTACK_FRAME_RATE,
  KNIGHT_DEATH_FRAME_RATE,
  KNIGHT_HURT_FRAME_RATE,
  KNIGHT_IDLE_FRAME_RATE,
  KNIGHT_JUMP_FRAME_RATE,
  KNIGHT_ROW_FRAME_COUNTS,
  KNIGHT_SHEET_COLUMNS,
  KNIGHT_VICTORY_FRAME_RATE,
  KNIGHT_WALK_FRAME_RATE,
} from '../config/balance';

// Chave da textura usada pela BootScene ao carregar a sheet e pelo Player ao criar o sprite.
export const KNIGHT_SHEET_KEY = 'knight-sheet';

export type KnightAnimationKey =
  | 'knight-idle'
  | 'knight-walk'
  | 'knight-attack-1'
  | 'knight-attack-1-recovery'
  | 'knight-attack-2'
  | 'knight-death'
  | 'knight-victory'
  | 'knight-jump';

interface KnightAnimation {
  key: KnightAnimationKey;
  // Linha da sheet (começa em 0); o primeiro quadro é linha × colunas.
  row: number;
  frameRate: number;
  repeat: number;
}

// Mapa da sheet: cada linha é uma sequência desenhada para uma ação. As linhas 5 (estocada
// carregada), 8 (defesa agachada) e 9 (desembainhar) não aparecem aqui porque nenhum estado
// do jogador as usa.
const KNIGHT_ANIMATIONS: readonly KnightAnimation[] = [
  {
    key: 'knight-idle',
    row: 0,
    frameRate: KNIGHT_IDLE_FRAME_RATE,
    repeat: ANIMATION_LOOP_FOREVER,
  },
  {
    key: 'knight-walk',
    row: 1,
    frameRate: KNIGHT_WALK_FRAME_RATE,
    repeat: ANIMATION_LOOP_FOREVER,
  },
  {
    key: 'knight-attack-1',
    row: 2,
    frameRate: KNIGHT_ATTACK_FRAME_RATE,
    repeat: ANIMATION_PLAY_ONCE,
  },
  {
    key: 'knight-attack-1-recovery',
    row: 3,
    frameRate: KNIGHT_HURT_FRAME_RATE,
    repeat: ANIMATION_PLAY_ONCE,
  },
  {
    key: 'knight-attack-2',
    row: 4,
    frameRate: KNIGHT_ATTACK_FRAME_RATE,
    repeat: ANIMATION_PLAY_ONCE,
  },
  // A queda termina com o cavaleiro no chão; tocar uma vez deixa o último quadro na tela.
  {
    key: 'knight-death',
    row: 10,
    frameRate: KNIGHT_DEATH_FRAME_RATE,
    repeat: ANIMATION_PLAY_ONCE,
  },
  {
    key: 'knight-victory',
    row: 6,
    frameRate: KNIGHT_VICTORY_FRAME_RATE,
    repeat: ANIMATION_PLAY_ONCE,
  },
  {
    key: 'knight-jump',
    row: 7,
    frameRate: KNIGHT_JUMP_FRAME_RATE,
    repeat: ANIMATION_PLAY_ONCE,
  },
];

// Animações do Phaser são globais (ficam no AnimationManager do jogo, não na cena). A
// LevelScene é recriada a cada partida, então cada chave só é criada na primeira vez.
export function registerKnightAnimations(anims: Phaser.Animations.AnimationManager): void {
  for (const animation of KNIGHT_ANIMATIONS) {
    if (anims.exists(animation.key)) {
      continue;
    }
    const start = animation.row * KNIGHT_SHEET_COLUMNS;
    const frameCount = KNIGHT_ROW_FRAME_COUNTS[animation.row];
    anims.create({
      key: animation.key,
      frames: anims.generateFrameNumbers(KNIGHT_SHEET_KEY, { start, end: start + frameCount - 1 }),
      frameRate: animation.frameRate,
      repeat: animation.repeat,
    });
  }
}
