import Phaser from 'phaser';
import {
  ANIMATION_LOOP_FOREVER,
  ANIMATION_PLAY_ONCE,
  ENEMY_DEATH_FRAME_RATE,
  ENEMY_HURT_DURATION_MS,
  ENEMY_IDLE_FRAME_RATE,
  ENEMY_WALK_FRAME_RATE,
  WEREWOLF_FEET_Y,
  WEREWOLF_FIGURE_HEIGHT,
  WEREWOLF_FRAME_SIZE,
  WEREWOLF_HITBOX_HEIGHT,
  WEREWOLF_HITBOX_WIDTH,
  WEREWOLF_ROW_FRAME_COUNTS,
  WEREWOLF_SHEET_COLUMNS,
  WITCH_ATTACK_DURATION_MS,
  WITCH_SHEET_COLUMNS,
  WITCH_SHEET_FEET_Y,
  WITCH_SHEET_FIGURE_HEIGHT,
  WITCH_SHEET_FRAME_HEIGHT,
  WITCH_SHEET_FRAME_WIDTH,
  WITCH_SHEET_HITBOX_HEIGHT,
  WITCH_SHEET_HITBOX_WIDTH,
  WITCH_SHEET_ROW_FRAME_COUNTS,
  WOLF_FEET_Y,
  WOLF_FIGURE_HEIGHT,
  WOLF_FRAME_SIZE,
  WOLF_HITBOX_HEIGHT,
  WOLF_HITBOX_WIDTH,
  WOLF_ROW_FRAME_COUNTS,
  WOLF_SHEET_COLUMNS,
} from '../config/balance';

// Estados visuais dos inimigos que herdam da bruxa. São os mesmos do WitchState; o tipo é
// repetido aqui para este módulo não depender de Witch.ts (Witch.ts é que depende dele).
export type EnemySheetState = 'dormant' | 'patrol' | 'chase' | 'attack' | 'hurt' | 'dead';

// Quadros tocados por uma animação, em ordem. Quase sempre é uma linha inteira da sheet; a
// morte do lobo e a da bruxa juntam pedaços de duas linhas.
interface EnemyAnimationSpec {
  key: string;
  frames: readonly number[];
  frameRate: number;
  repeat: number;
}

// Tudo o que a BootScene e a entidade precisam saber de uma sheet de inimigo: arquivo, tamanho
// do quadro, linha dos pés, altura da figura, corpo físico e qual animação cada estado toca.
export interface EnemySheet {
  textureKey: string;
  fileName: string;
  frameWidth: number;
  frameHeight: number;
  feetY: number;
  figureHeight: number;
  hitboxWidth: number;
  hitboxHeight: number;
  animations: readonly EnemyAnimationSpec[];
  animationByState: Record<EnemySheetState, string>;
}

const MS_PER_SECOND = 1000;

// Ritmo que faz a animação inteira caber na duração do estado: ataque e dano têm tempo fixo
// definido em balance.ts, e a animação precisa terminar junto com ele.
function frameRateToFit(frameCount: number, durationMs: number): number {
  return (frameCount * MS_PER_SECOND) / durationMs;
}

// Quadros de uma linha, da coluna 0 até a última preenchida. As células vazias do fim das
// linhas curtas ficam de fora: tocar uma delas faria o inimigo sumir por um instante.
function rowFrames(columns: number, row: number, frameCount: number): number[] {
  return Array.from({ length: frameCount }, (_, column) => row * columns + column);
}

// Mapa do lobo, identificado olhando a sheet linha a linha:
// 0 repouso; 1 corrida; 2 bote curto (mordida); 3 bote com sangue; 4 salto longo;
// 5 tranco para trás com respingo de sangue (dano); 6 rosnado; 7 tombando; 8 caído no chão.
// A morte junta as linhas 7 e 8, para a queda terminar com o lobo deitado. As linhas 3, 4 e 6
// ficam sem uso: a IA herdada da bruxa tem um ataque só. Patrulha e perseguição usam a mesma
// corrida, como acontecia com a caminhada da bruxa.
const wolfRow = (row: number): number[] =>
  rowFrames(WOLF_SHEET_COLUMNS, row, WOLF_ROW_FRAME_COUNTS[row] ?? WOLF_SHEET_COLUMNS);
const WOLF_ATTACK_FRAMES = wolfRow(2);
const WOLF_HURT_FRAMES = wolfRow(5);

