const User = require('../models/User');

/**
 * Register a new user in the database
 * @param {Object} userData - Contains name, email, password, and optional role
 * @returns {Promise<Object>} Created user object (without password)
 */
const registerUser = async (userData) => {
  const { name, email, password, role } = userData;

  // 1. Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new Error('User already exists with this email address');
  }

  // 2. Create the new user
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'customer',
  });

  // Return user object without the password field
  const userObj = user.toObject();
  delete userObj.password;
  
  return userObj;
};

/**
 * Authenticate user credentials
 * @param {Object} credentials - Contains email and password
 * @returns {Promise<Object>} The authenticated user object (without password)
 */
const loginUser = async (credentials) => {
  const { email, password } = credentials;

  // 1. Find user by email, explicitly selecting the password field (since it is deselected by default)
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // 2. Verify password match
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  // Convert to object and remove password
  const userObj = user.toObject();
  delete userObj.password;

  return userObj;
};

module.exports = {
  registerUser,
  loginUser,
};
