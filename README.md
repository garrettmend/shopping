# Shopping

An event-driven e-commerce demo built from several services. Users browse products, add them to a cart, and check out through Stripe. Each order is published to Kafka so inventory, notifications, and email happen asynchronously, and stock levels update live in the browser over Socket.IO.

## Architecture

```
                 ┌──────────────┐   /api        ┌───────────────────┐
  Browser ──────▶│   Frontend   │──────────────▶│  Backend (orders) │──▶ PostgreSQL (order_db)
                 │ React + Vite │               │  Express + Prisma │──▶ Redis (product cache)
                 │   (Nginx)    │  /socket.io   └─────────┬─────────┘
                 └──────┬───────┘                         │ order-created, stock-updated
                        │                                 ▼
                        │                          ┌─────────────┐
                        │                          │    Kafka    │
                        │                          └──┬───────▲──┘
                        │             order-created   │       │  inventory-updated, order-failed
                        │                             ▼       │
                        │                  ┌───────────────────────┐
                        │                  │  InventoryService     │──▶ PostgreSQL (inventory_db)
                        │                  │  .NET worker + EF Core│──▶ Redis (idempotency keys)
                        │                  └───────────────────────┘
                        ▼
              ┌──────────────────────┐
              │ Notification service │ consumes inventory-updated, order-failed, stock-updated
              │  Socket.IO + Resend  │ → pushes updates to the browser and emails the customer
              └──────────────────────┘
```

| Service | Path | Stack | Port |
| --- | --- | --- | --- |
| Frontend | [`frontend/`](frontend/) (Vite config at repo root) | React 19, React Router, Socket.IO client, Nginx | 5173 (dev), 3000 (Docker) |
| Backend / order service | [`backend/`](backend/) | Express 5, TypeScript, Prisma 7, PostgreSQL, Redis, KafkaJS, Stripe | 4001 |
| Notification service | [`notification-service/`](notification-service/) | Express, Socket.IO, KafkaJS, Resend | 4002 |
| Inventory service | [`InventoryService/`](InventoryService/) | .NET 10 worker, EF Core (Npgsql), Confluent.Kafka, StackExchange.Redis | — (Kafka consumer) |
| Load tests | [`load-tests/`](load-tests/) | k6 | — |

### Order flow

1. The user checks out. The backend creates a Stripe Checkout session; when Stripe calls the webhook, the backend places the order (`POST /api/orders` is also available directly).
2. In one database transaction, the backend checks stock, decrements it, and creates a `PENDING` order. It responds right away.
3. After responding, it publishes `order-created` and `stock-updated` to Kafka and clears the Redis product cache.
4. InventoryService consumes `order-created`, uses a Redis key to skip orders it already processed, deducts stock in `inventory_db`, and publishes `inventory-updated` (confirmed) or `order-failed`.
5. The notification service relays these events to the browser as `order-status-update` socket events, emails the customer through Resend, and rebroadcasts `stock-updated` so the shop page shows live stock.

## API

All backend routes are under `/api`. Protected routes need an `Authorization: Bearer <token>` header; tokens expire after one hour.

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | — | Health check |
| `POST` | `/api/auth/register` | — | Create an account |
| `POST` | `/api/auth/login` | — | Log in and receive a JWT |
| `GET` | `/api/auth/admin-status` | user | `{ isAdmin }` — whether the user's email matches `ADMIN_EMAIL` |
| `GET` | `/api/products` | — | List products (cached in Redis) |
| `GET` | `/api/products/:id` | — | Get one product (cached in Redis) |
| `POST` | `/api/products/cache/reset` | admin | Clear the product cache |
| `POST` | `/api/products/stock/restore` | user | Restore stock levels for testing |
| `POST` | `/api/orders` | user | Place an order: `{ items: [{ productId, quantity }] }` |
| `POST` | `/api/stripe/create-checkout-session` | user | Start a Stripe Checkout session |
| `POST` | `/api/stripe/webhook` | Stripe signature | Creates the order on `checkout.session.completed` |

## Running locally

### Prerequisites

- Docker Desktop
- Node.js 20+
- .NET 10 SDK and the EF Core CLI (`dotnet tool install --global dotnet-ef`) for InventoryService

### Option A: everything in Docker

```powershell
docker compose up --build
```

This starts PostgreSQL, Kafka, Zookeeper, Redis, the backend, the notification service, and the frontend. Open http://localhost:3000. The backend is on http://localhost:4001 and the notification service on http://localhost:4002.

