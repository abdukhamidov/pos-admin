# Telegram Reports Bot Dockerfile
FROM node:20-bookworm-slim AS base
WORKDIR /app

# Install deps (workspaces)
COPY package.json ./
COPY packages ./packages
COPY apps/bot/package.json ./apps/bot/package.json

RUN npm install --silent

# Build (generate Prisma client for runtime)
COPY . .
ENV NODE_ENV=production
RUN npm run db:generate

CMD ["npm", "--workspace=@mini/bot", "run", "start"]

