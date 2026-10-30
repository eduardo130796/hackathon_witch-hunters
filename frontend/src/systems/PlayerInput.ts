import Phaser from 'phaser';
import { CONTROLS, type ControlAction } from '../config/controls';

type KeysByAction = Record<ControlAction, Phaser.Input.Keyboard.Key[]>;

// Traduz teclas físicas em ações do jogo. Entidades perguntam "está pulando?",
// sem saber quais teclas existem, então remapear controles mexe só em config/controls.ts.
export class PlayerInput {
  private readonly keysByAction: KeysByAction;

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error('Teclado indisponível nesta cena.');
    }
    const bindAction = (action: ControlAction): Phaser.Input.Keyboard.Key[] =>
      CONTROLS[action].map((keyName) => keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[keyName]));

    this.keysByAction = {
      moveLeft: bindAction('moveLeft'),
      moveRight: bindAction('moveRight'),
      jump: bindAction('jump'),
      attack: bindAction('attack'),
      pause: bindAction('pause'),
      mute: bindAction('mute'),
    };
  }

  isDown(action: ControlAction): boolean {
    return this.keysByAction[action].some((key) => key.isDown);
  }

  // JustDown limpa o estado da tecla ao ser lido, por isso todas são consultadas (filter),
  // e não só até a primeira verdadeira (some): senão uma tecla "sobraria" para o quadro seguinte.
  justPressed(action: ControlAction): boolean {
    return (
      this.keysByAction[action].filter((key) => Phaser.Input.Keyboard.JustDown(key)).length > 0
    );
  }
}
