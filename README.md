# Jogo Halloween

Jogo de plataforma gótico para navegador, com API própria e ranking mundial.
Regras do projeto: [CLAUDE.md](CLAUDE.md).

**Jogar online:** https://jogo-halloween.onrender.com

## Publicação (Render)

O `Dockerfile` da raiz gera um único serviço Node que entrega o jogo e a API na mesma URL.
O `render.yaml` descreve o serviço e o banco PostgreSQL gratuitos.

1. No [Render](https://render.com), entre com a conta do GitHub.
2. **New → Blueprint**, escolha este repositório (branch `main`) e confirme com **Apply**.
3. O Render cria o banco, preenche `DATABASE_URL` e faz o build (5 a 10 minutos).
   A tabela do ranking é criada automaticamente na primeira subida do servidor.
4. O link público aparece no topo do serviço `jogo-halloween`.

No plano gratuito o serviço "dorme" sem uso: a primeira visita leva cerca de 30 a 50 s.

## Back-end (local)

Requisitos: Node.js 22 e PostgreSQL 16.

### 1. Banco de dados

Com Docker:

```bash
docker run --name halloween-db -e POSTGRES_USER=jogo -e POSTGRES_PASSWORD=jogo_dev \
  -e POSTGRES_DB=halloween -p 5432:5432 -d postgres:16-alpine
docker exec -i halloween-db psql -U jogo -d halloween < database/schema.sql
```

Com PostgreSQL instalado na máquina:

```bash
psql -U postgres -c "CREATE USER jogo WITH PASSWORD 'jogo_dev';"
psql -U postgres -c "CREATE DATABASE halloween OWNER jogo;"
psql -U jogo -d halloween -f database/schema.sql
```

### 2. Variáveis de ambiente

Copie `backend/.env.example` para `backend/.env`. O `.env` nunca é versionado.

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3000` | Porta HTTP |
| `DATABASE_URL` | — | URL de conexão do PostgreSQL (obrigatória) |

### 3. Comandos

```bash
npm --prefix backend install
npm --prefix backend run dev        # servidor com recarga automática
npm --prefix backend run lint
npm --prefix backend run typecheck
npm --prefix backend test
npm --prefix backend run build      # gera backend/dist
npm --prefix backend start          # roda o build
```

### Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/health` | `{ "status": "ok" }` |
| POST | `/api/scores` | Registra uma partida (10 por minuto por IP) |
| GET | `/api/ranking?limit=10` | Top N (padrão 10, máximo 50) |

## Front-end

Phaser 3 com TypeScript e Vite, em `frontend/`. Licenças de fontes, arte e sons:
[frontend/ASSETS.md](frontend/ASSETS.md).

```bash
npm --prefix frontend install
npm --prefix frontend run dev        # http://localhost:5173, com proxy de /api para a porta 3000
npm --prefix frontend run lint
npm --prefix frontend run typecheck
npm --prefix frontend test
npm --prefix frontend run build      # gera frontend/dist, servido pelo back-end
```

Controles: A/D ou setas para andar; W, espaço ou seta para cima para pular; J ou Z para
atacar; Esc para pausar; M para mudo.
