import Phaser from 'phaser';
import { HealthBar } from '../ui/components/HealthBar';
import type { FeaturedEnemy } from './EnemySpawner';

interface PlacedBar {
  featured: FeaturedEnemy;
  bar: HealthBar;
}

// Barras de vida fixas no topo da tela: uma para cada inimigo de destaque (lobisomem da
// floresta, chefe da arena e o demônio). Todas ficam no mesmo lugar, então só a do trecho
// atual aparece; as outras somem. Assim cada luta tem sua barra sem a cena saber quantas
// existem.
export class BossBarSystem {
  private readonly bars: PlacedBar[] = [];
  private currentSegmentId?: string;

  constructor(
    private readonly scene: Phaser.Scene,
    featured: readonly FeaturedEnemy[],
  ) {
    featured.forEach((entry) => this.register(entry));
  }

  // Acrescenta uma barra depois da criação, para quem nasce no meio da fase (o demônio só
  // existe quando o jogador entra na arena). Se o jogador já está no trecho, ela aparece já.
  register(entry: FeaturedEnemy): void {
    const bar = new HealthBar(this.scene, entry.label);
    this.bars.push({ featured: entry, bar });
    if (entry.segmentId === this.currentSegmentId) {
      bar.show();
    }
  }

  // Chamado a cada quadro com o trecho onde o jogador está.
  update(segmentId: string): void {
    if (segmentId !== this.currentSegmentId) {
      this.currentSegmentId = segmentId;
      for (const { featured, bar } of this.bars) {
        if (featured.segmentId === segmentId) {
          bar.show();
        } else {
          bar.hide();
        }
      }
    }
    for (const { featured, bar } of this.bars) {
      bar.setRatio(featured.enemy.getHealthRatio());
    }
  }
}
