import 'dotenv/config';
import { server, io } from './socketServer.js';
import { consumer } from './kafka.js';
import { Resend } from 'resend';

const PORT = process.env.PORT || 4002;

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOrderConfirmationEmail = async (data: any) => {
  const email = data.userEmail;
  if (!email) {
    console.warn('[Notification Service] No userEmail provided, skipping email receipt.');
    return;
  }

  try {
    await resend.emails.send({
      from: 'Store <onboarding@resend.dev>',
      to: email,
      subject: `Order Confirmation & Receipt | Order #${data.orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Thank you for your order!</h2>
          <p>Your order has been successfully confirmed and processed.</p>
          <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
            <tr style="background: #f5f5f5;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Order ID</th>
              <td style="border: 1px solid #ddd; padding: 8px;"><strong>${data.orderId}</strong></td>
            </tr>
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Status</th>
              <td style="border: 1px solid #ddd; padding: 8px;">CONFIRMED</td>
            </tr>
          </table>
          <p>Estimated delivery is 3–5 business days.</p>
          <p style="color: #666;">If you have any questions, reply to this email.</p>
        </div>
      `,
    });
    console.log(`[Notification Service] Order confirmation email sent to ${email} for order ${data.orderId}`);
  } catch (err) {
    console.error('[Notification Service] Failed to send email:', err);
  }
};

const sendOrderFailedEmail = async (data: any) => {
  const email = data.userEmail;
  if (!email) {
    console.warn('[Notification Service] No userEmail provided, skipping failure email.');
    return;
  }

  try {
    await resend.emails.send({
      from: 'Store <onboarding@resend.dev>',
      to: email,
      subject: `Order Update | Order #${data.orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>We could not process your order</h2>
          <p>Your order <strong>${data.orderId}</strong> could not be completed.</p>
          <p><strong>Reason:</strong> ${data.reason || 'Out of stock'}</p>
          <p>No payment was charged. Please try again or contact support.</p>
        </div>
      `,
    });
    console.log(`[Notification Service] Order failure email sent to ${email} for order ${data.orderId}`);
  } catch (err) {
    console.error('[Notification Service] Failed to send failure email:', err);
  }
};

const runNotificationService = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'inventory-updated', fromBeginning: true });
  await consumer.subscribe({ topic: 'order-failed', fromBeginning: true });

  console.log('[Notification Service] Kafka consumer connected and listening...');

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) return;
      const data = JSON.parse(message.value.toString());

      if (topic === 'inventory-updated') {
        console.log(`[Notification Service] Order ${data.orderId} Confirmed. Broadcasting to frontend...`);
        // 1. BROADCAST TO FRONTEND VIA WEBSOCKET
        io.emit('order-status-update', { orderId: data.orderId, status: 'CONFIRMED' });
        // 2. SEND REAL EMAIL RECEIPT VIA RESEND
        await sendOrderConfirmationEmail(data);
      } else if (topic === 'order-failed') {
        console.log(`[Notification Service] Order ${data.orderId} Failed. Broadcasting to frontend...`);
        // 1. BROADCAST TO FRONTEND VIA WEBSOCKET
        io.emit('order-status-update', { orderId: data.orderId, status: 'CANCELLED', reason: data.reason });
        // 2. SEND FAILURE EMAIL VIA RESEND
        await sendOrderFailedEmail(data);
      }
    },
  });
};

server.listen(PORT, () => {
  console.log(`[Notification Service] Running and listening for socket connections on port ${PORT}`);
  runNotificationService().catch(console.error);
});
