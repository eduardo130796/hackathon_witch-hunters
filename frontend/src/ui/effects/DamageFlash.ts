import Phaser from 'phaser';
import { COLORS, EFFECTS, TIMING_MS } from '../theme';

interface ScreenOverlayConfig {
  color: number;
  depth: number;
}

// Retângulo do tamanho da tela, preso a ela (scrollFactor 0): a câmera segue o jogador num
// mundo mais largo que a tela, e sem isso o efeito ficaria para trás no cenário. Começa
// invisível; quem o usa controla a opacidade.
export function addScreenOverlay(
  scene: Phaser.Scene,
  config: ScreenOverlayConfig,
): Phaser.GameObjects.Rectangle {
  const { width, height } = scene.scale;
  return scene.add
    .rectangle(0, 0, width, height, config.color)
    .setOrigin(0)
    .setScrollFactor(0)
    .setDepth(config.depth)
    .setAlpha(0);
}

export interface DamageFlash {
  flash(): void;
}

// Pisca a tela de vermelho ao levar dano. Entrada rápida para o aviso coincidir com o golpe e
// saída um pouco mais lenta para o olho registrar a cor sem a tela ficar vermelha demais.
export function addDamageFlash(scene: Phaser.Scene): DamageFlash {
  const overlay = addScreenOverlay(scene, {
    color: COLORS.danger,
    depth: EFFECTS.damageFlash.depth,
  });
  return {
    flash: () => {
      // Um novo dano reinicia o flash em vez de empilhar tweens disputando a mesma opacidade.
      scene.tweens.killTweensOf(overlay);
      scene.tweens.chain({
        targets: overlay,
        tweens: [
          { alpha: EFFECTS.damageFlash.alpha, duration: TIMING_MS.fast },
          { alpha: 0, duration: TIMING_MS.normal },
        ],
      });
    },
  };
}
