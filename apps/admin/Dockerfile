# Admin app Dockerfile
FROM node:20-bookworm-slim AS base
WORKDIR /app

# Install deps (workspaces)
COPY package.json ./
COPY packages ./packages
COPY apps/admin/package.json ./apps/admin/package.json

RUN npm install --silent

# Build
COPY . .
ENV NODE_ENV=production
RUN npm run db:generate && npm run build:admin

EXPOSE 3000
CMD ["npm", "run", "start:admin"]
