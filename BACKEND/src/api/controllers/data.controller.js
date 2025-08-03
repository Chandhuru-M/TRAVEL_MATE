// src/api/controllers/data.controller.js
const axios = require('axios');

// --- Foursquare Places Handler ---
const getNearbyPlaces = async (req, res) => {
  // Get location and category from the frontend's query
  const { lat, lon, category } = req.query;

  if (!lat || !lon || !category) {
    return res.status(400).json({ error: 'Latitude, longitude, and category are required.' });
  }

  const options = {
    method: 'GET',
    url: 'https://api.foursquare.com/v3/places/search',
    params: {
      ll: `${lat},${lon}`,
      categories: category, // e.g., '13065' for restaurants
      limit: '10' // Get up to 10 results
    },
    headers: {
      accept: 'application/json',
      Authorization: process.env.FOURSQUARE_API_KEY
    }
  };

  try {
    const response = await axios.request(options);
    res.json(response.data);
  } catch (error) {
    console.error('Foursquare API Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to fetch data from Foursquare.' });
  }
};

// --- Weatherstack Handler ---
const getCurrentWeather = async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required.' });
  }

  const url = `http://api.weatherstack.com/current?access_key=${process.env.WEATHERSTACK_API_KEY}&query=${lat},${lon}`;

  try {
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('Weatherstack API Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to fetch data from Weatherstack.' });
  }
};

module.exports = {
  getNearbyPlaces,
  getCurrentWeather,
};