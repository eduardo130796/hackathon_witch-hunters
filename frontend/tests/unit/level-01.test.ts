import { describe, expect, it } from 'vitest';
import { NARRATIVE_APPROACH_START_RADIUS, WITCH_DETECTION_RADIUS } from '../../src/config/balance';
import { countsForGate } from '../../src/domain/segment-gates';
import { BOSS_TYPES, LEVEL_01, segmentAt } from '../../src/levels/level-01';
import { NARRATIVE_01 } from '../../src/levels/narrative-01';

const { segments, checkpoints } = LEVEL_01;
// GAME_WIDTH de config/game-config.ts, repetido aqui porque aquele arquivo importa o Phaser.
const GAME_WIDTH = 1280;
const allSpawns = segments.flatMap((segment) => segment.enemySpawns);

describe('LEVEL_01', () => {
  it('tem os cinco trechos na ordem da fase', () => {
    expect(segments.map((segment) => segment.id)).toEqual([
      'graveyard',
      'forest',
      'catacombs',
      'boss-arena',
      'final-stage',
    ]);
  });

  it('cobre o mundo inteiro, sem buracos nem sobreposição entre trechos', () => {
    expect(segments[0]?.startX).toBe(0);
    expect(segments[segments.length - 1]?.endX).toBe(LEVEL_01.worldWidth);
    segments.slice(1).forEach((segment, index) => {
      expect(segment.startX).toBe(segments[index]?.endX);
    });
  });

  it('dá a cada trecho um nome e um subtítulo curtos para o cartão de título', () => {
    for (const segment of segments) {
      expect(segment.displayName.length).toBeGreaterThan(0);
      expect(segment.subtitle.length).toBeGreaterThan(0);
    }
  });

  it('coloca cada inimigo dentro do seu trecho e sobre o chão', () => {
    for (const segment of segments) {
      for (const spawn of segment.enemySpawns) {
        expect(spawn.x - spawn.patrolHalfWidth).toBeGreaterThanOrEqual(segment.startX);
        expect(spawn.x + spawn.patrolHalfWidth).toBeLessThanOrEqual(segment.endX);
        expect(spawn.y).toBe(LEVEL_01.groundY);
      }
    }
  });

  it('põe o chefe na arena e nenhum chefe comum no trecho final', () => {
    const bosses = allSpawns.filter((spawn) => BOSS_TYPES.includes(spawn.type));
    expect(bosses.map((spawn) => segmentAt(LEVEL_01, spawn.x).id)).toEqual(['boss-arena']);
  });

  it('põe a arena do demônio no fim do trecho final, com uma tela de largura', () => {
    const { demonArena, worldWidth } = LEVEL_01;
    expect(segmentAt(LEVEL_01, demonArena.startX).id).toBe('final-stage');
    expect(demonArena.left).toBe(demonArena.startX);
    expect(demonArena.right).toBe(worldWidth);
    expect(demonArena.right - demonArena.left).toBe(GAME_WIDTH);
  });

  it('deixa as bruxas do trecho final antes da arena do demônio', () => {
    const finalStage = segments.find((segment) => segment.id === 'final-stage');
    const hostiles = (finalStage?.enemySpawns ?? []).filter((spawn) => spawn.type !== 'innocent');
    expect(hostiles.length).toBeGreaterThan(0);
    for (const spawn of hostiles) {
      expect(spawn.x + spawn.patrolHalfWidth).toBeLessThan(LEVEL_01.demonArena.startX);
    }
  });

  it('põe lobos e um único lobisomem na floresta', () => {
    const forest = segments.find((segment) => segment.id === 'forest');
    const count = (type: string): number =>
      forest?.enemySpawns.filter((spawn) => spawn.type === type).length ?? 0;
    expect(count('wolf')).toBeGreaterThanOrEqual(2);
    expect(count('werewolf')).toBe(1);
  });

  it('dá barra de vida ao lobisomem e ao chefe da arena (a do demônio vem da arena)', () => {
    const withBar = allSpawns.filter((spawn) => spawn.healthBarLabel !== undefined);
    expect(withBar.map((spawn) => spawn.type)).toEqual(['werewolf', 'boss']);
  });

  it('aumenta a atenção das bruxas nos trechos que a ajustam', () => {
    const radii = segments
      .map((segment) => segment.witchDetectionRadius)
      .filter((radius): radius is number => radius !== undefined);
    radii.slice(1).forEach((radius, index) => {
      expect(radius).toBeGreaterThan(radii[index] ?? Infinity);
    });
  });

  it('começa cada trecho seguinte num ponto de controle', () => {
    expect(checkpoints.slice(0, -1).map((checkpoint) => checkpoint.x)).toEqual(
      segments.slice(1).map((segment) => segment.startX),
    );
  });

  it('põe o último ponto de controle dentro da arena do demônio, antes da provocação', () => {
    const arenaCheckpoint = checkpoints[checkpoints.length - 1];
    const taunt = NARRATIVE_01.find((trigger) => trigger.id === LEVEL_01.demonArena.tauntTriggerId);
    // Longe da parede da entrada: o jogador renasce inteiro dentro da arena.
    expect(arenaCheckpoint?.x ?? 0).toBeGreaterThan(LEVEL_01.demonArena.left + 100);
    expect(arenaCheckpoint?.x ?? Infinity).toBeLessThan(taunt?.x ?? 0);
  });

  it('fecha cada trecho com hostis num portão, depois de todos eles e antes do ponto de controle seguinte', () => {
    for (const segment of segments) {
      const hostiles = segment.enemySpawns.filter(countsForGate);
      if (hostiles.length === 0) {
        expect(segment.gateX).toBeUndefined();
        continue;
      }
      const gateX = segment.gateX ?? -1;
      expect(gateX).toBeGreaterThan(segment.startX);
      for (const hostile of hostiles) {
        expect(hostile.x + hostile.patrolHalfWidth).toBeLessThan(gateX);
      }
      const nextCheckpoint = checkpoints.find((checkpoint) => checkpoint.x > gateX);
      expect(nextCheckpoint?.x ?? Infinity).toBeGreaterThan(gateX + 64);
    }
  });

  it('não começa a partida perto de uma bruxa', () => {
    const nearestWitch = Math.min(
      ...allSpawns.filter((spawn) => spawn.type === 'witch').map((spawn) => spawn.x),
    );
    expect(nearestWitch - LEVEL_01.playerStartX).toBeGreaterThan(WITCH_DETECTION_RADIUS);
  });
});

