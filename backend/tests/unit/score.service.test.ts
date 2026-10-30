import { describe, expect, it, vi } from 'vitest';
import { calculateScore } from '../../src/services/score.service.js';

// O service importa o model, que criaria o pool do banco. O mock mantém o teste unitário
// independente do PostgreSQL e do .env.
vi.mock('../../src/models/score.model.js', () => ({
  insertScore: vi.fn(),
  findTopScores: vi.fn(),
}));

describe('calculateScore', () => {
  it('soma pontos das bruxas e o bônus de tempo em uma partida normal', () => {
    const score = calculateScore({
      witchesKilled: 3,
      innocentsKilled: 0,
      damageTaken: 0,
      durationMs: 60_000,
    });
    expect(score).toBe(2700);
  });

  it('desconta inocentes e dano', () => {
    const score = calculateScore({
      witchesKilled: 3,
      innocentsKilled: 1,
      damageTaken: 4,
      durationMs: 300_000,
    });
    expect(score).toBe(30);
  });

  it('converte pontuação negativa em zero', () => {
    const score = calculateScore({
      witchesKilled: 0,
      innocentsKilled: 2,
      damageTaken: 0,
      durationMs: 300_000,
    });
    expect(score).toBe(0);
  });

  it('não dá bônus de tempo acima do limite', () => {
    const score = calculateScore({
      witchesKilled: 1,
      innocentsKilled: 0,
      damageTaken: 0,
      durationMs: 600_000,
    });
    expect(score).toBe(100);
  });
});
