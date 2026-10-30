import Phaser from 'phaser';
import { COLORS, EFFECTS, cssRgba } from '../theme';

const FOG_TEXTURE_KEY = 'fog';
const FOG_TEXTURE_WIDTH = 512;
const FOG_TEXTURE_HEIGHT = 320;
const FOG_PUFF_COUNT = 14;
const FOG_PUFF_MIN_RADIUS = 40;
const FOG_PUFF_MAX_RADIUS = 110;
const FOG_PUFF_ALPHA = 0.35;
// Semente fixa: a névoa tem sempre o mesmo desenho, o que facilita comparar telas.
const FOG_SEED = 'nevoa';

function drawPuff(context: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, cssRgba(COLORS.textMuted, FOG_PUFF_ALPHA));
  gradient.addColorStop(1, cssRgba(COLORS.textMuted, 0));
  context.fillStyle = gradient;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

// Cada nuvem é desenhada também uma largura à esquerda e à direita: assim a borda esquerda
// da textura casa com a direita e a repetição horizontal não mostra emenda.
function createFogTexture(scene: Phaser.Scene): void {
  const texture = scene.textures.createCanvas(
    FOG_TEXTURE_KEY,
    FOG_TEXTURE_WIDTH,
    FOG_TEXTURE_HEIGHT,
  );
  if (!texture) {
    throw new Error('Não foi possível criar a textura da névoa.');
  }
  const context = texture.getContext();
  const random = new Phaser.Math.RandomDataGenerator([FOG_SEED]);
  for (let puff = 0; puff < FOG_PUFF_COUNT; puff++) {
    const x = random.between(0, FOG_TEXTURE_WIDTH);
    // Na vertical a textura não se repete, então nenhuma nuvem pode ser cortada pelas bordas.
    const y = random.between(FOG_PUFF_MAX_RADIUS, FOG_TEXTURE_HEIGHT - FOG_PUFF_MAX_RADIUS);
    const radius = random.between(FOG_PUFF_MIN_RADIUS, FOG_PUFF_MAX_RADIUS);
    for (const offsetX of [-FOG_TEXTURE_WIDTH, 0, FOG_TEXTURE_WIDTH]) {
      drawPuff(context, x + offsetX, y, radius);
    }
  }
  texture.refresh();
}

// Desenha a textura na primeira vez e devolve a chave. Também usada pelo BackgroundSystem
// como fundo provisório da fase, para os dois lugares terem a mesma névoa.
export function ensureFogTexture(scene: Phaser.Scene): string {
  if (!scene.textures.exists(FOG_TEXTURE_KEY)) {
    createFogTexture(scene);
  }
  return FOG_TEXTURE_KEY;
}

export function addFogLayers(scene: Phaser.Scene): void {
  ensureFogTexture(scene);
  const { width, height } = scene.scale;
  for (const layer of EFFECTS.fogLayers) {
    const layerHeight = height * layer.heightRatio;
    const fog = scene.add
      .tileSprite(0, height - layerHeight, width, layerHeight, FOG_TEXTURE_KEY)
      .setOrigin(0)
      .setAlpha(layer.alpha)
      // Estica a textura para caber uma única vez na altura da camada: repetida na vertical,
      // ela mostraria uma linha reta onde uma cópia encosta na outra.
      .setTileScale(1, layerHeight / FOG_TEXTURE_HEIGHT);
    // Deslocar exatamente uma largura de textura faz o loop recomeçar sem salto visível.
    scene.tweens.add({
      targets: fog,
      tilePositionX: FOG_TEXTURE_WIDTH,
      duration: layer.driftDurationMs,
      repeat: -1,
    });
  }
}
