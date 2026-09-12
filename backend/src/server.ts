import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { connectProducer } from './kafka/producer.js';
import { connectRedis } from './redis.js';

const app = express();

app.use(cors());
app.use(express.json());
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// --- ROUTES ---
// The Stripe webhook route applies its own express.raw() parser locally, so mounting
// the stripe router after express.json() is safe: JSON endpoints work, webhook still gets raw body.
app.use('/api/stripe', paymentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

const PORT = process.env.PORT || 4001;
app.listen(PORT, async () => {
  console.log(`Order Service running on port ${PORT}`);
  await connectProducer();
  await connectRedis();
});
