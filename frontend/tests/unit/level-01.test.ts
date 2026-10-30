import { describe, expect, it } from 'vitest';
import { WITCH_DETECTION_RADIUS } from '../../src/config/balance';
import { LEVEL_01, segmentAt } from '../../src/levels/level-01';

const { segments, checkpoints } = LEVEL_01;
const allSpawns = segments.flatMap((segment) => segment.enemySpawns);

describe('LEVEL_01', () => {
  it('tem os quatro trechos na ordem da fase', () => {
    expect(segments.map((segment) => segment.id)).toEqual([
      'graveyard',
      'ruins',
      'catacombs',
      'boss-arena',
    ]);
  });

  it('cobre o mundo inteiro, sem buracos nem sobreposição entre trechos', () => {
    expect(segments[0]?.startX).toBe(0);
    expect(segments[segments.length - 1]?.endX).toBe(LEVEL_01.worldWidth);
    segments.slice(1).forEach((segment, index) => {
      expect(segment.startX).toBe(segments[index]?.endX);
    });
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

  it('tem exatamente um chefe, na arena, antes da zona final', () => {
    const bosses = allSpawns.filter((spawn) => spawn.type === 'boss');
    expect(bosses).toHaveLength(1);
    expect(segmentAt(LEVEL_01, bosses[0]?.x ?? -1).id).toBe('boss-arena');
    expect(bosses[0]?.x ?? Infinity).toBeLessThan(LEVEL_01.finalZoneStartX);
  });

  it('deixa os trechos avançados com mais bruxas que o primeiro', () => {
    const witchCount = (index: number): number =>
      segments[index]?.enemySpawns.filter((spawn) => spawn.type !== 'innocent').length ?? 0;
    expect(witchCount(1)).toBeGreaterThan(witchCount(0));
    expect(witchCount(2)).toBeGreaterThan(witchCount(1));
    expect(witchCount(3)).toBeGreaterThan(witchCount(0));
  });

  it('aumenta a atenção das bruxas a cada trecho', () => {
    expect(segments[0]?.witchDetectionRadius).toBeUndefined();
    const radii = segments.slice(1).map((segment) => segment.witchDetectionRadius ?? 0);
    radii.slice(1).forEach((radius, index) => {
      expect(radius).toBeGreaterThan(radii[index] ?? Infinity);
    });
  });

  it('começa cada trecho seguinte num ponto de controle e marca a arena', () => {
    expect(checkpoints.map((checkpoint) => checkpoint.x)).toEqual(
      segments.slice(1).map((segment) => segment.startX),
    );
    expect(checkpoints.map((checkpoint) => checkpoint.id)).toContain(
      LEVEL_01.bossArenaCheckpointId,
    );
  });

  it('não começa a partida perto de uma bruxa', () => {
    const nearestWitch = Math.min(
      ...allSpawns.filter((spawn) => spawn.type === 'witch').map((spawn) => spawn.x),
    );
    expect(nearestWitch - LEVEL_01.playerStartX).toBeGreaterThan(WITCH_DETECTION_RADIUS);
  });
});

describe('segmentAt', () => {
  it('encontra o trecho pela posição, com o início incluído e o fim excluído', () => {
    expect(segmentAt(LEVEL_01, 0).id).toBe('graveyard');
    expect(segmentAt(LEVEL_01, 1599).id).toBe('graveyard');
    expect(segmentAt(LEVEL_01, 1600).id).toBe('ruins');
    expect(segmentAt(LEVEL_01, 3400).id).toBe('catacombs');
    expect(segmentAt(LEVEL_01, 5200).id).toBe('boss-arena');
  });

  it('usa o trecho da ponta fora dos limites do mundo', () => {
    expect(segmentAt(LEVEL_01, -10).id).toBe('graveyard');
    expect(segmentAt(LEVEL_01, LEVEL_01.worldWidth).id).toBe('boss-arena');
  });
});
