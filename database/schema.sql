-- Esquema do ranking. IF NOT EXISTS permite reaplicar o arquivo sem apagar dados.

CREATE TABLE IF NOT EXISTS scores (
  id               INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nickname         VARCHAR(20) NOT NULL,
  witches_killed   INTEGER     NOT NULL CHECK (witches_killed >= 0),
  innocents_killed INTEGER     NOT NULL CHECK (innocents_killed >= 0),
  damage_taken     INTEGER     NOT NULL CHECK (damage_taken >= 0),
  duration_ms      INTEGER     NOT NULL CHECK (duration_ms > 0),
  used_inspector   BOOLEAN     NOT NULL DEFAULT FALSE,
  -- A regra do jogo converte pontuação negativa em zero; o CHECK garante isso também no banco.
  score            INTEGER     NOT NULL CHECK (score >= 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mesma ordem do ORDER BY do ranking, para o PostgreSQL ler o top N direto do índice.
CREATE INDEX IF NOT EXISTS idx_scores_ranking ON scores (score DESC, duration_ms ASC);
