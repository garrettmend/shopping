import { Kafka } from 'kafkajs';

//initializes the Kafka client connection for your Order Service.

export const kafka = new Kafka({
  clientId: 'order-service',
  brokers: ['localhost:9092'],
});

export const producer = kafka.producer();