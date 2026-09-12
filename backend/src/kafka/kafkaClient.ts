import { Kafka } from 'kafkajs';

//initializes the Kafka client connection for your Order Service.

export const kafka = new Kafka({
  clientId: 'order-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  ...(process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD
    ? {
        ssl: true,
        sasl: {
          mechanism: 'plain' as const,
          username: process.env.KAFKA_USERNAME,
          password: process.env.KAFKA_PASSWORD,
        },
      }
    : {}),
});

export const producer = kafka.producer();