export const WOLF_SHEET: EnemySheet = {
  textureKey: 'wolf-sheet',
  fileName: 'wolf-sheet.png',
  frameWidth: WOLF_FRAME_SIZE,
  frameHeight: WOLF_FRAME_SIZE,
  feetY: WOLF_FEET_Y,
  figureHeight: WOLF_FIGURE_HEIGHT,
  hitboxWidth: WOLF_HITBOX_WIDTH,
  hitboxHeight: WOLF_HITBOX_HEIGHT,
  animations: [
    {
      key: 'wolf-idle',
      frames: wolfRow(0),
      frameRate: ENEMY_IDLE_FRAME_RATE,
      repeat: ANIMATION_LOOP_FOREVER,
    },
    {
      key: 'wolf-run',
      frames: wolfRow(1),
      frameRate: ENEMY_WALK_FRAME_RATE,
      repeat: ANIMATION_LOOP_FOREVER,
    },
    {
      key: 'wolf-attack',
      frames: WOLF_ATTACK_FRAMES,
      frameRate: frameRateToFit(WOLF_ATTACK_FRAMES.length, WITCH_ATTACK_DURATION_MS),
      repeat: ANIMATION_PLAY_ONCE,
    },
    {
      key: 'wolf-hurt',
      frames: WOLF_HURT_FRAMES,
      frameRate: frameRateToFit(WOLF_HURT_FRAMES.length, ENEMY_HURT_DURATION_MS),
      repeat: ANIMATION_PLAY_ONCE,
    },
    {
      key: 'wolf-death',
      frames: [...wolfRow(7), ...wolfRow(8)],
      frameRate: ENEMY_DEATH_FRAME_RATE,
      repeat: ANIMATION_PLAY_ONCE,
    },
  ],
  animationByState: {
    dormant: 'wolf-idle',
    patrol: 'wolf-run',
    chase: 'wolf-run',
    attack: 'wolf-attack',
    hurt: 'wolf-hurt',
    dead: 'wolf-death',
  },
};

// Mapa do lobisomem, identificado olhando a sheet linha a linha:
// 0 repouso; 1 caminhada; 2 corrida curvada; 3 golpe de garra com rastro vermelho;
// 4 investida com o braço estendido; 5 golpe no chão; 6 recuo rugindo com sangue (dano);
// 7 repouso ereto; 8 caminhada ereta; 9 morte terminando deitado; 10 outra morte.
// A patrulha usa a caminhada e a perseguição a corrida, porque o lobisomem muda de postura
// ao avistar o jogador. As linhas 4, 5, 7, 8 e 10 são variações sem estado correspondente.
const werewolfRow = (row: number): number[] =>
  rowFrames(WEREWOLF_SHEET_COLUMNS, row, WEREWOLF_ROW_FRAME_COUNTS[row] ?? WEREWOLF_SHEET_COLUMNS);
const WEREWOLF_ATTACK_FRAMES = werewolfRow(3);
const WEREWOLF_HURT_FRAMES = werewolfRow(6);

export const WEREWOLF_SHEET: EnemySheet = {
  textureKey: 'werewolf-sheet',
  fileName: 'werewolf-sheet.png',
  frameWidth: WEREWOLF_FRAME_SIZE,
  frameHeight: WEREWOLF_FRAME_SIZE,
  feetY: WEREWOLF_FEET_Y,
  figureHeight: WEREWOLF_FIGURE_HEIGHT,
  hitboxWidth: WEREWOLF_HITBOX_WIDTH,
  hitboxHeight: WEREWOLF_HITBOX_HEIGHT,
  animations: [
    {
      key: 'werewolf-idle',
      frames: werewolfRow(0),
      frameRate: ENEMY_IDLE_FRAME_RATE,
      repeat: ANIMATION_LOOP_FOREVER,
    },
    {
      key: 'werewolf-walk',
      frames: werewolfRow(1),
      frameRate: ENEMY_WALK_FRAME_RATE,
      repeat: ANIMATION_LOOP_FOREVER,
    },
    {
      key: 'werewolf-run',
      frames: werewolfRow(2),
      frameRate: ENEMY_WALK_FRAME_RATE,
      repeat: ANIMATION_LOOP_FOREVER,
    },
    {
      key: 'werewolf-attack',
      frames: WEREWOLF_ATTACK_FRAMES,
      frameRate: frameRateToFit(WEREWOLF_ATTACK_FRAMES.length, WITCH_ATTACK_DURATION_MS),
      repeat: ANIMATION_PLAY_ONCE,
    },
    {
      key: 'werewolf-hurt',
      frames: WEREWOLF_HURT_FRAMES,
      frameRate: frameRateToFit(WEREWOLF_HURT_FRAMES.length, ENEMY_HURT_DURATION_MS),
      repeat: ANIMATION_PLAY_ONCE,
    },
    {
      key: 'werewolf-death',
      frames: werewolfRow(9),
      frameRate: ENEMY_DEATH_FRAME_RATE,
      repeat: ANIMATION_PLAY_ONCE,
    },
  ],
  animationByState: {
    dormant: 'werewolf-idle',
    patrol: 'werewolf-walk',
    chase: 'werewolf-run',
    attack: 'werewolf-attack',
    hurt: 'werewolf-hurt',
    dead: 'werewolf-death',
  },
};

