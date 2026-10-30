import Phaser from 'phaser';
import { COLORS, EFFECTS, cssRgba } from '../theme';

const VIGNETTE_TEXTURE_KEY = 'vignette';

// A textura é desenhada uma vez por canvas e reaproveitada por todas as cenas,
// em vez de depender de um arquivo de imagem.
function createVignetteTexture(scene: Phaser.Scene, width: number, height: number): void {
  const texture = scene.textures.createCanvas(VIGNETTE_TEXTURE_KEY, width, height);
  if (!texture) {
    throw new Error('Não foi possível criar a textura da vinheta.');
  }
  const { innerRadiusRatio, outerRadiusRatio, edgeAlpha } = EFFECTS.vignette;
  const context = texture.getContext();
  const centerX = width / 2;
  const centerY = height / 2;
  const gradient = context.createRadialGradient(
    centerX,
    centerY,
    width * innerRadiusRatio,
    centerX,
    centerY,
    width * outerRadiusRatio,
  );
  gradient.addColorStop(0, cssRgba(COLORS.background, 0));
  gradient.addColorStop(1, cssRgba(COLORS.background, edgeAlpha));
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  texture.refresh();
}

export function addVignette(scene: Phaser.Scene): Phaser.GameObjects.Image {
  const { width, height } = scene.scale;
  if (!scene.textures.exists(VIGNETTE_TEXTURE_KEY)) {
    createVignetteTexture(scene, width, height);
  }
  // scrollFactor 0 prende a vinheta à tela, mesmo quando a câmera seguir o jogador.
  // A profundidade alta a mantém por cima de tudo, mesmo criada no início de create().
  return scene.add
    .image(0, 0, VIGNETTE_TEXTURE_KEY)
    .setOrigin(0)
    .setScrollFactor(0)
    .setDepth(EFFECTS.vignette.depth);
}
