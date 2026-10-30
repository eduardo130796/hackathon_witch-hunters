# ADR 0001: dependências de suporte do back-end

- Data: 30/10/2026
- Status: aceito

## Contexto

A seção 2 do CLAUDE.md fixa a stack. Algumas bibliotecas não aparecem na tabela, mas são
necessárias para carregar o `.env`, rodar TypeScript em desenvolvimento e configurar o ESLint
e o TypeScript com os tipos das bibliotecas já aprovadas.

## Decisão

| Pacote | Tipo | Motivo |
|---|---|---|
| `dotenv` | produção | Carrega o `.env` local para `process.env` antes da validação com Zod. |
| `tsx` | desenvolvimento | Executa `src/server.ts` direto, com recarga automática (`npm run dev`), sem compilar antes. |
| `typescript-eslint`, `@eslint/js` | desenvolvimento | Regras do ESLint para TypeScript no formato flat config. |
| `eslint-config-prettier` | desenvolvimento | Desliga regras do ESLint que conflitam com a formatação do Prettier. |
| `@types/node`, `@types/express`, `@types/pg` | desenvolvimento | Tipos para o TypeScript strict, sem `any`. |

Nenhum deles muda a arquitetura em camadas nem adiciona comportamento em produção além do
carregamento do `.env`.

## Consequências

- Em produção, se as variáveis vierem do ambiente da hospedagem, o `dotenv` não encontra `.env`
  e simplesmente não faz nada.
- Qualquer nova dependência continua exigindo um ADR próprio.
