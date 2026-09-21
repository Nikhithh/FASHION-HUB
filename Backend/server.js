// Load environment variables at the absolute entrypoint
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

// Handle uncaught exceptions globally
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Connect to Database first, then start accepting API requests.
// This guarantees no request is handled before MongoDB is ready.
const PORT = process.env.PORT || 5000;

let server;
const startServer = async () => {
  await connectDB();
  server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
};

startServer();

// Handle unhandled promise rejections globally
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});
