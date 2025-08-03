// src/config/firebaseAdmin.config.js
const admin = require('firebase-admin');

// IMPORTANT: Make sure the path to your service account key is correct.
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;