// server.js (Final Version with Protocol Fix)

require('dotenv').config();
const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = createServer(app);

// THE FIX IS HERE: We are forcing the server to be compatible with older clients.
const io = new Server(server, {
  // This tells the server to allow connections from clients using Engine.IO protocol v3.
  // Postman and some older libraries use this, while the newest socket.io-server uses v4 by default.
  // This mismatch causes the "Invalid namespace" error after a successful handshake.
  allowEIO3: true,
  
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const userRoutes = require('./src/api/routes/user.routes.js');
const chatRoutes = require('./src/api/routes/chat.routes.js');
const dataRoutes = require('./src/api/routes/data.routes.js');

app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/data', dataRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the TravelMate Backend API!' });
});

const initializeSocketIO = require('./src/sockets/location.handler.js');
initializeSocketIO(io);

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});