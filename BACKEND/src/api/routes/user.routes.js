// src/api/routes/user.routes.js
const express = require('express');
const router = express.Router();
const verifyAuthToken = require('../middleware/verifyAuthToken');

// This is a protected route. The verifyAuthToken middleware will run first.
// If the token is valid, the (req, res) function will run.
// If not, the middleware will send a 403 error.
router.get('/profile', verifyAuthToken, (req, res) => {
  // Because the middleware ran successfully, we have access to req.user
  res.json({
    message: `Welcome, user with UID: ${req.user.uid}`,
    email: req.user.email
  });
});

module.exports = router;