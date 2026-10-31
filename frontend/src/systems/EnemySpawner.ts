import Phaser from 'phaser';
import { countsForGate } from '../domain/segment-gates';
import { Boss } from '../entities/Boss';
import type { ApproachPlan, EnemyPlacement } from '../entities/Enemy';
import { Innocent } from '../entities/Innocent';
import type { Player } from '../entities/Player';
import { Werewolf } from '../entities/Werewolf';
import { Witch, type WitchTraits } from '../entities/Witch';
import { Wolf } from '../entities/Wolf';
import {
  BOSS_TYPES,
  type EnemySpawn,
  type LevelLayout,
  type LevelSegment,
} from '../levels/level-01';

// Inimigo com barra de vida fixa no HUD enquanto o jogador está no trecho dele. Só a pergunta
// da vida, para a barra servir também ao demônio, que não é uma Witch.
export interface FeaturedEnemy {
  enemy: { getHealthRatio(): number };
  label: string;
  segmentId: string;
}

interface SpawnedEnemies {
  // Inclui chefes, lobos e lobisomem: para o combate e para a pontuação, todos são bruxas.
  witches: Witch[];
  innocents: Innocent[];
  // Chefes que precisam estar derrotados para a vitória.
  bosses: Witch[];
  featured: FeaturedEnemy[];
  // O que cada inimigo faz quando a fala de um gatilho termina (acordar e lutar, ou fugir),
  // pelo id do gatilho.
  reactionsByTrigger: Map<string, (() => void)[]>;
  // Hostis que o portão de cada trecho espera morrer (countsForGate), pelo id do trecho.
  hostilesBySegment: Map<string, Witch[]>;
}

function placementOf(spawn: EnemySpawn): EnemyPlacement {
  return {
    x: spawn.x,
    groundY: spawn.y,
    patrolFromX: spawn.x - spawn.patrolHalfWidth,
    patrolToX: spawn.x + spawn.patrolHalfWidth,
  };
}

// A dificuldade do trecho (raio de detecção) vale só para bruxas comuns: lobos, lobisomem e
// chefes têm seus próprios números, que o trecho não deve sobrescrever.
function traitsFor(
  spawn: EnemySpawn,
  segment: LevelSegment,
  approachPlan: ApproachPlan | undefined,
): Partial<WitchTraits> {
  const traits: Partial<WitchTraits> = { approachPlan };
  if (spawn.type === 'witch' && segment.witchDetectionRadius !== undefined) {
    traits.detectionRadius = segment.witchDetectionRadius;
  }
  if (spawn.awakenedByTrigger !== undefined || spawn.approachTrigger !== undefined) {
    traits.startsDormant = true;
  }
  return traits;
}

function createHostile(
  scene: Phaser.Scene,
  spawn: EnemySpawn,
  segment: LevelSegment,
  player: Player,
  approachPlan: ApproachPlan | undefined,
): Witch {
  const placement = placementOf(spawn);
  switch (spawn.type) {
    case 'boss':
      return new Boss(scene, placement, player);
    case 'wolf':
      return new Wolf(scene, placement, player, traitsFor(spawn, segment, approachPlan));
    case 'werewolf':
      return new Werewolf(scene, placement, player, traitsFor(spawn, segment, approachPlan));
    default:
      return new Witch(scene, placement, player, traitsFor(spawn, segment, approachPlan));
  }
}

// Quem reage aos encontros, pelo id do gatilho: no início o jogador para; na chegada abre a fala.
interface ApproachHandlers {
  // Pelo id do trecho: o encontro só começa com o trecho limpo (SegmentGateSystem).
  canStart: (segmentId: string) => boolean;
  onStart: (triggerId: string) => void;
  onArrive: (triggerId: string) => void;
}

// Encontro do personagem que vem falar com o jogador (approachTrigger em level-01.ts): ao
// chegar, ele pede a fala do gatilho.
function approachPlanFor(
  spawn: EnemySpawn,
  segmentId: string,
  player: Player,
  handlers: ApproachHandlers,
): ApproachPlan | undefined {
  const triggerId = spawn.approachTrigger;
  if (triggerId === undefined) {
    return undefined;
  }
  return {
    target: player,
    canStart: () => handlers.canStart(segmentId),
    onStart: () => handlers.onStart(triggerId),
    onArrive: () => handlers.onArrive(triggerId),
  };
}

// Cria os inimigos de cada trecho a partir de levels/level-01.ts. A dificuldade do trecho é
// aplicada no nascimento: cada inimigo pertence a um único trecho, então o efeito é o mesmo
// de mudá-lo ao cruzar a borda, sem estado extra para controlar.
export function spawnLevelEnemies(
  scene: Phaser.Scene,
  level: LevelLayout,
  player: Player,
  approachHandlers: ApproachHandlers,
): SpawnedEnemies {
  const spawned: SpawnedEnemies = {
    witches: [],
    innocents: [],
    bosses: [],
    featured: [],
    reactionsByTrigger: new Map(),
    hostilesBySegment: new Map(),
  };
  for (const segment of level.segments) {
    for (const spawn of segment.enemySpawns) {
      const approachPlan = approachPlanFor(spawn, segment.id, player, approachHandlers);
      if (spawn.type === 'innocent') {
        spawned.innocents.push(new Innocent(scene, placementOf(spawn), approachPlan));
        continue;
      }
      const hostile = createHostile(scene, spawn, segment, player, approachPlan);
      registerHostile(spawned, spawn, segment, hostile);
    }
  }
  // A vitória depende de derrotar os chefes comuns: sem nenhum, a regra perderia o sentido.
  if (spawned.bosses.length === 0) {
    throw new Error('A fase precisa de pelo menos um chefe.');
  }
  return spawned;
}

function registerHostile(
  spawned: SpawnedEnemies,
  spawn: EnemySpawn,
  segment: LevelSegment,
  enemy: Witch,
): void {
  spawned.witches.push(enemy);
  if (BOSS_TYPES.includes(spawn.type)) {
    spawned.bosses.push(enemy);
  }
  if (countsForGate(spawn)) {
    const hostiles = spawned.hostilesBySegment.get(segment.id) ?? [];
    hostiles.push(enemy);
    spawned.hostilesBySegment.set(segment.id, hostiles);
  }
  if (spawn.healthBarLabel !== undefined) {
    spawned.featured.push({ enemy, label: spawn.healthBarLabel, segmentId: segment.id });
  }
  if (spawn.awakenedByTrigger !== undefined) {
    addReaction(spawned, spawn.awakenedByTrigger, () => enemy.awaken());
  }
  if (spawn.fleesAfterTrigger !== undefined) {
    addReaction(spawned, spawn.fleesAfterTrigger, () => enemy.flee());
  }
}

function addReaction(spawned: SpawnedEnemies, triggerId: string, reaction: () => void): void {
  const reactions = spawned.reactionsByTrigger.get(triggerId) ?? [];
  reactions.push(reaction);
  spawned.reactionsByTrigger.set(triggerId, reactions);
}
