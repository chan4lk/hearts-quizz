const express = require('express');
const cors = require('cors');
const http = require('http');
const setupSocketHandlers = require('./utils/socketHandler');
const createApiRouter = require('./routes');
const { seedAdmin } = require('./routes/authRoutes');
const db = require('./db');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// CORS configuration
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
  origin: function(origin, callback) {
    // For better security in production, validate origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Routes with versioning
app.use('/api', createApiRouter());

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    message: 'API Documentation',
    version: 'v1',
    endpoints: {
      auth: {
        login: {
          method: 'POST',
          path: '/api/v1/auth/login',
          description: 'Authenticate a user and receive a JWT token',
          body: {
            username: 'string',
            password: 'string'
          }
        }
      },
      quizzes: {
        list: {
          method: 'GET',
          path: '/api/v1/quizzes',
          description: 'Get all quizzes (requires authentication)'
        },
        getByPin: {
          method: 'GET',
          path: '/api/v1/quizzes/pin/:pin',
          description: 'Get quiz by PIN'
        },
        create: {
          method: 'POST',
          path: '/api/v1/quizzes',
          description: 'Create a new quiz (requires authentication)'
        },
        updateQuestions: {
          method: 'PUT',
          path: '/api/v1/quizzes/:quizId/questions',
          description: 'Update quiz questions (requires authentication)'
        }
      }
    }
  });
});

// Socket.io setup
const io = require('socket.io')(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["*"]
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Log socket.io events for debugging
io.engine.on("connection_error", (err) => {
  console.log("Connection error:", err);
});

setupSocketHandlers(io);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Centralized error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    // Initialize database
    await db.init();
    
    // Seed admin user
    await seedAdmin();

    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      
      // Log environment configuration
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`JWT authentication ${process.env.JWT_SECRET ? 'configured' : 'NOT CONFIGURED - using fallback (insecure)'}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Start the server
startServer();
