const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // For demo purposes, hardcoded admin credentials
    // In production, use proper user management and password hashing
    if (username === 'admin' && password === 'admin123') {
      const token = jwt.sign(
        { id: 1, username: 'admin' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: { id: 1, username: 'admin' }
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
