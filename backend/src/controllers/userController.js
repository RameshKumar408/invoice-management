const { User } = require('../models');
const { asyncHandler } = require('../middleware/validation');

/**
 * @desc    Get all users for a business
 * @route   GET /api/users
 * @access  Private (Admin only)
 */
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ 
    businessId: req.user.businessId,
    _id: { $ne: req.user.id } // Exclude current user
  }).select('-password');

  res.json({
    success: true,
    data: users
  });
});

/**
 * @desc    Create a new user (staff/salesman)
 * @route   POST /api/users
 * @access  Private (Admin only)
 */
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if role is valid
  if (!['staff', 'salesman', 'user'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role. Role must be staff, salesman or user'
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Create user with current business ID
  const user = await User.create({
    name,
    email,
    password,
    role,
    businessId: req.user.businessId
  });

  res.status(201).json({
    success: true,
    message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      businessId: user.businessId
    }
  });
});

/**
 * @desc    Update a user
 * @route   PUT /api/users/:id
 * @access  Private (Admin only)
 */
const updateUser = asyncHandler(async (req, res) => {
  const { name, role, isActive } = req.body;
  
  // Find user and ensure they belong to the same business
  const user = await User.findOne({ 
    _id: req.params.id, 
    businessId: req.user.businessId 
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Prevent changing admin's own role (if they somehow get here)
  if (user._id.toString() === req.user.id.toString()) {
    return res.status(400).json({
      success: false,
      message: 'Cannot update your own role through this endpoint'
    });
  }

  if (name) user.name = name;
  if (role) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();

  res.json({
    success: true,
    message: 'User updated successfully',
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    }
  });
});

/**
 * @desc    Delete a user (deactivate)
 * @route   DELETE /api/users/:id
 * @access  Private (Admin only)
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ 
    _id: req.params.id, 
    businessId: req.user.businessId 
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Delete the user
  await User.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser
};
