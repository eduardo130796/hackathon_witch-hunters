import { describe, expect, it } from 'vitest';
import { actionPoints, scoreBreakdown } from '../../src/domain/score-formula';

// Mesmos casos de backend/tests/unit/score.service.test.ts: se a fórmula divergir do servidor,
// um dos dois conjuntos de testes quebra.
describe('scoreBreakdown: total', () => {
  it('soma pontos das bruxas e o bônus de tempo em uma partida normal', () => {
    const score = scoreBreakdown({
      witchesKilled: 3,
      innocentsKilled: 0,
      damageTaken: 0,
      durationMs: 60_000,
    }).total;
    expect(score).toBe(2700);
  });

  it('desconta inocentes e dano', () => {
    const score = scoreBreakdown({
      witchesKilled: 3,
      innocentsKilled: 1,
      damageTaken: 4,
      durationMs: 300_000,
    }).total;
    expect(score).toBe(30);
  });

  it('converte pontuação negativa em zero', () => {
    const score = scoreBreakdown({
      witchesKilled: 0,
      innocentsKilled: 2,
      damageTaken: 0,
      durationMs: 300_000,
    }).total;
    expect(score).toBe(0);
  });

  it('não dá bônus de tempo acima do limite', () => {
    const score = scoreBreakdown({
      witchesKilled: 1,
      innocentsKilled: 0,
      damageTaken: 0,
      durationMs: 600_000,
    }).total;
    expect(score).toBe(100);
  });
});

describe('scoreBreakdown', () => {
  it('separa cada parcela da fórmula, com penalidades positivas', () => {
    expect(
      scoreBreakdown({ witchesKilled: 2, innocentsKilled: 1, damageTaken: 3, durationMs: 42_900 }),
    ).toEqual({
      witchPoints: 200,
      innocentPenalty: 250,
      damagePenalty: 15,
      elapsedSeconds: 42,
      timeBonus: 2580,
      total: 2515,
    });
  });
});

describe('actionPoints', () => {
  it('soma bruxas e penalidades sem o bônus de tempo', () => {
    const breakdown = scoreBreakdown({
      witchesKilled: 5,
      innocentsKilled: 1,
      damageTaken: 2,
      durationMs: 42_900,
    });
    expect(actionPoints(breakdown)).toBe(240);
  });

  it('não muda com o passar do tempo', () => {
    const counters = { witchesKilled: 3, innocentsKilled: 0, damageTaken: 0, durationMs: 0 };
    const atStart = actionPoints(scoreBreakdown(counters));
    const later = actionPoints(scoreBreakdown({ ...counters, durationMs: 200_000 }));
    expect(later).toBe(atStart);
  });

  it('pode ser negativo quando as penalidades superam as bruxas', () => {
    const breakdown = scoreBreakdown({
      witchesKilled: 1,
      innocentsKilled: 1,
      damageTaken: 0,
      durationMs: 0,
    });
    expect(actionPoints(breakdown)).toBe(-150);
  });
});
