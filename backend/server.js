const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const { createServer } = require('http');
const { Server } = require('socket.io');

require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

const port = process.env.PORT || 5001;

// Default admin credentials from environment variables
const defaultAdmin = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin123'
};

// Database setup
const db = new sqlite3.Database('./khoot.db', (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
async function initializeDatabase() {
  db.serialize(async () => {
    // Create tables
    db.run(`CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pin TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      questions TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Check if admin exists
    db.get('SELECT * FROM admins WHERE username = ?', [defaultAdmin.username], async (err, row) => {
      if (err) {
        console.error('Error checking admin:', err);
        return;
      }

      // If admin doesn't exist, create it
      if (!row) {
        try {
          const hashedPassword = await bcrypt.hash(defaultAdmin.password, 10);
          db.run(
            'INSERT INTO admins (username, password) VALUES (?, ?)',
            [defaultAdmin.username, hashedPassword],
            (err) => {
              if (err) {
                console.error('Error creating default admin:', err);
              } else {
                console.log('Default admin account created successfully');
                console.log('Using credentials from environment variables');
              }
            }
          );
        } catch (err) {
          console.error('Error hashing password:', err);
        }
      } else {
        console.log('Admin account already exists');
      }
    });
  });
}

// Middleware
app.use(cors());
app.use(express.json());

// Admin authentication endpoints
app.post('/api/admin/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    'INSERT INTO admins (username, password) VALUES (?, ?)',
    [username, hashedPassword],
    function(err) {
      if (err) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM admins WHERE username = ?', [username], async (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Server error' });
    }
    
    if (!row || !(await bcrypt.compare(password, row.password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    res.json({ success: true, message: 'Login successful' });
  });
});

// Quiz endpoints
app.post('/api/quiz/create', (req, res) => {
  const { title, questions } = req.body;
  
  if (!title || !questions || questions.length === 0) {
    return res.status(400).json({ success: false, error: 'Invalid quiz data' });
  }

  const pin = Math.random().toString(36).substr(2, 6).toUpperCase(); // Generate a random 6-character pin

  db.run(
    'INSERT INTO quizzes (pin, title, questions) VALUES (?, ?, ?)',
    [pin, title, JSON.stringify(questions)],
    function(err) {
      if (err) {
        console.error('Error creating quiz:', err);
        return res.status(500).json({ success: false, error: 'Failed to create quiz' });
      }
      res.status(201).json({ success: true, quizId: this.lastID, pin });
    }
  );
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle quiz events
  socket.on('join_quiz', (pin) => {
    socket.join(pin);
    console.log(`User ${socket.id} joined quiz ${pin}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Server is healthy');
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
