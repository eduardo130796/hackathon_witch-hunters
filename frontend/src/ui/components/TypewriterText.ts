import Phaser from 'phaser';
import { DIALOGUE_CHAR_INTERVAL_MS } from '../../config/balance';

// Efeito de máquina de escrever sobre um texto já criado (o painel de fala e a abertura da
// história usam o mesmo). Recebe o objeto de texto pronto porque cada tela o posiciona e o
// estiliza de um jeito, e às vezes dentro de um container.
export class TypewriterText {
  private typing?: Phaser.Time.TimerEvent;
  private fullText = '';

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly target: Phaser.GameObjects.Text,
  ) {}

  // Um evento repetido do relógio da cena revela um caractere por vez. O relógio da cena segue
  // correndo com a física pausada, então o efeito funciona também durante um diálogo na fase.
  type(content: string): void {
    this.stop();
    this.fullText = content;
    this.target.setText('');
    if (content.length === 0) {
      return;
    }
    let revealed = 0;
    this.typing = this.scene.time.addEvent({
      delay: DIALOGUE_CHAR_INTERVAL_MS,
      repeat: content.length - 1,
      callback: () => {
        revealed += 1;
        this.target.setText(content.slice(0, revealed));
        if (revealed >= content.length) {
          this.typing = undefined;
        }
      },
    });
  }

  isTyping(): boolean {
    return this.typing !== undefined;
  }

  // Mostra o texto inteiro de uma vez: quem lê rápido não precisa esperar a digitação.
  complete(): void {
    this.stop();
    this.target.setText(this.fullText);
  }

  private stop(): void {
    this.typing?.remove(false);
    this.typing = undefined;
  }
}
