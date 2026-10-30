// Cópia das regras de backend/src/config/game-rules.ts. Precisa ser idêntica ao servidor:
// aqui ela serve só para mostrar a pontuação durante a partida; o valor oficial vem da API.
export const SCORE_RULES = {
  witchPoints: 100,
  innocentPenalty: 250,
  damagePenalty: 5,
  timeLimitSeconds: 300,
  timeBonusPerSecond: 10,
} as const;
