import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';

// Setup Express + HTTP server + Socket.io for broadcasting to the frontend.
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust this to your frontend URL in production
  },
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Socket.io connection tracking
io.on('connection', (socket) => {
  console.log(`[Notification Service] Frontend client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[Notification Service] Client disconnected: ${socket.id}`);
  });
});

export { app, io, server };
