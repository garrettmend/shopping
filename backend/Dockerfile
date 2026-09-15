FROM node:20-alpine AS builder
WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npx tsc -p tsconfig.json

FROM node:20-alpine
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app ./
ENV NODE_ENV=production
CMD ["sh", "-c", "npx prisma db push && if [ \"${SEED_PRODUCTS:-false}\" = \"true\" ]; then npx tsx scripts/seedProducts.ts; fi && node dist/src/server.js"]
