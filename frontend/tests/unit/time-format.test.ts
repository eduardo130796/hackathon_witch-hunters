import { describe, expect, it } from 'vitest';
import { formatElapsed } from '../../src/domain/time-format';

describe('formatElapsed', () => {
  it('formata o início da partida', () => {
    expect(formatElapsed(0)).toBe('00:00');
  });

  it('arredonda os segundos para baixo', () => {
    expect(formatElapsed(65_999)).toBe('01:05');
  });

  it('não corta minutos acima de 99', () => {
    expect(formatElapsed(6_000_000)).toBe('100:00');
  });

  it('trata duração negativa como zero', () => {
    expect(formatElapsed(-500)).toBe('00:00');
  });
});
