# Caçadores de Bruxas

Jogo de ação e plataforma gótico em 2D para navegador, com história, chefes, API própria e
ranking mundial. Hackathon Projeção 2026, categoria **Veteranos**.

- **Jogar online (URL pública):** https://jogo-halloween.onrender.com
- **Vídeo do pitch e demonstração:** `pitch.mp4` neste ZIP (também em https://youtu.be/QYWeXfIUNlY)
- **Apresentação:** `apresentacao.pdf` neste ZIP
- **Código-fonte:** https://github.com/eduardo130796/hackathon_witch-hunters

No plano gratuito do Render o servidor "dorme" sem uso: a primeira visita pode levar de 30 a
50 segundos para carregar.

## Login de demonstração

Não há login nem conta. Ao fim da partida, basta digitar um nick (1 a 20 caracteres) para a
pontuação entrar no ranking.

## Conteúdo do ZIP

| Item | Onde |
|---|---|
| Apresentação | `apresentacao.pdf` |
| Vídeo do pitch e demonstração (até 5 min) | `pitch.mp4` |
| Front-end (código e configuração) | `frontend/` |
| Imagens, sons e músicas | `frontend/public/assets/` (origem e licença em `frontend/ASSETS.md`) |
| Back-end (código e configuração) | `backend/` (`backend/.env.example` sem dados reais) |
| Banco de dados | `database/schema.sql` recria a tabela do ranking |
| Publicação | `Dockerfile` e `render.yaml` |
| Regras do projeto | `CLAUDE.md` e `docs/adr/` |

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Front-end | Phaser 3, TypeScript (strict), Vite |
| Back-end | Node.js 22, Express 4, TypeScript (strict), Zod |
| Banco | PostgreSQL 16, biblioteca `pg` com consultas parametrizadas |
| Segurança HTTP | helmet (com política de conteúdo), express-rate-limit |
| Testes e qualidade | Vitest, ESLint, Prettier |
| Publicação | Docker e Render (serviço web e PostgreSQL gratuitos) |

O back-end segue camadas: rota → validador (Zod) → controller → service → model. O cliente
nunca envia a pontuação, só os contadores da partida; o servidor calcula o valor oficial:

```
pontos = bruxas × 100 − inocentes × 250 − dano × 5 + max(0, 300 − segundos) × 10
```

## Como jogar

| Ação | Teclas |
|---|---|
| Andar | A / D ou setas |
| Pular | W, Espaço ou seta para cima |
| Atacar | J ou Z |
| Avançar diálogos | Espaço, Enter, J ou clique |
| Pular a história | Esc |
| Som ligado/desligado | M |

Cada trecho só abre depois de derrotar todos os inimigos dele. Atacar inocentes tira pontos.
Contra o Demônio, pule e golpeie o ponto fraco quando ele brilhar.

## Executar localmente

### Opção 1: Docker (mais simples)

Requisito: Docker. Na raiz do projeto:

```bash
docker network create halloween-net
docker run -d --name halloween-db --network halloween-net \
  -e POSTGRES_USER=jogo -e POSTGRES_PASSWORD=jogo_dev -e POSTGRES_DB=halloween postgres:16-alpine
docker build -t jogo-halloween .
docker run -d --name jogo-halloween --network halloween-net -p 3000:3000 \
  -e DATABASE_URL=postgres://jogo:jogo_dev@halloween-db:5432/halloween jogo-halloween
```

Abra http://localhost:3000. A tabela do ranking é criada automaticamente quando o servidor
sobe (o `database/schema.sql` só usa `IF NOT EXISTS`). As credenciais acima são apenas de
desenvolvimento local.

### Opção 2: Node.js

Requisitos: Node.js 22 e PostgreSQL 16.

1. Crie o banco e aplique o esquema (opcional: o servidor também o aplica ao subir):

   ```bash
   psql -U postgres -c "CREATE USER jogo WITH PASSWORD 'jogo_dev';"
   psql -U postgres -c "CREATE DATABASE halloween OWNER jogo;"
   psql -U jogo -d halloween -f database/schema.sql
   ```

2. Copie `backend/.env.example` para `backend/.env` e ajuste `DATABASE_URL`.

   | Variável | Padrão | Descrição |
   |---|---|---|
   | `PORT` | `3000` | Porta HTTP |
   | `DATABASE_URL` | — | URL de conexão do PostgreSQL (obrigatória) |

3. Instale, gere o front-end e suba o servidor (ele entrega o jogo e a API na mesma porta):

   ```bash
   npm --prefix frontend install
   npm --prefix frontend run build
   npm --prefix backend install
   npm --prefix backend run build
   npm --prefix backend start          # http://localhost:3000
   ```

Para desenvolver com recarga automática: `npm --prefix backend run dev` e, em outro
terminal, `npm --prefix frontend run dev` (http://localhost:5173, com proxy de `/api` para a
porta 3000).

### Verificações

```bash
npm --prefix backend run lint && npm --prefix backend run typecheck && npm --prefix backend test
npm --prefix frontend run lint && npm --prefix frontend run typecheck && npm --prefix frontend test
```

## Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/health` | `{ "status": "ok" }` |
| POST | `/api/scores` | Registra uma partida (10 por minuto por IP) |
| GET | `/api/ranking?limit=10` | Top N (padrão 10, máximo 50) |

## Publicação (Render)

1. No [Render](https://render.com), entre com a conta do GitHub.
2. **New → Blueprint**, escolha este repositório (branch `main`) e confirme com **Apply**.
3. O Render lê o `render.yaml`, cria o banco, preenche `DATABASE_URL` e faz o build.
4. O link público aparece no topo do serviço `jogo-halloween`.
