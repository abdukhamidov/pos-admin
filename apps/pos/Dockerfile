# POS app Dockerfile
FROM node:20-bookworm-slim AS base
WORKDIR /app

# Install deps (workspaces)
COPY package.json ./
COPY packages ./packages
COPY apps/pos/package.json ./apps/pos/package.json

RUN npm install --silent

# Build
COPY . .
ENV NODE_ENV=production
RUN npm run db:generate && npm run build:pos

EXPOSE 4000
CMD ["npm", "run", "start:pos"]
