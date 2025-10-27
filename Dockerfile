FROM node:22.3.0 AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

RUN npm install -g pnpm@latest \
	&& pnpm install --frozen-lockfile --shamefully-hoist

COPY . .

RUN pnpm run build

FROM node:22.3.0

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 8080

RUN npx prisma generate

CMD ["node", "-r", "@opentelemetry/auto-instrumentations-node/register", "dist/src/main.js"]