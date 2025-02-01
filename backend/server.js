const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

require('dotenv').config();

// Import routes
const adminRoutes = require('./routes/adminRoutes');
const quizRoutes = require('./routes/quizRoutes');

// Import models for initialization
const Admin = require('./models/Admin');
const Quiz = require('./models/Quiz');

// Import controllers and utils
const adminController = require('./controllers/adminController');
const setupSocketHandlers = require('./utils/socketHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Initialize socket handlers
setupSocketHandlers(io);

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/quiz', quizRoutes);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Server is healthy');
});

// Initialize database and seed admin
const initializeApp = async () => {
  try {
    // Create tables
    await Admin.createTable();
    await Quiz.createTable();
    
    // Seed admin user
    await adminController.seedAdmin();
    
    const port = process.env.PORT || 5001;
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error('Error initializing app:', err);
    process.exit(1);
  }
};

initializeApp();
