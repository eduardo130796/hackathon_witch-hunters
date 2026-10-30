// Espelho dos contratos de backend/src: se a API mudar, estes tipos mudam junto.

export interface SubmitScoreRequest {
  nickname: string;
  witchesKilled: number;
  innocentsKilled: number;
  damageTaken: number;
  durationMs: number;
  usedInspector: boolean;
}

export interface ScoreRecord extends SubmitScoreRequest {
  id: number;
  score: number;
  createdAt: string;
}

// A API devolve o ranking como uma lista simples, então um alias basta.
export type RankingResponse = ScoreRecord[];

export interface ApiErrorResponse {
  error: string;
  details?: { field: string; message: string }[];
}
