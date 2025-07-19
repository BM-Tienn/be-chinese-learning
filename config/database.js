const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const connect  =  process.env.MONGODB_URI || 'mongodb://localhost:27017/chinese_learning';
    await mongoose.connect(connect, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB; 