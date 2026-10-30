import Phaser from 'phaser';
import {
  BLOOD_DROPLET_RADIUS,
  BLOOD_GRAVITY_Y,
  BLOOD_LIFT_DEGREES,
  BLOOD_SPLATTER,
  BLOOD_SPREAD_DEGREES,
} from '../../config/balance';
import { COLORS, EFFECTS } from '../theme';

type BloodIntensity = keyof typeof BLOOD_SPLATTER;

const DROPLET_TEXTURE_KEY = 'blood-droplet';
// Ângulo do Phaser que aponta para a esquerda (0 é direita, crescendo no sentido horário).
const LEFT_ANGLE_DEGREES = 180;

// A gota é um círculo na cor de perigo do tema, desenhado uma vez e guardado nas texturas do
// jogo, para não depender de arquivo de imagem.
function ensureDropletTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(DROPLET_TEXTURE_KEY)) {
    return;
  }
  const diameter = BLOOD_DROPLET_RADIUS * 2;
  const graphics = scene.add.graphics();
  graphics.fillStyle(COLORS.danger);
  graphics.fillCircle(BLOOD_DROPLET_RADIUS, BLOOD_DROPLET_RADIUS, BLOOD_DROPLET_RADIUS);
  graphics.generateTexture(DROPLET_TEXTURE_KEY, diameter, diameter);
  graphics.destroy();
}

// O jato aponta para o lado do golpe e um pouco para cima: o sangue sai do lado oposto ao
// atacante, como se o golpe o empurrasse, e sobe antes de cair, o que o deixa mais visível.
function sprayCenterAngle(direction: 1 | -1): number {
  return direction === 1 ? -BLOOD_LIFT_DEGREES : LEFT_ANGLE_DEGREES + BLOOD_LIFT_DEGREES;
}

// Espirra gotas de sangue no ponto de impacto. 'hit' é um golpe comum; 'kill' tem mais gotas,
// maiores e mais rápidas, para a morte pesar mais. As gotas caem com gravidade leve, encolhem
// e somem; o emissor se destrói quando a última some, então nada se acumula numa partida longa.
export function spawnBloodSplatter(
  scene: Phaser.Scene,
  x: number,
  y: number,
  intensity: BloodIntensity,
  direction: 1 | -1 = 1,
): void {
  ensureDropletTexture(scene);
  const settings = BLOOD_SPLATTER[intensity];
  const centerAngle = sprayCenterAngle(direction);
  const emitter = scene.add.particles(x, y, DROPLET_TEXTURE_KEY, {
    emitting: false,
    angle: {
      min: centerAngle - BLOOD_SPREAD_DEGREES / 2,
      max: centerAngle + BLOOD_SPREAD_DEGREES / 2,
    },
    speed: { min: settings.speedMin, max: settings.speedMax },
    gravityY: BLOOD_GRAVITY_Y,
    scale: { start: settings.scale, end: 0 },
    alpha: { start: 1, end: 0 },
    lifespan: settings.lifespanMs,
  });
  emitter.setDepth(EFFECTS.blood.depth);
  emitter.explode(settings.count);
  scene.time.delayedCall(settings.lifespanMs, () => emitter.destroy());
}
