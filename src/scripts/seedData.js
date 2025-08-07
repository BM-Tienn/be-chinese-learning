const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Vocabulary = require('../models/Vocabulary');
const Word = require('../models/Word');

// Import sample data
const vocabulariesData = require('./data/vocabularies.json');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

// Seed vocabularies
const seedVocabularies = async () => {
  try {
    console.log('Bắt đầu import dữ liệu từ vựng...');

    // Clear existing vocabularies
    await Vocabulary.deleteMany({});
    console.log('Đã xóa dữ liệu từ vựng cũ');

    // Import new vocabularies
    const vocabularies = await Vocabulary.insertMany(vocabulariesData);
    console.log(`Đã import ${vocabularies.length} từ vựng thành công`);

    return vocabularies;
  } catch (error) {
    console.error('Lỗi khi import từ vựng:', error);
    throw error;
  }
};

// Create admin user
const createAdminUser = async () => {
  try {
    console.log('Tạo tài khoản admin...');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@chineselearning.com' });
    if (existingAdmin) {
      console.log('Tài khoản admin đã tồn tại');
      return existingAdmin;
    }

    // Create admin user
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@chineselearning.com',
      password: 'admin123',
      role: 'admin',
      emailVerified: true
    });

    console.log('Đã tạo tài khoản admin thành công');
    return adminUser;
  } catch (error) {
    console.error('Lỗi khi tạo tài khoản admin:', error);
    throw error;
  }
};

// Create test user
const createTestUser = async () => {
  try {
    console.log('Tạo tài khoản test...');

    // Check if test user already exists
    const existingTestUser = await User.findOne({ email: 'test@chineselearning.com' });
    if (existingTestUser) {
      console.log('Tài khoản test đã tồn tại');
      return existingTestUser;
    }

    // Create test user
    const testUser = await User.create({
      username: 'testuser',
      email: 'test@chineselearning.com',
      password: 'test123',
      role: 'user',
      emailVerified: true
    });

    console.log('Đã tạo tài khoản test thành công');
    return testUser;
  } catch (error) {
    console.error('Lỗi khi tạo tài khoản test:', error);
    throw error;
  }
};

// Add sample words to test user
const addSampleWordsToUser = async (user, vocabularies) => {
  try {
    console.log('Thêm từ vựng mẫu cho người dùng test...');

    // Clear existing words for test user
    await Word.deleteMany({ userId: user._id });

    // Add first 5 vocabularies to test user
    const sampleVocabularies = vocabularies.slice(0, 5);
    const wordsToCreate = sampleVocabularies.map((vocabulary, index) => ({
      userId: user._id,
      vocabularyId: vocabulary._id,
      status: index < 2 ? 'mastered' : index < 4 ? 'learning' : 'new',
      notes: `Ghi chú mẫu cho từ ${vocabulary.word}`,
      reviewCount: index < 2 ? 5 : index < 4 ? 2 : 0,
      correctCount: index < 2 ? 4 : index < 4 ? 1 : 0,
      incorrectCount: index < 2 ? 1 : index < 4 ? 1 : 0,
      difficulty: index < 2 ? 4 : index < 4 ? 3 : 2
    }));

    const words = await Word.insertMany(wordsToCreate);
    console.log(`Đã thêm ${words.length} từ vựng cho người dùng test`);

    // Update user statistics
    await User.findByIdAndUpdate(user._id, {
      'statistics.totalWords': words.length,
      'statistics.masteredWords': 2,
      'statistics.learningWords': 2,
      'statistics.studyStreak': 3
    });

    return words;
  } catch (error) {
    console.error('Lỗi khi thêm từ vựng cho người dùng:', error);
    throw error;
  }
};

// Main seeding function
const seedData = async () => {
  try {
    await connectDB();

    // Seed vocabularies
    const vocabularies = await seedVocabularies();

    // Create admin user
    const adminUser = await createAdminUser();

    // Create test user
    const testUser = await createTestUser();

    // Add sample words to test user
    await addSampleWordsToUser(testUser, vocabularies);

    console.log('🎉 Hoàn thành import dữ liệu mẫu!');
    console.log(`📊 Thống kê:`);
    console.log(`   - Từ vựng: ${vocabularies.length}`);
    console.log(`   - Admin: ${adminUser.username} (${adminUser.email})`);
    console.log(`   - Test user: ${testUser.username} (${testUser.email})`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi import dữ liệu:', error);
    process.exit(1);
  }
};

// Delete all data
const deleteAllData = async () => {
  try {
    await connectDB();

    console.log('Bắt đầu xóa tất cả dữ liệu...');

    // Delete all collections
    await User.deleteMany({});
    await Vocabulary.deleteMany({});
    await Word.deleteMany({});

    console.log('✅ Đã xóa tất cả dữ liệu thành công');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi xóa dữ liệu:', error);
    process.exit(1);
  }
};

// Handle command line arguments
const command = process.argv[2];

if (command === 'seed') {
  seedData();
} else if (command === 'delete') {
  deleteAllData();
} else {
  console.log('Sử dụng:');
  console.log('  node seedData.js seed    - Import dữ liệu mẫu');
  console.log('  node seedData.js delete  - Xóa tất cả dữ liệu');
  process.exit(0);
} 