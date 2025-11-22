ARG PNPM_VERSION=9.12.3
ARG PRISMA_VERSION=7.0.0

FROM node:22-slim AS base

WORKDIR /app
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apt-get update -y \
	&& apt-get install -y openssl \
	&& rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@${PNPM_VERSION}

FROM base AS deps

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --shamefully-hoist

FROM base AS build

COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml nest-cli.json tsconfig.json tsconfig.build.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

RUN pnpm run build
RUN pnpm prune --prod

FROM base AS runner

ENV NODE_ENV=production

RUN npm install -g prisma@${PRISMA_VERSION}

COPY package.json pnpm-lock.yaml prisma.config.ts ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

EXPOSE 8080

CMD ["sh", "-c", "pnpm prisma:deploy && node -r @opentelemetry/auto-instrumentations-node/register dist/main.js"]