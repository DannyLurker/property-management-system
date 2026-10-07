# --- STAGE 1: Build ---
FROM node:24-alpine AS build
RUN corepack enable

WORKDIR /app

# 1. Copy root workspace configs & lockfile
COPY package.json pnpm-workspace.yaml turbo.json pnpm-lock.yaml* ./

# 2. Copy package.json manifests across workspace
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/auth/package.json ./packages/auth/
COPY packages/payments/package.json ./packages/payments/
COPY packages/ui/package.json ./packages/ui/

# 3. Copy source files for all workspace packages & apps
COPY packages ./packages
COPY apps/api ./apps/api

# 4. Install workspace dependencies (pnpm links root node_modules properly)
RUN pnpm install --frozen-lockfile

# 5. Generate Prisma Client
RUN pnpm --filter @pms/db exec prisma generate

# 6. Build NestJS API
RUN pnpm --filter @pms/api build

# 7. Isolate production build
RUN pnpm --filter @pms/api deploy --prod /app/deploy
RUN cp -r /app/apps/api/dist /app/deploy/dist

# --- STAGE 2: Production Runtime ---
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/deploy ./

EXPOSE 3000

CMD ["node", "dist/main.js"]