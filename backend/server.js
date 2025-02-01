const express = require('express');
const cors = require('cors');
const http = require('http');
const setupSocketHandlers = require('./utils/socketHandler');
const quizRoutes = require('./routes/quizRoutes');
const authRoutes = require('./routes/authRoutes');
const Quiz = require('./models/Quiz');
const path = require('path');

const app = express();
const server = http.createServer(app);

// CORS configuration
const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173'];
app.use(cors({
  origin: function(origin, callback) {
    callback(null, true);
  },
  credentials: true
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', quizRoutes);

// Socket.io setup
const io = require('socket.io')(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

setupSocketHandlers(io);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    // Initialize database
    await Quiz.createTable();
    
    // Start server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
