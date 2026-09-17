const { validationResult } = require('express-validator');

/**
 * Middleware to check validation results and handle errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    return next(new Error(errors.array().map((err) => err.msg).join(', ')));
  }
  next();
};

module.exports = { validate };
