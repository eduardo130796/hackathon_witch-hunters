import type { ApiResult, RankingResponse, ScoreRecord, SubmitScoreRequest } from '../types/api';
import { isApiErrorResponse, isRankingResponse, isScoreRecord } from './api-validation';

// Caminho relativo: em produção o Express serve front-end e API na mesma origem,
// e em desenvolvimento o proxy do Vite repassa /api para o back-end.
const API_BASE_URL = '/api';
// Tamanho padrão do ranking, igual ao padrão do back-end (seção 6 do CLAUDE.md).
const DEFAULT_RANKING_LIMIT = 10;
// ms. Sem limite, um servidor travado deixaria o jogador olhando "Salvando..." para sempre.
const REQUEST_TIMEOUT_MS = 8000;

const NETWORK_ERROR_MESSAGE = 'Não foi possível conectar ao servidor.';
const TIMEOUT_MESSAGE = 'O servidor demorou demais para responder.';
const UNEXPECTED_RESPONSE_MESSAGE = 'O servidor respondeu em um formato inesperado.';

type ResponseGuard<T> = (body: unknown) => body is T;

// Faz a requisição e converte qualquer falha em { ok: false, message }. Este é o único fetch
// do jogo (seção 9.3), então toda regra de rede fica aqui.
async function requestJson<T>(
  path: string,
  isExpected: ResponseGuard<T>,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      return { ok: false, message: errorMessageFrom(body) };
    }
    return isExpected(body)
      ? { ok: true, data: body }
      : { ok: false, message: UNEXPECTED_RESPONSE_MESSAGE };
  } catch {
    return {
      ok: false,
      message: controller.signal.aborted ? TIMEOUT_MESSAGE : NETWORK_ERROR_MESSAGE,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// O back-end responde erros como { error } em português, e usamos essa mensagem. Uma resposta
// de erro sem esse formato não veio da nossa API: é o proxy do Vite (ou outro intermediário)
// avisando que o back-end está fora do ar, e para o jogador isso é falta de conexão.
function errorMessageFrom(body: unknown): string {
  return isApiErrorResponse(body) ? body.error : NETWORK_ERROR_MESSAGE;
}

export async function fetchRanking(
  limit = DEFAULT_RANKING_LIMIT,
): Promise<ApiResult<RankingResponse>> {
  const query = new URLSearchParams({ limit: String(limit) });
  return requestJson(`/ranking?${query.toString()}`, isRankingResponse);
}

export async function submitScore(body: SubmitScoreRequest): Promise<ApiResult<ScoreRecord>> {
  return requestJson('/scores', isScoreRecord, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
