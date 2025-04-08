const db = require('../config/database');
const bcrypt = require('bcrypt');

async function resetAdminPasswords() {
  try {
    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const newadminPassword = await bcrypt.hash('admin123', 10);

    // Update admin passwords
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE admins SET password = ? WHERE username = ?',
        [adminPassword, 'admin'],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE admins SET password = ? WHERE username = ?',
        [newadminPassword, 'newadmin'],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    console.log('\nAdmin passwords have been reset!');
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
    console.error('Error resetting admin passwords:', error);
  }
}

// Run the function
resetAdminPasswords(); 