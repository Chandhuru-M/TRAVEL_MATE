// src/api/routes/chat.routes.js
const express = require('express');
const router = express.Router();
const { handleChatMessage } = require('../controllers/chat.controller.js');
const verifyAuthToken = require('../middleware/verifyAuthToken');

// Define the POST route for sending a chat message.
// It is protected by the verifyAuthToken middleware.
router.post('/message', verifyAuthToken, handleChatMessage);

module.exports = router;