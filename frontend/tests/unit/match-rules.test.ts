import { describe, expect, it } from 'vitest';
import { isVictory, resolveDeath } from '../../src/domain/match-rules';

describe('resolveDeath', () => {
  it('respawna enquanto há tentativas', () => {
    expect(resolveDeath(0, 3)).toBe('respawn');
    expect(resolveDeath(2, 3)).toBe('respawn');
  });

  it('encerra a partida quando os respawns acabam', () => {
    expect(resolveDeath(3, 3)).toBe('defeat');
  });

  it('sem respawns permitidos, a primeira morte é final', () => {
    expect(resolveDeath(0, 0)).toBe('defeat');
  });
});

describe('isVictory', () => {
  it('vence na zona final com o chefe derrotado', () => {
    expect(isVictory({ playerX: 4800, finalZoneStartX: 4800, bossDefeated: true })).toBe(true);
  });

  it('não vence na zona final com o chefe vivo', () => {
    expect(isVictory({ playerX: 5000, finalZoneStartX: 4800, bossDefeated: false })).toBe(false);
  });

  it('não vence antes da zona final, mesmo com o chefe derrotado', () => {
    expect(isVictory({ playerX: 4799, finalZoneStartX: 4800, bossDefeated: true })).toBe(false);
  });
});