InventoryService is not in `docker-compose.yml`; run it separately (step 4 below) if you want orders confirmed by the inventory worker.

### Option B: infrastructure in Docker, services on your machine

1. **Start the infrastructure**

   ```powershell
   docker compose up -d postgres-order postgres-inventory zookeeper kafka redis
   ```

   The order database is exposed on host port `55432`, the inventory database on `5433`, Kafka on `9092`, and Redis on `6379`.

2. **Backend** — create `backend/.env`:

   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:55432/order_db
   REDIS_URL=redis://localhost:6379
   KAFKA_BROKER=localhost:9092
   JWT_SECRET=change-me
   PORT=4001
   FRONTEND_URL=http://localhost:5173
   # Optional
   ADMIN_EMAIL=you@example.com
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

   Then install, migrate, seed, and start it:

   ```powershell
   cd backend
   npm install
   npx prisma migrate deploy
   npx prisma generate
   npx tsx scripts/seedProducts.ts
   npx tsx src/server.ts
   ```

   The seed script upserts ten demo products with 2,000 units of stock each, priced at $0.00.

3. **Notification service**

   ```powershell
   cd notification-service
   npm install
   npm run dev
   ```

   It reads `KAFKA_BROKERS` (default `localhost:9092`), `PORT` (default `4002`), and `RESEND_API_KEY` for email.

4. **InventoryService**

   ```powershell
   cd InventoryService
   dotnet ef database update
   dotnet run
   ```

   It connects to the inventory database through `ConnectionStrings:DefaultConnection` in `appsettings.json`, and to Kafka and Redis on `localhost`.

5. **Frontend** — from the repository root:

   ```powershell
   npm install
   npm run dev
   ```

   Open http://localhost:5173. Vite proxies `/api` to the backend and `/socket.io` to the notification service.

### Kafka topics

The services use these topics: `order-created`, `inventory-updated`, `order-failed`, and `stock-updated`. The local Kafka container creates them automatically; on a managed broker, create them before deploying.

## Environment variables

**Backend**

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string for `order_db` |
| `DATABASE_POOL_SIZE` | Postgres connection pool size (default 20) |
| `REDIS_URL` | Redis connection string |
| `KAFKA_BROKER` | Kafka broker address |
| `KAFKA_USERNAME`, `KAFKA_PASSWORD` | SASL credentials; when both are set, TLS + SASL/PLAIN is enabled |
| `JWT_SECRET` | Secret used to sign auth tokens |
| `ADMIN_EMAIL` | Email of the account that gets admin/test controls |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe API key and webhook signing secret |
| `FRONTEND_URL` | Base URL for Stripe success and cancel redirects |
| `SEED_PRODUCTS` | `true` runs the product seed script on container start |
| `PORT` | HTTP port (default 4001) |

**Notification service:** `KAFKA_BROKERS`, `KAFKA_USERNAME`, `KAFKA_PASSWORD`, `RESEND_API_KEY`, `PORT` (default 4002).

**Frontend container:** `BACKEND_URL` / `NOTIFICATION_URL` (Docker Compose) or `BACKEND_HOST` / `NOTIFICATION_HOST` (Render) tell Nginx where to proxy `/api` and `/socket.io`.

Never commit `.env` files; they are ignored by Git. See [`.env.example`](.env.example) for a starting point.

## Load testing

[`load-tests/order-load.js`](load-tests/order-load.js) is a k6 script that logs in and places orders concurrently. See [`load-tests/README.md`](load-tests/README.md) for how to run it against a staging backend.

## Deployment

[`render.yaml`](render.yaml) defines a Render Blueprint for the backend, notification service, frontend, and a Postgres database. Kafka and Redis must be provided separately (for example, Confluent Cloud and a managed Redis). See [`DEPLOY.md`](DEPLOY.md) for the full list of settings.

## Scripts

| Location | Command | Description |
| --- | --- | --- |
| root | `npm run dev` | Start the Vite dev server |
| root | `npm run build` | Build the frontend into `frontend/dist` |
| root | `npm run lint` | Run ESLint |
| `backend/` | `npx tsx scripts/seedProducts.ts` | Seed demo products |
| `backend/` | `npx tsx scripts/verifyProducts.ts` | Print products in the database |
| `notification-service/` | `npm run dev` / `npm start` | Run the service with or without file watching |
