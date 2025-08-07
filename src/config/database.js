const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { DATABASE } = require('../utils/constants');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(DATABASE.CONNECTION_STRING, {
      serverSelectionTimeoutMS: DATABASE.CONNECTION_TIMEOUT,
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB; 