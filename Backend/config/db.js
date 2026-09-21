const mongoose = require('mongoose');

const connectDB = async (retries = parseInt(process.env.DB_RETRIES || '10', 10), delayMs = parseInt(process.env.DB_RETRY_DELAY_MS || '5000', 10)) => {
  if (!process.env.MONGO_URI) {
    console.error('Database Connection Error: MONGO_URI environment variable is not set.');
    process.exit(1);
  }
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT_MS || '10000', 10),
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.error(`Database Connection Error (attempt ${attempt}/${retries}): ${error.message}`);
      if (attempt === retries) {
        console.error('All MongoDB connection attempts failed. Exiting.');
        process.exit(1); // Exit process with failure
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

module.exports = connectDB;
