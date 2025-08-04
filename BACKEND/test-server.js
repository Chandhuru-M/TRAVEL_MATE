// test-server.js

const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

io.on('connection', (socket) => {
  console.log('A user connected successfully via network IP!');
});

// THE CHANGE IS HERE: We add '0.0.0.0'
server.listen(5555, '0.0.0.0', () => {
  console.log('Test server running on all interfaces at port 5555');
});