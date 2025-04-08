const db = require('../config/database');
const bcrypt = require('bcrypt');

async function resetAdmins() {
  try {
    console.log('\n=== Resetting Admin Users ===\n');

    // Drop existing table
    await new Promise((resolve, reject) => {
      db.run('DROP TABLE IF EXISTS admins', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('Dropped existing admin table');

    // Create new table
    await new Promise((resolve, reject) => {
      db.run(`CREATE TABLE admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT UNIQUE,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1
      )`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('Created new admin table');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const newadminPassword = await bcrypt.hash('admin123', 10);

    // Create superadmin user
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO admins (username, password, email, role) VALUES (?, ?, ?, ?)',
        ['admin', adminPassword, 'admin@example.com', 'superadmin'],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
    console.log('Created superadmin user');

    // Create regular admin user
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO admins (username, password, email, role) VALUES (?, ?, ?, ?)',
        ['newadmin', newadminPassword, 'newadmin@example.com', 'admin'],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
    console.log('Created regular admin user');

    console.log('\nAdmin users have been reset!');
    console.log('\nSuperadmin Account:');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Email: admin@example.com');
    console.log('Role: superadmin');
    
    console.log('\nRegular Admin Account:');
    console.log('Username: newadmin');
    console.log('Password: admin123');
    console.log('Email: newadmin@example.com');
    console.log('Role: admin');

  } catch (error) {
    console.error('Error resetting admin users:', error);
  }
}

// Run the function
resetAdmins(); 