import { describe, expect, it } from 'vitest';
import { countsForGate, isSegmentCleared } from '../../src/domain/segment-gates';

describe('countsForGate', () => {
  it('conta bruxas, lobos, lobisomem e chefe', () => {
    for (const type of ['witch', 'wolf', 'werewolf', 'boss'] as const) {
      expect(countsForGate({ type })).toBe(true);
    }
  });

  it('não conta inocentes nem a bruxa que só provoca e foge', () => {
    expect(countsForGate({ type: 'innocent' })).toBe(false);
    expect(countsForGate({ type: 'witch', fleesAfterTrigger: 'witch-taunt' })).toBe(false);
  });
});

describe('isSegmentCleared', () => {
  it('fica fechado enquanto algum hostil vive', () => {
    expect(isSegmentCleared([false, true, false])).toBe(false);
  });

  it('abre com todos os hostis mortos', () => {
    expect(isSegmentCleared([false, false])).toBe(true);
  });

  it('um trecho sem hostis está sempre limpo', () => {
    expect(isSegmentCleared([])).toBe(true);
  });
});
