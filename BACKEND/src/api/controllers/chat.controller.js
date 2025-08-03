// src/api/controllers/chat.controller.js
const model = require('../../config/gemini.config.js');

const handleChatMessage = async (req, res) => {
  // The user's message is in the request body
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    // Here you can add more context to the prompt.
    // For example, fetch user preferences from a database:
    // const userPreferences = await getUserPreferences(req.user.uid);
    // const fullPrompt = `Based on these preferences: ${userPreferences}, ${message}`;
    
    const prompt = message; // For now, we'll keep it simple

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Send the AI's reply back to the frontend
    res.json({ reply: text });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ error: 'Failed to get response from AI assistant.' });
  }
};

module.exports = {
  handleChatMessage,
};