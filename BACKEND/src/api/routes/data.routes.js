// src/api/routes/data.routes.js
const express = require('express');
const router = express.Router();
const { getNearbyPlaces, getCurrentWeather } = require('../controllers/data.controller.js');
const verifyAuthToken = require('../middleware/verifyAuthToken');

// All data routes are protected to ensure only logged-in users can use them.
router.use(verifyAuthToken);

// Define the route for getting nearby places
router.get('/nearby-places', getNearbyPlaces);

// Define the route for getting current weather
router.get('/weather', getCurrentWeather);

module.exports = router;