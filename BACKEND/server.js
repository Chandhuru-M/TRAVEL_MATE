// server.js (Updated)

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// --- Import Routes ---
const userRoutes = require('./src/api/routes/user.routes.js');

const app = express();

app.use(cors());
app.use(express.json());

// --- Use Routes ---
// Tell the app to use the user routes for any path starting with /api/user
app.use('/api/user', userRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the TravelMate Backend API!' });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});