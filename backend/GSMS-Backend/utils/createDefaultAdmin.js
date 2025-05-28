const User = require('../models/User');

const createDefaultAdmin = async () => {
  try {
    // Check if any admin user exists
    const adminExists = await User.findOne({ role: 'ADMIN' });
    
    if (!adminExists) {
      console.log('No admin user found. Creating default admin...');
      
      // Get credentials from env
      const username = process.env.DEFAULT_ADMIN_USERNAME;
      const password = process.env.DEFAULT_ADMIN_PASSWORD;
      
      if (!username || !password) {
        console.error('Default admin credentials not found in .env file');
        return;
      }
      
      // Create new admin user
      const newAdmin = new User({
        username,
        password, // This will be hashed by the pre-save middleware
        role: 'ADMIN'
      });
      
      await newAdmin.save();
      console.log(`Default admin user '${username}' created successfully`);
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

module.exports = createDefaultAdmin; 