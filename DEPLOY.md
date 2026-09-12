# Deployment

## Render

The repository includes `render.yaml` for a Render Blueprint with these services:

- `shopping-backend`: Docker web service, Prisma migrations run at startup
- `shopping-notifications`: Docker web service for Socket.IO and Kafka events
- `shopping-frontend`: Docker web service serving the Vite build through Nginx
- `shopping-postgres`: Render Postgres database

Create the Blueprint from the repository in Render. Set these `sync: false` values in the Render dashboard before deploying:

- `REDIS_URL`: a managed Redis connection string
- `KAFKA_BROKER`: the Kafka broker address used by the backend
- `KAFKA_BROKERS`: the Kafka broker address used by the notification service
- `KAFKA_USERNAME`: the Kafka API key or SASL username
- `KAFKA_PASSWORD`: the Kafka API secret or SASL password
- `JWT_SECRET`: a long random signing secret
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`

Set `SEED_PRODUCTS=true` on the backend for one deployment to create the sample products at `$0.00` and set all existing product prices to `$0.00`. Set it back to `false` afterward if you do not want the seed step on future restarts.

Kafka is not provisioned by this Blueprint. For Confluent Cloud, set the bootstrap server as the broker value and set the API key and secret as `KAFKA_USERNAME` and `KAFKA_PASSWORD`. The application enables TLS/SASL automatically when both are present. Redis likewise needs a hosted Redis instance unless you add one separately in Render.

The frontend proxies `/api` to the backend and `/socket.io` to the notification service, so browser requests remain same-origin after deployment.

## Local Docker

```powershell
docker compose up --build
```

The local frontend is available at `http://localhost:3000`. The local backend is on `http://localhost:4001`, and the notification service is on `http://localhost:4002`.
