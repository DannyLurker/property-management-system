FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/
COPY apps/api/tsconfig.json apps/api/tsconfig.json
COPY apps/api/tsconfig.build.json apps/api/tsconfig.build.json
RUN pnpm install --filter @pms/api --prod=false
COPY apps/api apps/api
RUN pnpm --filter @pms/api build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./
RUN npm install --omit=dev
EXPOSE 3000
CMD ["node", "dist/main.js"]
