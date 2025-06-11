const admin = require('../config/firebase');
const firebaseService = require('../services/firebaseService');
const nodemailer = require('nodemailer');

// Sign up new user
exports.signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, password, and name are required' 
      });
    }

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });

    // Create user document in Firestore
    await firebaseService.createUser({
      uid: userRecord.uid,
      email,
      name
    });
    const token = await admin.auth().createCustomToken(userRecord.uid);
    res.status(201).json({
      message: 'User created successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName
      },
      token: token
    });
  } catch (error) {
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    if (error.code === 'auth/invalid-password') {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    console.error('Signup error:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Get user data from Firestore
    const userData = await firebaseService.getUserByUid(userRecord.uid);

    // Generate custom token
    const token = await admin.auth().createCustomToken(userRecord.uid);

    res.json({
      message: 'Login successful',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName,
        ...userData
      },
      token: token
    });
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    console.error('Login error:', error);
    res.status(500).json({ error: 'Error during login' });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const userData = await firebaseService.getUserByUid(req.user.uid);
    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        uid: req.user.uid,
        email: req.user.email,
        ...userData
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Error fetching user profile' });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return res.json({ message: 'If an account exists with this email, a password reset link will be sent' });
      }
      throw error;
    }

    const actionCodeSettings = {
      url: process.env.FRONTEND_URL + '/login',
      handleCodeInApp: true,
    };

  

    try {
      const resetLink = await admin.auth().generatePasswordResetLink(email, actionCodeSettings);
    

      // Configure SMTP
      const transporter = nodemailer.createTransport({
        host: 'mail.cashlyzer.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD
        },
      });
      
      transporter.verify((error, success) => {
        if (error) {
          console.error('SMTP Test Error:', error);
        } else {
        
        }
      });

      // Verify transporter configuration
      await transporter.verify();
    

      const mailOptions = {
        from: `"Cashlyzer" <${process.env.EMAIL_USERNAME}>`,
        to: email,
        subject: 'Reset Your Password - Cashlyzer',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Reset Your Password</h2>
            <p style="font-size: 18px;">Hello,</p>
            <p style="font-size: 18px;">We received a request to reset your password for your Cashlyzer account. Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="font-size: 18px; background-color: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="font-size: 18px;">If you didn't request this password reset, you can safely ignore this email.</p>
            <p style="font-size: 18px;">This link will expire in 1 hour.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 13px;">
              If the button above doesn't work, copy and paste this link into your browser:<br>
              <span style="color: #333;">${resetLink}</span>
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);

      return res.json({
        message: 'Password reset link has been sent to your email',
        success: true
      });

    } catch (error) {
      console.error('Error sending password reset email:', error);
      if (error.code === 'EAUTH') {
        return res.status(500).json({ 
          error: 'Email service configuration error. Please contact support.',
          details: 'Authentication failed. Please check email credentials.'
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (error.code === 'auth/user-not-found') {
      return res.json({ message: 'If an account exists with this email, a password reset link will be sent' });
    }

    res.status(500).json({ 
      error: 'Error processing password reset request', 
      details: error.message 
    });
  }
};