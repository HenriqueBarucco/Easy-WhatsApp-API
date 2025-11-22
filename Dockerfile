FROM node:22.3.0 AS base

WORKDIR /app
ENV PNPM_HOME=/usr/local/share/pnpm
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

FROM base AS deps

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --shamefully-hoist

FROM deps AS builder

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY prisma ./prisma
COPY src ./src

RUN pnpm run build
RUN pnpm prune --prod

FROM node:22.3.0 AS runner

ENV NODE_ENV=production
WORKDIR /app

COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 8080

CMD ["node", "-r", "@opentelemetry/auto-instrumentations-node/register", "dist/main.js"]