const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // We try to connect to a local MongoDB instance.
    // If it fails, we catch the error but we don't crash the app,
    // so the Hackathon prototype can still run using mock arrays if needed.
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-safety');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.log('Running without Database (In-Memory Fallback will be used if implemented)');
    // process.exit(1); // Do not exit for hackathon safety
  }
};

module.exports = connectDB;
