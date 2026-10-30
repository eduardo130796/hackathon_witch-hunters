import Phaser from 'phaser';
import { COLORS, LAYOUT } from '../theme';

const { checkpointFlag, exitPortal } = LAYOUT.level;

// Bandeira de ponto de controle, desenhada com retângulos como marcador provisório. Para usar
// arte própria, troque o mastro e o estandarte por uma imagem carregada na BootScene (por
// exemplo 'checkpoint-flag'), mantendo a origem nos pés, sobre o chão.
export class CheckpointFlag {
  private readonly banner: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, groundY: number) {
    const topY = groundY - checkpointFlag.poleHeight;
    scene.add
      .rectangle(
        x,
        groundY,
        checkpointFlag.poleWidth,
        checkpointFlag.poleHeight,
        COLORS.panelBorder,
      )
      .setOrigin(0.5, 1);
    // Apagada até ser tocada: a cor muda para mostrar que o progresso foi salvo.
    this.banner = scene.add
      .rectangle(x, topY, checkpointFlag.bannerWidth, checkpointFlag.bannerHeight, COLORS.textMuted)
      .setOrigin(0, 0);
  }

  activate(): void {
    this.banner.setFillStyle(COLORS.accent);
  }
}

// Portal da saída, também provisório: um retângulo translúcido na cor mágica, trocável por
// uma imagem de portão ou porta quando houver arte.
export function addExitPortal(scene: Phaser.Scene, startX: number, groundY: number): void {
  scene.add
    .rectangle(startX, groundY, exitPortal.width, exitPortal.height, COLORS.magic, exitPortal.alpha)
    .setOrigin(0, 1);
}
