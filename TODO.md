# Run Everything Locally — Task Progress

## Infrastructure (Docker) — RUNNING
- [x] postgres-order (5432) — order_db seeded with 10 products
- [x] postgres-inventory (5433) — inventory_db seeded with 10 items
- [x] kafka (9092), zookeeper
- [x] redis (6379)

## Application Services — RUNNING
- [x] Order Service (backend) — port 4001
- [x] Notification Service — port 4002
- [x] InventoryService (.NET) — Kafka consumer
- [x] Frontend (Vite dev server) — port 5173

## Bug Fix
- [x] Fixed InventoryService JSON deserialization (added `PropertyNameCaseInsensitive = true`) so stock deduction works with camelCase Kafka events

## Verification
- [x] All services healthy (ports 4001, 4002, 5173 listening)
- [x] Products API returns 10 products
- [x] Register/Login auth works
- [x] End-to-end order flow verified: order created → Kafka `order-created` → InventoryService deducts stock (10→7) → publishes `inventory-updated` → Notification Service broadcasts via Socket.io

## Stripe Bug Fix
- [x] Fixed `req.body === undefined` in stripe checkout-session: moved `app.use('/api/stripe', paymentRoutes)` AFTER `express.json()` in `server.ts` (webhook still works because it applies its own `express.raw()` locally)
- [x] Verified fixed: request now reaches Stripe API (no longer crashes on `req.body` destructure)
- [ ] BLOCKED on Stripe auth: `backend/.env` has invalid placeholder `STRIPE_SECRET_KEY` (`mk_...`) — Stripe rejects it with `StripeAuthenticationError: Invalid API Key`. Requires a real Stripe secret key (starts with `sk_`/`rk_`) to complete an actual payment.

