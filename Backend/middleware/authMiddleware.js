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

/**
 * requireApprovedSeller — use AFTER protect + authorize on every route a
 * seller may call (product/brand/order seller endpoints).
 *
 * Backend enforcement of the Brand approval gate: a user with role 'seller'
 * may proceed only if they own at least one Brand with
 * verificationStatus === 'Approved'. Sellers with no brand yet may proceed
 * (they need access to submit their first brand application). Admins and
 * other roles pass through untouched — use authorize() for role checks.
 *
 * This covers the case where a brand is rejected/revoked AFTER the seller
 * logged in (the login gate alone cannot catch that since the JWT stays valid).
 */
const requireApprovedSeller = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'seller') {
      return next();
    }
    const Brand = require('../models/Brand');
    // Tolerant of plain unit-test mocks: real Mongoose returns a Query with
    // .select(); simple jest mocks may return a bare array/promise.
    const found = Brand.find({ seller: req.user._id });
    const owned = await (found && typeof found.select === 'function'
      ? found.select('verificationStatus')
      : found);
    if (Array.isArray(owned) && owned.length > 0) {
      const hasApproved = owned.some((b) => b.verificationStatus === 'Approved');
      if (!hasApproved) {
        const hasRejected = owned.some((b) => b.verificationStatus === 'Rejected');
        res.status(403);
        return next(
          new Error(
            hasRejected
              ? 'Your brand verification was rejected.'
              : 'Your brand verification is pending.'
          )
        );
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect,
  authorize,
  requireApprovedSeller,
};
