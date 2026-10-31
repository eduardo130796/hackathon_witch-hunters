import { describe, expect, it } from 'vitest';
import { STORY_01 } from '../../src/levels/story-01';

describe('STORY_01', () => {
  it('tem entre 4 e 6 slides', () => {
    expect(STORY_01.length).toBeGreaterThanOrEqual(4);
    expect(STORY_01.length).toBeLessThanOrEqual(6);
  });

  it('não tem slide com título, texto ou fundo vazio', () => {
    for (const slide of STORY_01) {
      expect(slide.title.trim()).not.toBe('');
      expect(slide.text.trim()).not.toBe('');
      expect(slide.backgroundKey.trim()).not.toBe('');
    }
  });
});
