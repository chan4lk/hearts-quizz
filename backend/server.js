const express = require('express');
const cors = require('cors');
const http = require('http');
const setupSocketHandlers = require('./utils/socketHandler');
const quizRoutes = require('./routes/quizRoutes');
const authRoutes = require('./routes/authRoutes');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
require('dotenv').config();

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
app.use('/api/quizzes', quizRoutes);

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

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    // Initialize database
    const db = await open({
      filename: path.join(__dirname, 'db', 'database.sqlite'),
      driver: sqlite3.Database
    });

    // Create tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS quizzes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        pin TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quiz_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        options TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        image TEXT,
        FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE
      );
    `);

    // Make db available globally
    global.db = db;
    
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
