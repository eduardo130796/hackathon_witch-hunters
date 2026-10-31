// Regras puras do chefe demônio (sem Phaser), para serem testadas e explicadas sozinhas.

export type DemonAttackPattern = 'fireball' | 'claw';

// 'alternate' intercala os dois padrões, o que deixa a luta previsível e fácil de aprender;
// 'random' sorteia a cada ciclo, para quem já conhece a luta.
export type DemonAttackOrder = 'alternate' | 'random';

const PATTERNS: readonly DemonAttackPattern[] = ['fireball', 'claw'];

/**
 * Escolhe o próximo padrão de ataque do demônio.
 *
 * Regra: no modo 'alternate', o primeiro ataque é a bola de fogo (mais fácil de ler) e depois
 * os padrões se alternam. No modo 'random', cada ciclo sorteia um dos dois.
 *
 * @param previous Padrão do ciclo anterior, ou null no primeiro ataque.
 * @param order Modo de escolha (DEMON_ATTACK_ORDER).
 * @param randomValue Número em [0, 1); recebido de fora para o teste não depender de sorte.
 * @returns O padrão do próximo ciclo.
 */
export function nextDemonAttack(
  previous: DemonAttackPattern | null,
  order: DemonAttackOrder,
  randomValue: number,
): DemonAttackPattern {
  if (order === 'random') {
    const index = Math.min(PATTERNS.length - 1, Math.floor(randomValue * PATTERNS.length));
    return PATTERNS[index] ?? 'fireball';
  }
  return previous === 'fireball' ? 'claw' : 'fireball';
}

/**
 * Diz se o jogador está dentro da zona de impacto de um ataque.
 *
 * Regra: só a distância horizontal conta, porque bola de fogo e garra atingem uma faixa do
 * chão inteira; a borda do raio ainda acerta, para o aviso no chão ser exatamente a zona.
 *
 * @param targetX X do centro do jogador.
 * @param impactX X do centro do impacto.
 * @param radius Meia largura da zona de impacto, em px.
 */
export function isWithinImpactRadius(targetX: number, impactX: number, radius: number): boolean {
  return Math.abs(targetX - impactX) <= radius;
}

export interface ArenaSpan {
  left: number;
  right: number;
}

interface ImpactTargetsInput {
  playerX: number;
  arena: ArenaSpan;
  count: number;
  // Distância entre dois impactos vizinhos, em px.
  spacing: number;
  // Folga das paredes, em px, para o impacto não ficar meio fora da arena.
  margin: number;
}

/**
 * Calcula onde os ataques do demônio vão cair (bolas de fogo, garra).
 *
 * Regra: o primeiro impacto mira o jogador; os seguintes se afastam dele, sempre para o lado com mais
 * espaço na arena, para o jogador ter para onde fugir. Todas ficam dentro da arena.
 *
 * @returns Posições X no mundo, uma por impacto.
 */
export function pickImpactTargets(input: ImpactTargetsInput): number[] {
  const { playerX, arena, count, spacing, margin } = input;
  const minX = arena.left + margin;
  const maxX = arena.right - margin;
  const clamp = (x: number): number => Math.min(maxX, Math.max(minX, x));
  const first = clamp(playerX);
  const center = (arena.left + arena.right) / 2;
  // O lado com mais espaço é o do centro da arena em relação ao jogador.
  const direction = first <= center ? 1 : -1;
  return Array.from({ length: count }, (_, index) => clamp(first + direction * spacing * index));
}
