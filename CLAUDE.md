# CLAUDE.md: regras do projeto Jogo Halloween

Este arquivo é a fonte de verdade para qualquer pessoa ou agente que escreva código neste repositório. Leia inteiro antes de alterar qualquer arquivo.

## 1. Contexto

- Projeto: jogo de plataforma gótico para navegador, com API própria e ranking mundial.
- Evento: Hackathon Projeção 2026, categoria **Veteranos** (back-end, banco de dados e URL pública obrigatórios).
- Prazo de entrega: 30/10/2026, às 20h, pelo Moodle, em um único ZIP.
- Regras do evento: código gerado com IA é permitido, mas todos os integrantes precisam explicar o que foi entregue. Por isso, o código deve ser simples de ler e comentado nos pontos de decisão.

## 2. Stack (versões fixadas)

| Camada | Tecnologia |
|---|---|
| Back-end | Node.js 22 LTS, Express 4, TypeScript 5 (strict) |
| Validação | Zod 3 |
| Banco | PostgreSQL 16, biblioteca `pg` com consultas parametrizadas |
| Segurança HTTP | helmet, express-rate-limit |
| Testes | Vitest |
| Qualidade | ESLint (flat config) + Prettier |
| Front-end (a definir) | TypeScript, Vite, Phaser 3 |

Não adicione dependências fora desta lista sem registrar o motivo em `docs/adr/`.

## 3. Arquitetura em camadas

```
rota → validador → controller → service → model → PostgreSQL
```

| Pasta | Responsabilidade | Pode importar | Não pode fazer |
|---|---|---|---|
| `routes/` | Mapear URL para controller; aplicar middlewares específicos (ex.: rate limit) | `controllers`, `middlewares` | Conter lógica ou SQL |
| `validators/` | Schemas Zod de entrada e tipos inferidos | `zod` | Acessar banco ou HTTP |
| `controllers/` | Ler `req`, chamar validador e service, montar `res` | `services`, `validators` | Conter regra de negócio ou SQL |
| `services/` | Regras de negócio (ex.: cálculo da pontuação). Funções puras sempre que possível | `models`, `config` | Conhecer `req`/`res` do Express |
| `models/` | Consultas SQL e conversão de linha do banco para tipo da aplicação | `config/database` | Conter regra de negócio |
| `config/` | Variáveis de ambiente validadas, pool de conexão, constantes do jogo | bibliotecas | Ser importado por `models` com lógica de negócio |
| `middlewares/` | Tratamento transversal (erros, logs de requisição) | `zod`, `express` | Conter regra de negócio |

Regras de dependência:
- Uma camada só conhece a camada imediatamente abaixo dela.
- `controllers` nunca importam `models`.
- `models` nunca importam `services` nem `controllers`.
- `services` nunca importam `express` nem `Request`/`Response`.

## 4. Padrões de código

**Linguagem**
- Código (variáveis, funções, arquivos, tabelas, colunas do banco em snake_case) em inglês.
- Textos exibidos ao jogador e mensagens de erro para o cliente em português.
- Campos da API em camelCase; colunas do banco em snake_case; a conversão acontece apenas em `models/`.

**TypeScript**
- `strict: true` sempre. Proibido `any`. Use `unknown` e estreite o tipo.
- Use `interface` para formas de dados e `type` para uniões e aliases.
- Prefira `const`. Evite `let` quando uma atribuição resolve.
- Exporte apenas o que outro módulo usa.

**Nomes e funções**
- Nomes descritivos e completos (`innocentsKilled`, não `ik`).
- Funções pequenas, com uma responsabilidade. Se uma função passa de ~30 linhas, quebre-a.
- Evite parâmetros booleanos soltos; prefira objetos com nome.
- Nenhum número mágico: valores de regra ficam em `config/game-rules.ts`.

**Comentários**
- Comente o **porquê** de uma decisão, nunca o que o código já diz.
- Toda função exportada de `services/` tem um comentário em bloco (JSDoc) explicando entrada, saída e regra aplicada.
- Proibido código comentado. Use o controle de versão para guardar histórico.
- Proibido TODO sem responsável e data.

**Limpeza**
- Proibido `console.log` de depuração. Erros inesperados são registrados em um único lugar (`error.middleware.ts`).
- Proibido código morto, importações não usadas e variáveis não usadas.
- Sem lógica duplicada: se a mesma regra aparece duas vezes, extraia para uma função.

**Formatação**
- Prettier com aspas simples, ponto e vírgula, largura de 100 colunas e vírgula final.
- ESLint sem alertas. Nenhum aviso é aceito como “depois eu resolvo”.

## 5. Segurança

