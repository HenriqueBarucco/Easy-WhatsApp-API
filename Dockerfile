FROM node:20 AS builder
WORKDIR /app
COPY ./package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 8080
CMD ["npm", "run", "start:prod"]