// src/api/middleware/verifyAuthToken.js
const admin = require('../../config/firebaseAdmin.config.js');

const verifyAuthToken = async (req, res, next) => {
  // Check if the Authorization header exists and is formatted correctly
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ error: 'Forbidden: No token provided or invalid format.' });
  }

  // Extract the token from the header
  const idToken = authHeader.split('Bearer ')[1];

  try {
    // Verify the token using the Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Attach the user's information (like UID) to the request object
    // so that subsequent controllers can access it
    req.user = decodedToken;
    
    // If the token is valid, proceed to the next function (the controller)
    next();
  } catch (error) {
    console.error('Error while verifying Firebase ID token:', error);
    return res.status(403).json({ error: 'Forbidden: Invalid token.' });
  }
};

module.exports = verifyAuthToken;