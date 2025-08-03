// server.js (Ultra-Simplified for Final Test)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// This is the simplest possible Socket.IO initialization
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins
  }
});

// --- Import and run the Socket.IO logic handler ---
const initializeSocketIO = require('./src/sockets/location.handler.js');
initializeSocketIO(io);

// --- Apply Express Middleware ---
app.use(cors());
app.use(express.json());

// --- Import and Use REST API Routes ---
const userRoutes = require('./src/api/routes/user.routes.js');
const chatRoutes = require('./src/api/routes/chat.routes.js');
const dataRoutes = require('./src/api/routes/data.routes.js');

app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/data', dataRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the TravelMate Backend API!' });
});

// --- Start the server ---
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});