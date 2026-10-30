import Phaser from 'phaser';
import { COLORS, EFFECTS, TIMING_MS } from '../theme';
import { addScreenOverlay } from './DamageFlash';

export interface DeathShade {
  darken(): void;
  clear(): void;
}

// Escurece a tela quando o jogador morre. A entrada é lenta, para a morte pesar, e para em
// opacidade alta mas não total: o cenário continua visível ao fundo e o jogador ainda vê onde
// caiu. A cor é a do fundo do tema, quase preta, para o escurecimento combinar com a vinheta.
export function addDeathShade(scene: Phaser.Scene): DeathShade {
  const overlay = addScreenOverlay(scene, {
    color: COLORS.background,
    depth: EFFECTS.deathShade.depth,
  });
  const fadeTo = (alpha: number, duration: number): void => {
    // Sem isso, um respawn no meio do escurecimento teria dois tweens disputando a opacidade.
    scene.tweens.killTweensOf(overlay);
    scene.tweens.add({ targets: overlay, alpha, duration });
  };
  return {
    darken: () => fadeTo(EFFECTS.deathShade.alpha, TIMING_MS.slow),
    // Clarear é mais rápido que escurecer: depois do respawn o jogador precisa ver a cena logo.
    clear: () => fadeTo(0, TIMING_MS.normal),
  };
}
