import { Kafka } from 'kafkajs';

// Initializes the Kafka client connection for the Notification Service.
export const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
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

export const consumer = kafka.consumer({ groupId: 'notification-group' });
