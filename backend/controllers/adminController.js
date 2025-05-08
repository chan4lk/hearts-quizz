const Admin = require('../models/Admin');

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findByUsername(username);
    
    if (!admin || !(await Admin.verifyPassword(password, admin.password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    res.json({ success: true, message: 'Login successful' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const seedAdmin = async () => {
  try {
    const defaultAdmin = {
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD
    };

    const existingAdmin = await Admin.findByUsername(defaultAdmin.username);
    
    if (!existingAdmin) {
      await Admin.create(defaultAdmin.username, defaultAdmin.password);
      console.log('Default admin account created successfully');
      console.log('Using credentials from environment variables');
    } else {
      console.log('Admin account already exists');
    }
  } catch (err) {
    console.error('Error seeding admin:', err);
  }
};

module.exports = {
  login,
  seedAdmin
};
