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
  it('vence com o chefe da arena e o demônio derrotados', () => {
    expect(isVictory({ allBossesDefeated: true, demonDefeated: true })).toBe(true);
  });

  it('não vence com o demônio vivo, mesmo com o chefe da arena derrotado', () => {
    expect(isVictory({ allBossesDefeated: true, demonDefeated: false })).toBe(false);
  });

  it('não vence com o chefe da arena vivo, mesmo com o demônio derrotado', () => {
    expect(isVictory({ allBossesDefeated: false, demonDefeated: true })).toBe(false);
  });
});
