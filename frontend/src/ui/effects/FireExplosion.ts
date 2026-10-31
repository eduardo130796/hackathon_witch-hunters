import Phaser from 'phaser';
import { COLORS, DEMON_VISUALS } from '../theme';

const EMBER_TEXTURE_KEY = 'fire-ember';
const FULL_CIRCLE_DEGREES = 360;

// A brasa é um círculo branco desenhado uma vez; a cor vem do tint das partículas, assim uma
// só textura serve para o laranja e o vermelho.
function ensureEmberTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(EMBER_TEXTURE_KEY)) {
    return;
  }
  const { radius } = DEMON_VISUALS.explosion;
  const graphics = scene.add.graphics();
  graphics.fillStyle(COLORS.text);
  graphics.fillCircle(radius, radius, radius);
  graphics.generateTexture(EMBER_TEXTURE_KEY, radius * 2, radius * 2);
  graphics.destroy();
}

// Explosão do impacto da bola de fogo, feita por código como o sangue (BloodSplatter): brasas
// laranja e vermelhas em todas as direções, que caem e somem. O emissor se destrói sozinho.
export function spawnFireExplosion(scene: Phaser.Scene, x: number, y: number): void {
  ensureEmberTexture(scene);
  const settings = DEMON_VISUALS.explosion;
  const emitter = scene.add.particles(x, y, EMBER_TEXTURE_KEY, {
    emitting: false,
    angle: { min: 0, max: FULL_CIRCLE_DEGREES },
    speed: { min: settings.speedMin, max: settings.speedMax },
    gravityY: settings.gravityY,
    scale: { start: settings.scale, end: 0 },
    alpha: { start: 1, end: 0 },
    tint: [COLORS.accent, COLORS.danger],
    lifespan: settings.lifespanMs,
    blendMode: Phaser.BlendModes.ADD,
  });
  emitter.setDepth(DEMON_VISUALS.attackDepth);
  emitter.explode(settings.count);
  scene.time.delayedCall(settings.lifespanMs, () => emitter.destroy());
}
