// src/api/middleware/verifyAuthToken.js (Real Supabase Version)
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role for admin actions
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const verifyAuthToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ error: 'Forbidden: No token provided.' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // Ask Supabase to verify the token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('Supabase token verification error:', error.message);
      return res.status(403).json({ error: 'Forbidden: Invalid token.' });
    }

    if (!user) {
      return res.status(403).json({ error: 'Forbidden: User not found.' });
    }

    // Attach the verified user object to the request
    req.user = user;
    next(); // Proceed to the controller

  } catch (error) {
    console.error('Internal error during token verification:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = verifyAuthToken;