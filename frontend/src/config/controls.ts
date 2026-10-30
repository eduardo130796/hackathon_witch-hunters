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
