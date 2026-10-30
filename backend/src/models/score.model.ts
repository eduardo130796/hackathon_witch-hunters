import { pool } from '../config/database.js';

export interface NewScoreRecord {
  nickname: string;
  witchesKilled: number;
  innocentsKilled: number;
  damageTaken: number;
  durationMs: number;
  usedInspector: boolean;
  score: number;
}

export interface ScoreRecord extends NewScoreRecord {
  id: number;
  createdAt: string;
}

// Formato exato da linha devolvida pelo PostgreSQL (snake_case). Fica restrito a este arquivo
// porque o resto da aplicação só conhece o formato camelCase.
interface ScoreRow {
  id: number;
  nickname: string;
  witches_killed: number;
  innocents_killed: number;
  damage_taken: number;
  duration_ms: number;
  used_inspector: boolean;
  score: number;
  created_at: Date;
}

// Lista fixa de colunas escrita no código; nenhum valor vindo do cliente entra aqui.
const SCORE_COLUMNS = `id, nickname, witches_killed, innocents_killed, damage_taken,
  duration_ms, used_inspector, score, created_at`;

function toScoreRecord(row: ScoreRow): ScoreRecord {
  return {
    id: row.id,
    nickname: row.nickname,
    witchesKilled: row.witches_killed,
    innocentsKilled: row.innocents_killed,
    damageTaken: row.damage_taken,
    durationMs: row.duration_ms,
    usedInspector: row.used_inspector,
    score: row.score,
    createdAt: row.created_at.toISOString(),
  };
}

export async function insertScore(newScore: NewScoreRecord): Promise<ScoreRecord> {
  const result = await pool.query<ScoreRow>(
    `INSERT INTO scores
       (nickname, witches_killed, innocents_killed, damage_taken, duration_ms, used_inspector, score)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${SCORE_COLUMNS}`,
    [
      newScore.nickname,
      newScore.witchesKilled,
      newScore.innocentsKilled,
      newScore.damageTaken,
      newScore.durationMs,
      newScore.usedInspector,
      newScore.score,
    ],
  );
  return toScoreRecord(result.rows[0]);
}

export async function findTopScores(limit: number): Promise<ScoreRecord[]> {
  // Desempate pela partida mais rápida; a ordem coincide com o índice idx_scores_ranking.
  const result = await pool.query<ScoreRow>(
    `SELECT ${SCORE_COLUMNS}
       FROM scores
      ORDER BY score DESC, duration_ms ASC
      LIMIT $1`,
    [limit],
  );
  return result.rows.map(toScoreRecord);
}
