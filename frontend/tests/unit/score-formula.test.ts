import { describe, expect, it } from 'vitest';
import { estimateScore } from '../../src/domain/score-formula';

// Mesmos casos de backend/tests/unit/score.service.test.ts: se a fórmula divergir do servidor,
// um dos dois conjuntos de testes quebra.
describe('estimateScore', () => {
  it('soma pontos das bruxas e o bônus de tempo em uma partida normal', () => {
    const score = estimateScore({
      witchesKilled: 3,
      innocentsKilled: 0,
      damageTaken: 0,
      durationMs: 60_000,
    });
    expect(score).toBe(2700);
  });

  it('desconta inocentes e dano', () => {
    const score = estimateScore({
      witchesKilled: 3,
      innocentsKilled: 1,
      damageTaken: 4,
      durationMs: 300_000,
    });
    expect(score).toBe(30);
  });

  it('converte pontuação negativa em zero', () => {
    const score = estimateScore({
      witchesKilled: 0,
      innocentsKilled: 2,
      damageTaken: 0,
      durationMs: 300_000,
    });
    expect(score).toBe(0);
  });

  it('não dá bônus de tempo acima do limite', () => {
    const score = estimateScore({
      witchesKilled: 1,
      innocentsKilled: 0,
      damageTaken: 0,
      durationMs: 600_000,
    });
    expect(score).toBe(100);
  });
});
