// Middleware to handle 404 Route Not Found
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Centralized error handler to catch and format all exceptions
const errorHandler = (err, req, res, next) => {
  // Prefer an explicit status set on the error (e.g. 401 invalid credentials,
  // 400 validation/duplicate). Fall back to the response status, forcing
  // untouched 200s to 500 since this is an error block.
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = {
  notFound,
  errorHandler,
};
