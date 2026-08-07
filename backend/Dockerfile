FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# install deps
COPY package.json package-lock.json* ./
RUN npm install

# build
COPY . .
RUN npx tsc -p tsconfig.json
RUN npx prisma generate || true
RUN npm prune --production || true

FROM node:20-alpine
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app ./
ENV NODE_ENV=production
EXPOSE 4001
CMD ["node","dist/server.js"]
