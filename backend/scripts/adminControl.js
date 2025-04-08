const bcrypt = require('bcrypt');
const db = require('../config/database');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function runQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function viewAllAdmins() {
    try {
        const admins = await runQuery('SELECT id, username, email, role, created_at, last_login FROM admins');
        console.log('\n=== All Admin Users ===');
        admins.forEach(admin => {
            console.log(`\nID: ${admin.id}`);
            console.log(`Username: ${admin.username}`);
            console.log(`Email: ${admin.email}`);
            console.log(`Role: ${admin.role}`);
            console.log(`Created: ${admin.created_at}`);
            console.log(`Last Login: ${admin.last_login || 'Never'}`);
        });
        console.log(`\nTotal Admins: ${admins.length}`);
    } catch (error) {
        console.error('Error viewing admins:', error);
    }
}

async function addAdmin() {
    try {
        const username = await new Promise(resolve => rl.question('Enter username: ', resolve));
        const password = await new Promise(resolve => rl.question('Enter password: ', resolve));
        const email = await new Promise(resolve => rl.question('Enter email: ', resolve));
        const role = await new Promise(resolve => rl.question('Enter role (admin/superadmin): ', resolve));

        if (!['admin', 'superadmin'].includes(role.toLowerCase())) {
            console.log('Invalid role. Must be either "admin" or "superadmin"');
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO admins (username, password, email, role) VALUES (?, ?, ?, ?)';
        
        await runQuery(query, [username, hashedPassword, email, role.toLowerCase()]);
        console.log('\nAdmin user created successfully!');
    } catch (error) {
        console.error('Error adding admin:', error);
    }
}

async function updateAdmin() {
    try {
        const id = await new Promise(resolve => rl.question('Enter admin ID to update: ', resolve));
        const admin = await runQuery('SELECT * FROM admins WHERE id = ?', [id]);
        
        if (!admin.length) {
            console.log('Admin not found');
            return;
        }

        const currentAdmin = admin[0];
        console.log('\nCurrent Admin Details:');
        console.log(`Username: ${currentAdmin.username}`);
        console.log(`Email: ${currentAdmin.email}`);
        console.log(`Role: ${currentAdmin.role}`);

        const updates = [];
        const params = [];

        const newUsername = await new Promise(resolve => rl.question('Enter new username (press Enter to keep current): ', resolve));
        if (newUsername.trim()) {
            updates.push('username = ?');
            params.push(newUsername.trim());
        }

        const newPassword = await new Promise(resolve => rl.question('Enter new password (press Enter to keep current): ', resolve));
        if (newPassword.trim()) {
            const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
            updates.push('password = ?');
            params.push(hashedPassword);
        }

        const newEmail = await new Promise(resolve => rl.question('Enter new email (press Enter to keep current): ', resolve));
        if (newEmail.trim()) {
            updates.push('email = ?');
            params.push(newEmail.trim());
        }

        const newRole = await new Promise(resolve => rl.question('Enter new role (admin/superadmin) (press Enter to keep current): ', resolve));
        if (newRole.trim()) {
            if (!['admin', 'superadmin'].includes(newRole.toLowerCase())) {
                console.log('Invalid role. Must be either "admin" or "superadmin"');
                return;
            }
            updates.push('role = ?');
            params.push(newRole.toLowerCase());
        }

        if (updates.length === 0) {
            console.log('No changes made');
            return;
        }

        params.push(id);
        const query = `UPDATE admins SET ${updates.join(', ')} WHERE id = ?`;
        
        await runQuery(query, params);
        console.log('\nAdmin updated successfully!');
    } catch (error) {
        console.error('Error updating admin:', error);
    }
}

async function deleteAdmin() {
    try {
        const id = await new Promise(resolve => rl.question('Enter admin ID to delete: ', resolve));
        const admin = await runQuery('SELECT * FROM admins WHERE id = ?', [id]);
        
        if (!admin.length) {
            console.log('Admin not found');
            return;
        }

        const confirm = await new Promise(resolve => rl.question(`Are you sure you want to delete admin "${admin[0].username}"? (yes/no): `, resolve));
        
        if (confirm.toLowerCase() === 'yes') {
            await runQuery('DELETE FROM admins WHERE id = ?', [id]);
            console.log('\nAdmin deleted successfully!');
        } else {
            console.log('Deletion cancelled');
        }
    } catch (error) {
        console.error('Error deleting admin:', error);
    }
}

async function showMenu() {
    console.log('\n=== Admin Control Panel ===');
    console.log('1. View all admins');
    console.log('2. Add new admin');
    console.log('3. Update admin');
    console.log('4. Delete admin');
    console.log('5. Exit');

    const choice = await new Promise(resolve => rl.question('\nEnter your choice (1-5): ', resolve));

    switch (choice) {
        case '1':
            await viewAllAdmins();
            break;
        case '2':
            await addAdmin();
            break;
        case '3':
            await updateAdmin();
            break;
        case '4':
            await deleteAdmin();
            break;
        case '5':
            console.log('Exiting...');
            rl.close();
            return;
        default:
            console.log('Invalid choice');
    }

    if (choice !== '5') {
        await showMenu();
    }
}

// Start the program
showMenu(); 