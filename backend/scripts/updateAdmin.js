const bcrypt = require('bcrypt');
const db = require('../config/database');

async function runQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function updateAdminCredentials() {
    try {
        // Get current admin details
        const admins = await runQuery('SELECT id, username, role FROM admins');
        console.log('\nCurrent Admin Users:');
        admins.forEach(admin => {
            console.log(`ID: ${admin.id}, Username: ${admin.username}, Role: ${admin.role}`);
        });

        // Get admin ID to update
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        readline.question('\nEnter the ID of the admin to update: ', async (id) => {
            const admin = admins.find(a => a.id === parseInt(id));
            if (!admin) {
                console.log('Invalid admin ID');
                readline.close();
                return;
            }

            // Get new credentials
            readline.question('Enter new username (press Enter to keep current): ', async (newUsername) => {
                readline.question('Enter new password (press Enter to keep current): ', async (newPassword) => {
                    const updates = [];
                    const params = [];
                    
                    if (newUsername.trim()) {
                        updates.push('username = ?');
                        params.push(newUsername.trim());
                    }
                    
                    if (newPassword.trim()) {
                        const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
                        updates.push('password = ?');
                        params.push(hashedPassword);
                    }

                    if (updates.length === 0) {
                        console.log('No changes made');
                        readline.close();
                        return;
                    }

                    params.push(parseInt(id));
                    const query = `UPDATE admins SET ${updates.join(', ')} WHERE id = ?`;
                    
                    // Update admin
                    await runQuery(query, params);
                    console.log('\nAdmin credentials updated successfully!');
                    
                    // Show updated admin details
                    const updatedAdmin = await runQuery('SELECT * FROM admins WHERE id = ?', [parseInt(id)]);
                    console.log('Updated admin details:');
                    console.log(`ID: ${updatedAdmin[0].id}`);
                    console.log(`Username: ${updatedAdmin[0].username}`);
                    console.log(`Role: ${updatedAdmin[0].role}`);
                    console.log(`Email: ${updatedAdmin[0].email}`);
                    
                    readline.close();
                });
            });
        });
    } catch (error) {
        console.error('Error updating admin:', error);
    }
}

updateAdminCredentials(); 