- Segredos só em variáveis de ambiente. Nunca em código, comentário ou commit.
- O `.env` nunca é versionado. Versione somente `.env.example`, sem valores reais.
- Toda entrada da API passa por Zod antes de chegar ao controller.
- Consultas SQL sempre parametrizadas (`$1`, `$2`). Proibido concatenar valores no SQL.
- O cliente nunca envia pontuação. Ele envia contadores; o servidor calcula.
- Erros inesperados devolvem mensagem genérica. Nunca envie stack trace ao cliente.
- CORS e limites de requisição ficam ativos. O corpo JSON tem limite de tamanho.

## 6. Regras do jogo que o back-end implementa

Estas regras são a referência para qualquer alteração na pontuação ou no ranking.

**Fórmula**
```
pontos = bruxas × 100 − inocentes × 250 − dano × 5 + bônus de tempo
bônus de tempo = max(0, 300 − segundos decorridos) × 10
pontos finais = max(0, pontos)   // a tabela exige valor não negativo
```

**Ranking**
- Ordenação: maior pontuação primeiro; em empate, a partida mais rápida.
- Padrão: top 10. Máximo permitido: 50.

**Easter egg**
- O campo `usedInspector` indica se o jogador alterou valores pelo inspetor do navegador.
- A flag é gravada no banco e aparece no ranking. O servidor não bloqueia a partida, apenas registra.

**Nick**
- De 1 a 20 caracteres; letras, números, espaço, `-` e `_`.

## 7. Endpoints

| Método | Rota | Entrada | Saída |
|---|---|---|---|
| GET | `/api/health` | — | `{ status: "ok" }` |
| POST | `/api/scores` | JSON com `nickname`, `witchesKilled`, `innocentsKilled`, `damageTaken`, `durationMs`, `usedInspector` | 201 com o registro salvo |
| GET | `/api/ranking?limit=10` | query `limit` opcional | Lista de registros |

Erros seguem o formato `{ "error": "mensagem" }`. Erros de validação incluem `details` com o campo e a mensagem.

Limite: `POST /api/scores` aceita 10 requisições por minuto por IP.

## 8. Testes

- Toda regra de negócio nova tem teste unitário em `tests/unit/`.
- A função de pontuação cobre: caso normal, penalidades, pontuação negativa convertida para zero e tempo acima do limite.
- Antes de considerar uma tarefa concluída, todos estes comandos devem passar: `lint`, `typecheck`, `test` e `build`.

## 9. Front-end

O front-end é um jogo Phaser 3 em TypeScript, com build feito por Vite. Ele fica em `frontend/`.

### 9.1 Stack e execução

- Phaser 3, TypeScript em modo `strict`, Vite. Fixe a versão major no `package.json`.
- Comandos da pasta `frontend/`: `dev`, `build`, `typecheck`, `lint`, `format`, `test`.
- Em desenvolvimento, o Vite faz proxy de `/api` para `http://localhost:3000`.
- O build gera `frontend/dist/`, que o Express serve na mesma URL da API.
- A resolução de referência é 1280×720, com `Phaser.Scale.FIT` e centralização. `pixelArt: true` está ativo.

### 9.2 Estrutura

```
frontend/src/
  main.ts              cria o Phaser.Game e registra as cenas
  config/
    game-config.ts     resolução, escala, física e cor de fundo
    balance.ts         único lugar com números de jogo (velocidade, dano, vida, tempos)
    controls.ts        teclas usadas no jogo
  scenes/              BootScene, MenuScene, StoryScene, LevelScene, ResultScene, RankingScene
  entities/            Player, Witch, Innocent, Boss
  systems/             CombatSystem, ScoreTracker, EffectsSystem, AudioSystem
  domain/              score-formula.ts (puro, sem Phaser)
  levels/              level-01.ts (mapa em texto, puro)
  services/            scores-api.ts (único lugar com fetch)
  types/               api.ts (formatos de requisição e resposta)
  ui/
    theme.ts           cores, fontes, espaçamentos e tempos de animação
    components/        GothicButton, GothicPanel, HealthBar, ScoreCounter, TypewriterText
    effects/           Vignette, FogLayer, DamageFlash
    overlays/          campo de nick em HTML sobre o canvas
public/assets/         sprites, sons e músicas
ASSETS.md              origem e licença de cada recurso
```

### 9.3 Dependências entre camadas

- `scenes` usam `entities`, `systems`, `ui` e `services`. Cenas só orquestram.
- `entities` e `systems` não importam cenas.
- `services` não importam Phaser.
- `domain` e `levels` não importam Phaser. Por isso são testáveis sem o motor.
- Só `services/scores-api.ts` chama `fetch`.

### 9.4 Balanceamento

- Nenhum número de jogo fica solto no código. Velocidades, danos, vida, cooldowns e tempos ficam em `config/balance.ts`.
- Constantes de interface ficam em `ui/theme.ts`. Constantes de API ficam em `services/`.
- Nomes das constantes são descritivos: `PLAYER_JUMP_VELOCITY`, não `JUMP`.

### 9.5 Cenas

