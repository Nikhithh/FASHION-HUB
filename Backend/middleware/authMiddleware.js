const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect route against unauthenticated users
const protect = async (req, res, next) => {
  let token;

  // 1. Get token from Authorization header or Cookies
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Check if token exists
  if (!token) {
    res.status(401);
    return next(new Error('Not authorized to access this resource, token missing'));
  }

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Find user in database and attach to request
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      res.status(401);
      return next(new Error('The user belonging to this token no longer exists'));
    }

    next();
  } catch (error) {
    res.status(401);
    return next(new Error('Not authorized, token failed or expired'));
  }
};

// Restrict access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      return next(
        new Error(`Role (${req.user ? req.user.role : 'guest'}) is not authorized to access this resource`)
      );
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
};
