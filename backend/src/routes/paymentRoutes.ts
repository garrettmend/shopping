import { Router } from 'express';
import express from 'express';
import Stripe from 'stripe';
import { createOrder } from '../controllers/orderController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const configuredFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const frontendUrl = /^https?:\/\//.test(configuredFrontendUrl)
  ? configuredFrontendUrl
  : `https://${configuredFrontendUrl}`;

// Create a Stripe Checkout Session
router.post('/create-checkout-session', authenticateToken, async (req: any, res: any) => {
  try {
    const { items } = req.body;
    const userId = req.user.userId;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in checkout' });
    }

    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.name },
        unit_amount: Math.round(Number(item.price) * 100),
      },
      quantity: item.quantity,
    }));

    // Encode the intended order items + user into metadata so the webhook
    // can reconstruct and create the real DB order after payment succeeds.
    const orderPayload = {
      items: items.map((i: any) => ({ productId: i.productId, quantity: i.quantity })),
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${frontendUrl}/checkout?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${frontendUrl}/checkout?canceled=true`,
      metadata: {
        userId,
        orderPayload: JSON.stringify(orderPayload),
      },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook — receives the express.raw body (Stripe requires raw body for signature)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req: any, res: any) => {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      try {
        // Reconstruct the order payload from metadata
        const userId = session.metadata?.userId;
        const orderPayload = session.metadata?.orderPayload
          ? JSON.parse(session.metadata.orderPayload)
          : null;

        if (userId && orderPayload) {
          // Set up req.user + req.body so createOrder can reuse existing logic
          (req as any).user = { userId };
          (req as any).body = { items: orderPayload.items, userEmail: session.customer_details?.email };

          await createOrder(req, res);
          // Note: createOrder sends its own response; return here to avoid double-send
          return;
        }
      } catch (err) {
        console.error('Order creation after payment failed:', err);
      }
    }

    res.json({ received: true });
  }
);

export default router;
