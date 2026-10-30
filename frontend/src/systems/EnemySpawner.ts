import Phaser from 'phaser';
import { Boss } from '../entities/Boss';
import type { EnemyPlacement } from '../entities/Enemy';
import { Innocent } from '../entities/Innocent';
import type { Player } from '../entities/Player';
import { Witch } from '../entities/Witch';
import type { EnemySpawn, LevelLayout, LevelSegment } from '../levels/level-01';

interface SpawnedEnemies {
  // Inclui o chefe: para o combate, ele é uma bruxa.
  witches: Witch[];
  innocents: Innocent[];
  boss: Boss;
}

function placementOf(spawn: EnemySpawn): EnemyPlacement {
  return {
    x: spawn.x,
    groundY: spawn.y,
    patrolFromX: spawn.x - spawn.patrolHalfWidth,
    patrolToX: spawn.x + spawn.patrolHalfWidth,
  };
}

// Cria os inimigos de cada trecho a partir de levels/level-01.ts. A dificuldade do trecho
// (raio de detecção) é aplicada no nascimento: cada bruxa pertence a um único trecho, então
// o efeito é o mesmo de mudá-la ao cruzar a borda, sem estado extra para controlar.
export function spawnLevelEnemies(
  scene: Phaser.Scene,
  level: LevelLayout,
  player: Player,
): SpawnedEnemies {
  const witches: Witch[] = [];
  const innocents: Innocent[] = [];
  const bosses: Boss[] = [];
  for (const segment of level.segments) {
    for (const spawn of segment.enemySpawns) {
      const placement = placementOf(spawn);
      if (spawn.type === 'innocent') {
        innocents.push(new Innocent(scene, placement));
      } else if (spawn.type === 'boss') {
        bosses.push(new Boss(scene, placement, player));
      } else {
        witches.push(new Witch(scene, placement, player, witchOverrides(segment)));
      }
    }
  }
  const [boss] = bosses;
  // A vitória depende de derrotar um chefe: uma fase sem ele nunca terminaria.
  if (!boss || bosses.length > 1) {
    throw new Error('A fase precisa de exatamente um chefe.');
  }
  return { witches: [...witches, boss], innocents, boss };
}

function witchOverrides(segment: LevelSegment): { detectionRadius?: number } {
  return segment.witchDetectionRadius === undefined
    ? {}
    : { detectionRadius: segment.witchDetectionRadius };
}
