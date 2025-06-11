const admin = require('../config/firebase');

/**
 * Middleware to verify Firebase Auth token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyToken = async (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No token provided',
        message: 'Please provide a valid Bearer token in the Authorization header'
      });
    }

    // Extract the token
    const token = authHeader.split('Bearer ')[1];

    // Verify the token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Check if token is expired
    if (decodedToken.exp < Date.now() / 1000) {
      return res.status(401).json({
        error: 'Token expired',
        message: 'The authentication token has expired. Please login again.'
      });
    }

    // Attach the user data to the request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name || decodedToken.email.split('@')[0]
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);

    // Handle specific Firebase Auth errors
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'The authentication token has expired. Please login again.'
      });
    }

    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'The authentication token is invalid. Please login again.'
      });
    }

    // Generic error response
    res.status(401).json({
      error: 'Authentication failed',
      message: 'Unable to verify authentication token'
    });
  }
};

/**
 * Optional middleware to check if user's email is verified
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireEmailVerification = (req, res, next) => {
  if (!req.user.emailVerified) {
    return res.status(403).json({
      error: 'Email not verified',
      message: 'Please verify your email address before accessing this resource'
    });
  }
  next();
};

module.exports = {
  verifyToken,
  requireEmailVerification
}; 