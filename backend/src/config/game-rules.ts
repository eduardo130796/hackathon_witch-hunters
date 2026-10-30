// Valores da fórmula de pontuação (seção 6 do CLAUDE.md). Alterar aqui muda o jogo inteiro.
export const GAME_RULES = {
  witchPoints: 100,
  innocentPenalty: 250,
  damagePenalty: 5,
  timeLimitSeconds: 300,
  timeBonusPerSecond: 10,
} as const;
