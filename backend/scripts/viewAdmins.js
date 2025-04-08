const db = require('../config/database');

async function viewAllAdmins() {
  try {
    console.log('\n=== Current Admin Users ===\n');
    
    // Get all admin users
    const admins = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM admins', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    if (!admins || admins.length === 0) {
      console.log('No admin users found in the database.');
      return;
    }

    admins.forEach((admin, index) => {
      console.log(`Admin #${index + 1}:`);
      console.log(`ID: ${admin.id}`);
      console.log(`Username: ${admin.username}`);
      console.log(`Email: ${admin.email}`);
      console.log(`Role: ${admin.role}`);
      console.log(`Created: ${admin.created_at}`);
      console.log(`Last Login: ${admin.last_login || 'Never'}`);
      console.log('-------------------');
    });

    console.log(`\nTotal admin users: ${admins.length}`);
  } catch (error) {
    console.error('Error viewing admins:', error);
  }
}

// Run the function
viewAllAdmins(); 