// src/config/gemini.config.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Get the API key from the environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// We will use the 'gemini-pro' model for chat
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

module.exports = model;