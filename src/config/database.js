const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { DATABASE } = require('../utils/constants');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(DATABASE.CONNECTION_STRING, {
      serverSelectionTimeoutMS: DATABASE.CONNECTION_TIMEOUT
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB; 