import Phaser from 'phaser';
import { COLORS, FONTS, TIMING_MS, VICTORY_BANNER, cssColor } from '../theme';

interface VictoryBannerOptions {
  x: number;
  titleY: number;
  subtitleY: number;
  title: string;
  subtitle: string;
}

const { embers } = VICTORY_BANNER;

// Cabeçalho da tela de resultado quando o jogador vence: título grande com brilho, que
// entra crescendo e depois respira, subtítulo e brasas subindo ao fundo. Chame antes de
// criar o painel de pontos, para as brasas ficarem atrás dele.
export function addVictoryBanner(scene: Phaser.Scene, options: VictoryBannerOptions): void {
  addEmbers(scene);
  addTitle(scene, options);
  const subtitle = scene.add
    .text(options.x, options.subtitleY, options.subtitle, {
      fontFamily: FONTS.body,
      fontSize: VICTORY_BANNER.subtitleFontSize,
      color: cssColor(COLORS.magic),
    })
    .setOrigin(0.5)
    .setAlpha(0);
  scene.tweens.add({
    targets: subtitle,
    alpha: 1,
    delay: TIMING_MS.normal,
    duration: TIMING_MS.slow,
  });
}

function addTitle(scene: Phaser.Scene, options: VictoryBannerOptions): void {
  const glow = cssColor(COLORS.accent);
  const title = scene.add
    .text(options.x, options.titleY, options.title, {
      fontFamily: FONTS.title,
      fontSize: VICTORY_BANNER.titleFontSize,
      fontStyle: 'bold',
      color: glow,
    })
    .setOrigin(0.5)
    .setPadding(VICTORY_BANNER.glowPadding)
    .setShadow(0, 0, glow, VICTORY_BANNER.glowBlur, true, true)
    .setScale(VICTORY_BANNER.startScale)
    .setAlpha(0);
  scene.tweens.add({
    targets: title,
    scale: 1,
    alpha: 1,
    duration: TIMING_MS.slow,
    ease: 'Back.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: title,
        scale: VICTORY_BANNER.pulseScale,
        duration: VICTORY_BANNER.pulseMs,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    },
  });
}

// Cada brasa nasce abaixo da tela, sobe até passar do topo enquanto some e recomeça. Atrasos
// sorteados espalham as brasas, para não subirem todas juntas como uma parede.
function addEmbers(scene: Phaser.Scene): void {
  const { width, height } = scene.scale;
  for (let index = 0; index < embers.count; index += 1) {
    const radius = Phaser.Math.FloatBetween(embers.minRadius, embers.maxRadius);
    const x = Phaser.Math.Between(0, width);
    // Alterna o laranja de destaque e o creme do texto, que lembram a aurora do epílogo.
    const color = index % 2 === 0 ? COLORS.accent : COLORS.text;
    const ember = scene.add.circle(x, height + radius, radius, color, embers.alpha);
    scene.tweens.add({
      targets: ember,
      y: -radius,
      x: x + Phaser.Math.Between(-embers.drift, embers.drift),
      alpha: 0,
      duration: Phaser.Math.Between(embers.minRiseMs, embers.maxRiseMs),
      delay: Phaser.Math.Between(0, embers.maxRiseMs),
      repeat: -1,
    });
  }
}
