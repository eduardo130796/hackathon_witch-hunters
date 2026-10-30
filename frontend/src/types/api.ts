// Espelho dos contratos de backend/src: se a API mudar, estes tipos mudam junto.

export interface SubmitScoreRequest {
  nickname: string;
  witchesKilled: number;
  innocentsKilled: number;
  damageTaken: number;
  durationMs: number;
  usedInspector: boolean;
}

// O que a partida produz: tudo que o envio exige, menos o nick, que só existe na tela final.
export type MatchResult = Omit<SubmitScoreRequest, 'nickname'>;

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

// Resultado de qualquer chamada à API. As cenas tratam a falha como um valor comum, e não
// como exceção: assim um servidor fora do ar nunca derruba o jogo.
export type ApiResult<T> = { ok: true; data: T } | { ok: false; message: string };
