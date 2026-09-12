FROM node:20-alpine AS builder
WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npx tsc --noEmit false --outDir dist --rootDir .
RUN npm prune --omit=dev

FROM node:20-alpine
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=builder /usr/src/app ./
EXPOSE 4002
CMD ["node", "dist/src/server.js"]
