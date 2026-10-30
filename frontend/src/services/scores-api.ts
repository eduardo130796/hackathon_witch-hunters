import type {
  ApiErrorResponse,
  RankingResponse,
  ScoreRecord,
  SubmitScoreRequest,
} from '../types/api';

// Caminho relativo: em produção o Express serve front-end e API na mesma origem,
// e em desenvolvimento o proxy do Vite repassa /api para o back-end.
const API_BASE_URL = '/api';
const NETWORK_ERROR_MESSAGE = 'Não foi possível conectar ao servidor. Verifique sua internet.';
const UNEXPECTED_ERROR_MESSAGE = 'O servidor não respondeu como esperado. Tente novamente.';

// Erro com mensagem já pronta para mostrar ao jogador; as cenas não precisam interpretar HTTP.
export class ScoresApiError extends Error {}

function isApiErrorResponse(body: unknown): body is ApiErrorResponse {
  return (
    typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
  );
}

// O back-end já devolve mensagens em português ({ error }); usamos a dele quando existir.
async function readErrorMessage(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  return isApiErrorResponse(body) ? body.error : UNEXPECTED_ERROR_MESSAGE;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init).catch(() => {
    throw new ScoresApiError(NETWORK_ERROR_MESSAGE);
  });
  if (!response.ok) {
    throw new ScoresApiError(await readErrorMessage(response));
  }
  // O contrato é garantido pelo nosso próprio back-end, que valida tudo com Zod.
  return (await response.json()) as T;
}

export async function fetchRanking(limit: number): Promise<RankingResponse> {
  const query = new URLSearchParams({ limit: String(limit) });
  return requestJson<RankingResponse>(`/ranking?${query.toString()}`);
}

export async function submitScore(body: SubmitScoreRequest): Promise<ScoreRecord> {
  return requestJson<ScoreRecord>('/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
