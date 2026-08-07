import { Kafka } from 'kafkajs';

// Initializes the Kafka client connection for the Notification Service.
export const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
});

export const consumer = kafka.consumer({ groupId: 'notification-group' });
