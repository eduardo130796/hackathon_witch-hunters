import { describe, expect, it } from 'vitest';
import {
  isWithinImpactRadius,
  nextDemonAttack,
  pickImpactTargets,
} from '../../src/domain/demon-rules';

describe('nextDemonAttack', () => {
  it('no modo alternado começa pela bola de fogo e alterna', () => {
    expect(nextDemonAttack(null, 'alternate', 0.9)).toBe('fireball');
    expect(nextDemonAttack('fireball', 'alternate', 0.9)).toBe('claw');
    expect(nextDemonAttack('claw', 'alternate', 0.1)).toBe('fireball');
  });

  it('no modo aleatório usa o número sorteado', () => {
    expect(nextDemonAttack('fireball', 'random', 0)).toBe('fireball');
    expect(nextDemonAttack('fireball', 'random', 0.99)).toBe('claw');
  });
});

describe('isWithinImpactRadius', () => {
  it('acerta dentro do raio e na borda', () => {
    expect(isWithinImpactRadius(100, 150, 50)).toBe(true);
    expect(isWithinImpactRadius(200, 150, 50)).toBe(true);
  });

  it('erra fora do raio', () => {
    expect(isWithinImpactRadius(201, 150, 50)).toBe(false);
  });
});

describe('pickImpactTargets', () => {
  const arena = { left: 0, right: 1000 };

  it('mira o jogador e afasta a segunda bola para o lado com mais espaço', () => {
    expect(pickImpactTargets({ playerX: 200, arena, count: 2, spacing: 300, margin: 50 })).toEqual([
      200, 500,
    ]);
    expect(pickImpactTargets({ playerX: 800, arena, count: 2, spacing: 300, margin: 50 })).toEqual([
      800, 500,
    ]);
  });

  it('mantém os impactos dentro da arena', () => {
    expect(pickImpactTargets({ playerX: -100, arena, count: 1, spacing: 300, margin: 50 })).toEqual(
      [50],
    );
  });
});
