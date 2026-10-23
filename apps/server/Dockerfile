FROM node:22-alpine AS base
RUN apk add --no-cache openssl
RUN npm install -g pnpm@11.5.0
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN pnpm install --filter server... --filter @repo/db --filter @repo/shared --frozen-lockfile --ignore-scripts
RUN pnpm rebuild --filter server...

COPY packages/typescript-config ./packages/typescript-config
COPY packages/db ./packages/db
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server

RUN cd packages/db && npx prisma generate
RUN cd packages/shared && npx tsc --build --force tsconfig.json
RUN cd apps/server \
    && rm -f vitest.config.ts \
    && npx nest build \
    && test -f dist/src/main.js

ENV NODE_ENV=production
EXPOSE 3001
WORKDIR /app/apps/server
CMD ["sh", "-c", "cd /app/packages/db && npx prisma migrate deploy && cd /app/apps/server && exec node dist/src/main.js"]
