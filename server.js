// backend/server.js
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./src/config/db');
const app = require('./app');
const socketHandler = require('./src/socket/socketHandler');

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  socketHandler(io);
  app.set('io', io); // so controllers can emit

  server.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
})();