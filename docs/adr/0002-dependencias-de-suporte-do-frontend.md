# ADR 0002: dependências de suporte do front-end

- Data: 30/10/2026
- Status: aceito

## Contexto

A seção 2 do CLAUDE.md lista Phaser 3, TypeScript, Vite, ESLint, Prettier e Vitest para o
front-end. O ESLint precisa de pacotes extras para entender TypeScript, e as fontes vêm de um
serviço externo.

## Decisão

| Pacote ou serviço | Tipo | Motivo |
|---|---|---|
| `typescript-eslint`, `@eslint/js` | desenvolvimento | Regras do ESLint para TypeScript no formato flat config, iguais às do back-end. |
| `eslint-config-prettier` | desenvolvimento | Desliga regras do ESLint que conflitam com o Prettier. |
| Google Fonts (Cinzel, Press Start 2P) | serviço externo | Fontes OFL carregadas no `index.html`, registradas em `frontend/ASSETS.md`. |

O Vitest fica na versão 2, a última que usa o Vite 5 pedido para o projeto.

## Consequências

- Sem internet, as fontes não carregam. A `BootScene` não trava: segue com a fonte reserva do navegador.
- Se o jogo precisar funcionar offline, as fontes devem ser baixadas para `public/assets/` com `@font-face`.