- Cena não tem regra de negócio, não faz `fetch` e não cria SQL nem conhece o banco.
- Cena monta a tela a partir de componentes e entidades. Se a cena passar de ~150 linhas, mova a lógica para `systems/` ou `entities/`.
- Toda cena chama `addVignette(this)` no início de `create()`.

### 9.6 Entidades

- Cada entidade tem estados nomeados como união de strings, por exemplo `type WitchState = 'patrol' | 'chase' | 'attack' | 'hurt' | 'dead'`.
- Transições de estado são feitas em um único método `setState`, para o comportamento ser fácil de explicar e de depurar.
- Entidades não conhecem a cena que as criou; recebem as dependências pelo construtor.

### 9.7 Pontuação

- O HUD mostra uma estimativa calculada por `domain/score-formula.ts`.
- O valor salvo é sempre o retornado pelo servidor. O cliente nunca envia pontuação, apenas contadores.
- Easter egg: `ScoreTracker` guarda uma cópia congelada dos valores de `balance.ts` no início da partida. Ao final, compara com os valores atuais. Se houver diferença, envia `usedInspector: true`.
- A fórmula do cliente é idêntica à do servidor. Se mudar uma, mude as duas, e os testes precisam passar nas duas.

### 9.8 Comunicação com a API

- Os formatos de requisição e resposta ficam em `types/api.ts`.
- `scores-api.ts` é o único módulo que fala com o servidor. Erros de rede viram mensagens em português, exibidas em tela, sem travar o jogo.
- A partida nunca é perdida por falha de rede: o resultado aparece e a mensagem de erro informa que não foi possível salvar.

### 9.9 Interface (`ui/`)

- Cor, fonte e tempo de animação vêm apenas de `ui/theme.ts`. Proibido escrever hexadecimal ou nome de fonte em cena ou componente.
- Duração de transição usa `TIMING_MS`. Nenhum número solto em `tween`.
- Componentes reutilizáveis ficam em `ui/components/`. Cenas só os instanciam.
- Toda tela tem vinheta.
- Campos de texto do usuário (nick) são HTML sobre o canvas, em `ui/overlays/`, para funcionar no teclado do celular.
- Fontes são carregadas no `index.html` (Google Fonts ou `@font-face`). `BootScene` aguarda `document.fonts.load` antes de criar qualquer texto. Sem isso, o Phaser usa a fonte padrão.
- Valores do tema em `ui/theme.ts`:

| Grupo | Valores |
|---|---|
| `COLORS` | background `0x0d0a14`, panel `0x2a1638`, panelBorder `0x7a4fa0`, accent `0xff7a1a`, text `0xe8dcc4`, textMuted `0x9a8aa8`, magic `0x7dff8a`, danger `0xc0233a` |
| `FONTS` | title e body `Cinzel`; hud `"Press Start 2P"` |
| `SPACING` | xs 4, sm 8, md 16, lg 32, xl 64 |
| `TIMING_MS` | fast 120, normal 300, slow 800 |

### 9.10 Feedback de jogo ("feel")

- Pulo tem coyote time e buffer de pulo, com valores em `balance.ts`.
- Ao acertar, há pausa curta (hitstop), tremor de câmera e recuo do inimigo, todos em `EffectsSystem`.
- Ao tomar dano, o personagem tem invencibilidade curta com piscar e a tela recebe flash vermelho (`DamageFlash`).
- A luz do personagem usa o pipeline `Light2D`, habilitado apenas na fase.

### 9.11 Áudio

- Todo som passa por `AudioSystem`. Cena e entidade não chamam `sound.play` diretamente.
- Música ambiente em loop com volume baixo. Efeitos curtos para ataque, acerto, dano e morte.
- Mudo acessível por tecla e persistido em `localStorage` dentro de `try/catch`.

### 9.12 Recursos e licenças

- Preferência por CC0 (Kenney, OpenGameArt CC0, Freesound CC0) ou criação própria.
- Fontes com licença OFL (Cinzel, Press Start 2P).
- Todo arquivo em `public/assets/` tem uma linha em `ASSETS.md`: nome, autor, licença e link de origem.
- Proibido copiar sprite, som, música, mapa, nome ou elemento de história de obra de referência.

### 9.13 Qualidade

- Testes em `tests/` apenas para `domain/`, `levels/` e a validação de respostas da API. Cenas e física não têm teste automatizado neste escopo.
- Antes de concluir uma tarefa: `lint`, `typecheck`, `test` e `build` passando.
- Comentários em português explicando o porquê. Nomes de código em inglês.
- Sem `any`, sem `console.log` de depuração, sem código comentado, sem TODO sem responsável e data.
- Sem import não usado e sem arquivo órfão.

## 10. Checklist antes de entregar uma tarefa

1. `npm run lint` sem erros.
2. `npm run typecheck` sem erros.
3. `npm test` com todos os testes passando.
4. `npm run build` gerando `dist/`.
5. Nenhum `console.log`, `any`, código comentado ou segredo no diff.
6. O README foi atualizado se algum comando ou variável mudou.