// Mapa da bruxa (witch-sheet.png, remontada de witch.png com o brilho de fundo removido):
// 0 repouso respirando; 1 conjuração apontando o cajado; 2 giro com arcos verdes;
// 3 conjuração de projétil (o projétil foi descartado); 4 levitação; 5 dano (quadros 0-1),
// cambaleio e queda (2-7); 6 deitada no chão.
// A sheet não tem ciclo de caminhada: a patrulha usa o repouso (ela desliza devagar, como uma
// bruxa) e a perseguição usa a levitação, que lê como deslocamento rápido. O ataque é a
// conjuração com o cajado, cujo gesto para a frente combina com o golpe que fere à frente
// dela. As linhas 2 e 3 ficam sem uso: a IA tem um ataque só. A adormecida usa o repouso.
const witchRow = (row: number): number[] =>
  rowFrames(WITCH_SHEET_COLUMNS, row, WITCH_SHEET_ROW_FRAME_COUNTS[row] ?? WITCH_SHEET_COLUMNS);
const WITCH_ATTACK_FRAMES = witchRow(1);
// Só os dois primeiros quadros da linha 5 são a reação ao golpe; o resto é a queda.
const WITCH_FALL_START_INDEX = 2;
const WITCH_HURT_FRAMES = witchRow(5).slice(0, WITCH_FALL_START_INDEX);

export const WITCH_SHEET: EnemySheet = {
  textureKey: 'witch-sheet',
  fileName: 'witch-sheet.png',
  frameWidth: WITCH_SHEET_FRAME_WIDTH,
  frameHeight: WITCH_SHEET_FRAME_HEIGHT,
  feetY: WITCH_SHEET_FEET_Y,
  figureHeight: WITCH_SHEET_FIGURE_HEIGHT,
  hitboxWidth: WITCH_SHEET_HITBOX_WIDTH,
  hitboxHeight: WITCH_SHEET_HITBOX_HEIGHT,
  animations: [
    {
      key: 'witch-idle',
      frames: witchRow(0),
      frameRate: ENEMY_IDLE_FRAME_RATE,
      repeat: ANIMATION_LOOP_FOREVER,
    },
    {
      key: 'witch-levitate',
      frames: witchRow(4),
      frameRate: ENEMY_WALK_FRAME_RATE,
      repeat: ANIMATION_LOOP_FOREVER,
    },
    {
      key: 'witch-attack',
      frames: WITCH_ATTACK_FRAMES,
      frameRate: frameRateToFit(WITCH_ATTACK_FRAMES.length, WITCH_ATTACK_DURATION_MS),
      repeat: ANIMATION_PLAY_ONCE,
    },
    {
      key: 'witch-hurt',
      frames: WITCH_HURT_FRAMES,
      frameRate: frameRateToFit(WITCH_HURT_FRAMES.length, ENEMY_HURT_DURATION_MS),
      repeat: ANIMATION_PLAY_ONCE,
    },
    // Queda da linha 5 seguida da linha 6; tocar uma vez deixa o último quadro (deitada).
    {
      key: 'witch-death',
      frames: [...witchRow(5).slice(WITCH_FALL_START_INDEX), ...witchRow(6)],
      frameRate: ENEMY_DEATH_FRAME_RATE,
      repeat: ANIMATION_PLAY_ONCE,
    },
  ],
  animationByState: {
    dormant: 'witch-idle',
    patrol: 'witch-idle',
    chase: 'witch-levitate',
    attack: 'witch-attack',
    hurt: 'witch-hurt',
    dead: 'witch-death',
  },
};

// Lista lida pela BootScene para carregar todas as sheets de inimigo.
export const ENEMY_SHEETS: readonly EnemySheet[] = [WITCH_SHEET, WOLF_SHEET, WEREWOLF_SHEET];

// Animações do Phaser são globais (AnimationManager do jogo). Cada inimigo chama isto ao
// nascer; a verificação com exists faz cada chave ser criada uma vez só, como no cavaleiro.
export function registerEnemySheetAnimations(
  anims: Phaser.Animations.AnimationManager,
  sheet: EnemySheet,
): void {
  for (const spec of sheet.animations) {
    if (anims.exists(spec.key)) {
      continue;
    }
    anims.create({
      key: spec.key,
      frames: anims.generateFrameNumbers(sheet.textureKey, { frames: [...spec.frames] }),
      frameRate: spec.frameRate,
      repeat: spec.repeat,
    });
  }
}
