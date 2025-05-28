const User = require('../models/User');

// Create new user
const createUser = async (req, res) => {
  try {
    // Only admin can create new users
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Only admin can create users.' });
    }

    const { username, password, role } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Validate role if provided
    if (role && !['ADMIN', 'MANAGER', 'PRODUCTION', 'VIEWER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Create new user
    const user = new User({
      username,
      password,
      role: role || 'VIEWER', // Default to VIEWER if no role specified
      status: 'ACTIVE' // Set initial status as ACTIVE
    });

    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { username, role, status } = req.body;
    const userId = req.params.id;

    // Validate input
    if (!username && !role && !status) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if username is being changed and if it's already taken
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      user.username = username;
    }

    // Update role if provided and user is admin
    if (role && req.user.role === 'ADMIN') {
      if (!['ADMIN', 'MANAGER', 'PRODUCTION', 'VIEWER'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      user.role = role;
    }

    // Update status if provided
    if (status) {
      if (!['ACTIVE', 'INACTIVE'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      user.status = status;
    }

    await user.save();

    // Return updated user without password
    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  changePassword
}; 