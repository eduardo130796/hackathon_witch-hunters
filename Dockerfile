# Imagem de produção: um único serviço Node que entrega a API e o jogo na mesma URL.
# Etapa 1: compila o front-end (Vite) e o back-end (TypeScript) com todas as dependências.
FROM node:22-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json frontend/
COPY backend/package.json backend/package-lock.json backend/
RUN npm ci --prefix frontend && npm ci --prefix backend
COPY frontend frontend
COPY backend backend
COPY database database
RUN npm run build --prefix frontend && npm run build --prefix backend

# Etapa 2: só o necessário para rodar, sem ferramentas de build, para a imagem ficar leve.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY backend/package.json backend/package-lock.json backend/
RUN npm ci --omit=dev --prefix backend
COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/frontend/dist frontend/dist
COPY database database
EXPOSE 3000
CMD ["node", "backend/dist/server.js"]