describe('NARRATIVE_01', () => {
  const triggerById = new Map(NARRATIVE_01.map((trigger) => [trigger.id, trigger]));

  it('tem ids únicos e falas não vazias', () => {
    expect(triggerById.size).toBe(NARRATIVE_01.length);
    for (const trigger of NARRATIVE_01) {
      expect(trigger.lines.length).toBeGreaterThan(0);
    }
  });

  it('abre com a Anciã, a única personagem do cemitério, que vem ao encontro do jogador', () => {
    const graveyard = segments.find((segment) => segment.id === 'graveyard');
    const [elder, ...others] = graveyard?.enemySpawns ?? [];
    expect(others).toEqual([]);
    expect(elder?.type).toBe('innocent');
    expect(elder?.approachTrigger).toBe('intro-warning');
    expect(triggerById.get('intro-warning')?.speaker).toBe('Anciã');
    // Nasce fora do raio de encontro: o jogador anda um pouco e a vê chegar.
    expect((elder?.x ?? 0) - LEVEL_01.playerStartX).toBeGreaterThan(
      NARRATIVE_APPROACH_START_RADIUS,
    );
  });

  it('liga cada encontro a um gatilho sem zona, e cada zona a um x dentro do mundo', () => {
    const approachIds = allSpawns.flatMap((spawn) => spawn.approachTrigger ?? []);
    for (const id of approachIds) {
      expect(triggerById.get(id)?.x).toBeUndefined();
    }
    for (const trigger of NARRATIVE_01.filter((candidate) => candidate.x !== undefined)) {
      expect(trigger.x ?? -1).toBeGreaterThanOrEqual(0);
      expect(trigger.x ?? Infinity).toBeLessThan(LEVEL_01.worldWidth);
    }
  });

  it('liga toda reação a uma fala (acordar, fugir, chegar) a um gatilho que existe', () => {
    const ids = allSpawns.flatMap((spawn) => [
      spawn.awakenedByTrigger ?? [],
      spawn.fleesAfterTrigger ?? [],
      spawn.approachTrigger ?? [],
    ]);
    for (const id of ids.flat()) {
      expect(triggerById.get(id)).toBeDefined();
    }
  });

  it('provoca no fim da floresta, com a única bruxa do trecho, depois do lobisomem', () => {
    const forest = segments.find((segment) => segment.id === 'forest');
    const spawns = forest?.enemySpawns ?? [];
    const witches = spawns.filter((spawn) => spawn.type === 'witch');
    const werewolf = spawns.find((spawn) => spawn.type === 'werewolf');
    expect(witches.map((witch) => witch.approachTrigger)).toEqual(['witch-taunt']);
    // Depois da fala ela foge, sem lutar.
    expect(witches[0]?.fleesAfterTrigger).toBe('witch-taunt');
    expect(witches[0]?.awakenedByTrigger).toBeUndefined();
    // Ela só começa a vir quando o jogador passa da patrulha do lobisomem.
    const werewolfEnd = (werewolf?.x ?? Infinity) + (werewolf?.patrolHalfWidth ?? 0);
    expect((witches[0]?.x ?? 0) - werewolfEnd).toBeGreaterThan(NARRATIVE_APPROACH_START_RADIUS);
  });

  it('deixa nas catacumbas só bruxas comuns, sem provocação', () => {
    const catacombs = segments.find((segment) => segment.id === 'catacombs');
    const spawns = catacombs?.enemySpawns ?? [];
    expect(spawns.every((spawn) => spawn.type === 'witch')).toBe(true);
    expect(spawns.length).toBeGreaterThanOrEqual(3);
    expect(spawns.length).toBeLessThanOrEqual(4);
    expect(spawns.every((spawn) => spawn.awakenedByTrigger === undefined)).toBe(true);
  });

  it('provoca na arena do demônio, com a câmera já travada', () => {
    const taunt = triggerById.get(LEVEL_01.demonArena.tauntTriggerId);
    expect(taunt?.speaker).toBe('Demônio');
    expect(taunt?.x ?? -1).toBeGreaterThan(LEVEL_01.demonArena.startX);
    expect(taunt?.x ?? Infinity).toBeLessThan(LEVEL_01.demonArena.right);
  });
});

describe('segmentAt', () => {
  it('encontra o trecho pela posição, com o início incluído e o fim excluído', () => {
    expect(segmentAt(LEVEL_01, 0).id).toBe('graveyard');
    expect(segmentAt(LEVEL_01, 1599).id).toBe('graveyard');
    expect(segmentAt(LEVEL_01, 1600).id).toBe('forest');
    expect(segmentAt(LEVEL_01, 3400).id).toBe('catacombs');
    expect(segmentAt(LEVEL_01, 5200).id).toBe('boss-arena');
    expect(segmentAt(LEVEL_01, 6920).id).toBe('final-stage');
  });

  it('usa o trecho da ponta fora dos limites do mundo', () => {
    expect(segmentAt(LEVEL_01, -10).id).toBe('graveyard');
    expect(segmentAt(LEVEL_01, LEVEL_01.worldWidth).id).toBe('final-stage');
  });
});
