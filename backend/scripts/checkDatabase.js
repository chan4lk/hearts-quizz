const db = require('../config/database');

async function checkDatabase() {
  try {
    console.log('\n=== Checking Database Structure ===\n');

    // Check if admins table exists
    const tableExists = await new Promise((resolve, reject) => {
      db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='admins'",
        (err, row) => {
          if (err) reject(err);
          else resolve(!!row);
        }
      );
    });

    if (!tableExists) {
      console.log('Admins table does not exist! Creating it...');
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
      console.log('Admins table created successfully!');
    }

    // Get table schema
    const schema = await new Promise((resolve, reject) => {
      db.get(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='admins'",
        (err, row) => {
          if (err) reject(err);
          else resolve(row.sql);
        }
      );
    });
    console.log('\nAdmins table schema:');
    console.log(schema);

    // Get all admin users
    const admins = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM admins', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log('\nCurrent admin users:');
    if (!admins || admins.length === 0) {
      console.log('No admin users found.');
    } else {
      admins.forEach((admin, index) => {
        console.log(`\nAdmin #${index + 1}:`);
        console.log(`ID: ${admin.id}`);
        console.log(`Username: ${admin.username}`);
        console.log(`Email: ${admin.email}`);
        console.log(`Role: ${admin.role}`);
        console.log(`Created: ${admin.created_at}`);
        console.log(`Last Login: ${admin.last_login || 'Never'}`);
        console.log(`Active: ${admin.is_active ? 'Yes' : 'No'}`);
      });
    }

  } catch (error) {
    console.error('Error checking database:', error);
  }
}

// Run the function
checkDatabase(); 