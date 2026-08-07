import { producer } from './kafkaClient.js';

//handles the logic for sending messages into Kafka whenever a user places an order.

export const connectProducer = async () => {
  await producer.connect();
  console.log('Kafka Producer connected successfully.');
};

export const publishOrderCreated = async (
  orderId: string,
  items: Array<{ productId: string; quantity: number }>,
  userEmail?: string
) => {
  await producer.send({
    topic: 'order-created',
    messages: [
      {
        value: JSON.stringify({ orderId, items, userEmail, timestamp: new Date() }),
      },
    ],
  });
  console.log(`Event published: order-created for Order ID ${orderId}`);
};
