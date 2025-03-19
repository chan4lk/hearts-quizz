const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../db');
const { ApiError } = require('../middleware/errorHandler');
const authMiddleware = require('../middleware/auth');

// Helper function to wrap async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * POST /auth/login
 * Authenticates user and returns JWT token
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Input validation
  if (!username || !password) {
    throw new ApiError(400, 'Username and password are required');
  }

  // Get JWT secret from environment variable
  const jwtSecret = process.env.JWT_SECRET;
  
  // If JWT_SECRET is not set, return error
  if (!jwtSecret) {
    throw new ApiError(500, 'Server configuration error: JWT_SECRET not set');
  }

  // Check for admin user in database
  const adminUser = await db.get('SELECT * FROM users WHERE username = ? AND role = ?', [username, 'admin']);
  
  // If admin user exists in database, verify password
  if (adminUser && await bcrypt.compare(password, adminUser.password)) {
    const token = jwt.sign(
      { id: adminUser.id, username: adminUser.username, role: 'admin' },
      jwtSecret,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: { id: adminUser.id, username: adminUser.username, role: 'admin' }
    });
  }
  
  // Fallback to hardcoded admin for development/demo purposes only
  // This should be removed in production
  if (process.env.NODE_ENV !== 'production' && username === 'admin' && password === 'admin123') {
    console.warn('Using hardcoded admin credentials. This is insecure and should not be used in production.');
    
    const token = jwt.sign(
      { id: 1, username: 'admin', role: 'admin' },
      jwtSecret,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: { id: 1, username: 'admin', role: 'admin' }
    });
  }

  // If no valid user found, return authentication error
  throw new ApiError(401, 'Invalid credentials');
}));

/**
 * POST /auth/register
 * Register a new admin user (requires existing admin authentication)
 */
router.post('/register', authMiddleware, asyncHandler(async (req, res) => {
  const { username, password, role = 'admin' } = req.body;
  
  // Input validation
  if (!username || !password) {
    throw new ApiError(400, 'Username and password are required');
  }
  
  // Check if username already exists
  const existingUser = await db.get('SELECT * FROM users WHERE username = ?', [username]);
  if (existingUser) {
    throw new ApiError(409, 'Username already exists');
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Insert new user
  const result = await db.run(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    [username, hashedPassword, role]
  );
  
  // Return success response
  res.status(201).json({
    message: 'User created successfully',
    userId: result.lastID
  });
}));

/**
 * GET /auth/me
 * Get current user profile (requires authentication)
 */
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  // User data comes from JWT verification in auth middleware
  const { id, username, role } = req.user;
  
  // Return user profile
  res.json({
    id,
    username,
    role
  });
}));

/**
 * POST /auth/logout
 * Logout current user (client-side token removal)
 */
router.post('/logout', asyncHandler(async (req, res) => {
  // JWT tokens are stateless, so server-side logout is not needed
  // Client should remove the token from storage
  res.json({
    message: 'Logged out successfully'
  });
}));

/**
 * Seed admin user in the database
 * This should be called during application initialization
 */
async function seedAdmin() {
  try {
    // Check if admin user already exists
    const adminExists = await db.get('SELECT * FROM users WHERE username = ? AND role = ?', ['admin', 'admin']);
    
    if (!adminExists) {
      // Default admin password - should be changed after first login
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      // Insert admin user
      await db.run(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        ['admin', hashedPassword, 'admin']
      );
      
      console.log('Admin user seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
}

// Export router and seedAdmin function
module.exports = {
  router,
  seedAdmin
};
