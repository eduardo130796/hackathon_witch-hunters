import Phaser from 'phaser';

type KeyName = keyof typeof Phaser.Input.Keyboard.KeyCodes;

// Cada ação aceita mais de uma tecla para atender quem joga com WASD e quem joga com as setas.
// O satisfies faz o TypeScript recusar nomes de tecla que o Phaser não conhece.
export const CONTROLS = {
  moveLeft: ['A', 'LEFT'],
  moveRight: ['D', 'RIGHT'],
  jump: ['W', 'SPACE', 'UP'],
  attack: ['J', 'Z'],
  pause: ['ESC'],
  mute: ['M'],
} as const satisfies Record<string, readonly KeyName[]>;

export type ControlAction = keyof typeof CONTROLS;

// Teclas que avançam a fala do DialogueBox (o clique também avança). Fora de CONTROLS porque
// não são ações do cavaleiro: SPACE e J também pulam e atacam, e o LevelScene descarta esses
// toques enquanto a fala está aberta, para fechar o diálogo não virar um pulo ou um golpe.
export const DIALOGUE_ADVANCE_KEYS = ['SPACE', 'ENTER', 'J'] as const satisfies readonly KeyName[];
