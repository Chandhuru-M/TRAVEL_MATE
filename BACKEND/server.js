// server.js (Updated)

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// --- Import Routes ---
const userRoutes = require('./src/api/routes/user.routes.js');
const chatRoutes = require('./src/api/routes/chat.routes.js'); // <-- ADD THIS

const app = express();

app.use(cors());
app.use(express.json());

// --- Use Routes ---
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes); // <-- ADD THIS

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the TravelMate Backend API!' });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});