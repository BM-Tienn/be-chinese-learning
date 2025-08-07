const Configuration = require('../models/Configuration');
const Vocabulary = require('../models/Vocabulary');
const Course = require('../models/Course');
const FlashcardSet = require('../models/FlashcardSet');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

class ConfigurationService {
  // Lấy tất cả cấu hình theo type
  async getConfigurationsByType(type) {
    const configurations = await Configuration.getByType(type);
    return configurations.map(config => ({
      key: config.key,
      label: config.label,
      count: config.count,
      metadata: config.metadata
    }));
  }

  // Lấy tất cả cấu hình
  async getAllConfigurations() {
    const configurations = await Configuration.getAllConfigurations();
    return configurations.map(config => ({
      key: config.key,
      label: config.label,
      count: config.count,
      type: config.type,
      metadata: config.metadata
    }));
  }

  // Tạo cấu hình mới
  async createConfiguration(configData) {
    const configuration = new Configuration(configData);
    await configuration.save();
    return configuration;
  }

  // Cập nhật cấu hình
  async updateConfiguration(id, updateData) {
    const configuration = await Configuration.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!configuration) {
      throw new AppError('Configuration not found', 404);
    }
    
    return configuration;
  }

  // Xóa cấu hình
  async deleteConfiguration(id) {
    const configuration = await Configuration.findByIdAndDelete(id);
    
    if (!configuration) {
      throw new AppError('Configuration not found', 404);
    }
    
    return configuration;
  }

  // Cập nhật count cho tất cả cấu hình
  async updateAllCounts() {
    // Cập nhật count cho filters (HSK levels)
    await this.updateFilterCounts();
    
    // Cập nhật count cho topics
    await this.updateTopicCounts();
    
    // Cập nhật count cho wordTypes
    await this.updateWordTypeCounts();
  }

  // Cập nhật count cho filters
  async updateFilterCounts() {
    const hskLevels = ['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5', 'hsk6'];
    
    for (const level of hskLevels) {
      const count = await Vocabulary.countDocuments({ 
        category: level.toUpperCase(),
        isActive: true 
      });
      
      await Configuration.findOneAndUpdate(
        { type: 'filter', key: level },
        { count },
        { upsert: true, new: true }
      );
    }
  }

  // Cập nhật count cho topics
  async updateTopicCounts() {
    const topics = [
      { key: 'greetings', label: 'Chào hỏi' },
      { key: 'food', label: 'Ăn uống' },
      { key: 'family', label: 'Gia đình' },
      { key: 'numbers', label: 'Số đếm' },
      { key: 'colors', label: 'Màu sắc' },
      { key: 'animals', label: 'Động vật' },
      { key: 'weather', label: 'Thời tiết' },
      { key: 'transportation', label: 'Giao thông' },
      { key: 'shopping', label: 'Mua sắm' },
      { key: 'travel', label: 'Du lịch' }
    ];

    for (const topic of topics) {
      // Đếm số từ vựng có tag hoặc category liên quan đến topic
      const count = await Vocabulary.countDocuments({
        $or: [
          { 'metadata.tags': { $in: [topic.key] } },
          { category: { $regex: topic.key, $options: 'i' } }
        ],
        isActive: true
      });
      
      await Configuration.findOneAndUpdate(
        { type: 'topic', key: topic.key },
        { 
          label: topic.label,
          count,
          metadata: { color: this.getTopicColor(topic.key) }
        },
        { upsert: true, new: true }
      );
    }
  }

  // Cập nhật count cho wordTypes
  async updateWordTypeCounts() {
    const wordTypes = [
      { key: 'noun', label: 'Danh từ' },
      { key: 'verb', label: 'Động từ' },
      { key: 'adjective', label: 'Tính từ' },
      { key: 'adverb', label: 'Trạng từ' },
      { key: 'pronoun', label: 'Đại từ' },
      { key: 'preposition', label: 'Giới từ' },
      { key: 'conjunction', label: 'Liên từ' },
      { key: 'interjection', label: 'Thán từ' }
    ];

    for (const wordType of wordTypes) {
      const count = await Vocabulary.countDocuments({
        'meaning.partOfSpeech': { $regex: wordType.key, $options: 'i' },
        isActive: true
      });
      
      await Configuration.findOneAndUpdate(
        { type: 'wordType', key: wordType.key },
        { 
          label: wordType.label,
          count,
          metadata: { color: this.getWordTypeColor(wordType.key) }
        },
        { upsert: true, new: true }
      );
    }
  }

  // Khởi tạo dữ liệu mặc định
  async initializeDefaultConfigurations() {
    // Khởi tạo filters (HSK levels)
    const defaultFilters = [
      { key: 'all', label: 'Tất cả', count: 0, order: 0 },
      { key: 'hsk1', label: 'HSK 1', count: 0, order: 1, metadata: { level: 1, color: '#52c41a' } },
      { key: 'hsk2', label: 'HSK 2', count: 0, order: 2, metadata: { level: 2, color: '#1890ff' } },
      { key: 'hsk3', label: 'HSK 3', count: 0, order: 3, metadata: { level: 3, color: '#722ed1' } },
      { key: 'hsk4', label: 'HSK 4', count: 0, order: 4, metadata: { level: 4, color: '#fa8c16' } },
      { key: 'hsk5', label: 'HSK 5', count: 0, order: 5, metadata: { level: 5, color: '#f5222d' } },
      { key: 'hsk6', label: 'HSK 6', count: 0, order: 6, metadata: { level: 6, color: '#eb2f96' } }
    ];

    for (const filter of defaultFilters) {
      await Configuration.findOneAndUpdate(
        { type: 'filter', key: filter.key },
        filter,
        { upsert: true, new: true }
      );
    }

    // Khởi tạo topics
    const defaultTopics = [
      { key: 'all', label: 'Tất cả', count: 0, order: 0 },
      { key: 'greetings', label: 'Chào hỏi', count: 0, order: 1, metadata: { color: '#52c41a' } },
      { key: 'food', label: 'Ăn uống', count: 0, order: 2, metadata: { color: '#1890ff' } },
      { key: 'family', label: 'Gia đình', count: 0, order: 3, metadata: { color: '#722ed1' } },
      { key: 'numbers', label: 'Số đếm', count: 0, order: 4, metadata: { color: '#fa8c16' } },
      { key: 'colors', label: 'Màu sắc', count: 0, order: 5, metadata: { color: '#f5222d' } },
      { key: 'animals', label: 'Động vật', count: 0, order: 6, metadata: { color: '#eb2f96' } },
      { key: 'weather', label: 'Thời tiết', count: 0, order: 7, metadata: { color: '#13c2c2' } },
      { key: 'transportation', label: 'Giao thông', count: 0, order: 8, metadata: { color: '#faad14' } },
      { key: 'shopping', label: 'Mua sắm', count: 0, order: 9, metadata: { color: '#a0d911' } },
      { key: 'travel', label: 'Du lịch', count: 0, order: 10, metadata: { color: '#2f54eb' } }
    ];

    for (const topic of defaultTopics) {
      await Configuration.findOneAndUpdate(
        { type: 'topic', key: topic.key },
        topic,
        { upsert: true, new: true }
      );
    }

    // Khởi tạo wordTypes
    const defaultWordTypes = [
      { key: 'all', label: 'Tất cả', count: 0, order: 0 },
      { key: 'noun', label: 'Danh từ', count: 0, order: 1, metadata: { color: '#52c41a' } },
      { key: 'verb', label: 'Động từ', count: 0, order: 2, metadata: { color: '#1890ff' } },
      { key: 'adjective', label: 'Tính từ', count: 0, order: 3, metadata: { color: '#722ed1' } },
      { key: 'adverb', label: 'Trạng từ', count: 0, order: 4, metadata: { color: '#fa8c16' } },
      { key: 'pronoun', label: 'Đại từ', count: 0, order: 5, metadata: { color: '#f5222d' } },
      { key: 'preposition', label: 'Giới từ', count: 0, order: 6, metadata: { color: '#eb2f96' } },
      { key: 'conjunction', label: 'Liên từ', count: 0, order: 7, metadata: { color: '#13c2c2' } },
      { key: 'interjection', label: 'Thán từ', count: 0, order: 8, metadata: { color: '#faad14' } }
    ];

    for (const wordType of defaultWordTypes) {
      await Configuration.findOneAndUpdate(
        { type: 'wordType', key: wordType.key },
        wordType,
        { upsert: true, new: true }
      );
    }
  }

  // Helper methods để lấy màu sắc
  getTopicColor(topicKey) {
    const colorMap = {
      greetings: '#52c41a',
      food: '#1890ff',
      family: '#722ed1',
      numbers: '#fa8c16',
      colors: '#f5222d',
      animals: '#eb2f96',
      weather: '#13c2c2',
      transportation: '#faad14',
      shopping: '#a0d911',
      travel: '#2f54eb'
    };
    return colorMap[topicKey] || '#d9d9d9';
  }

  getWordTypeColor(wordTypeKey) {
    const colorMap = {
      noun: '#52c41a',
      verb: '#1890ff',
      adjective: '#722ed1',
      adverb: '#fa8c16',
      pronoun: '#f5222d',
      preposition: '#eb2f96',
      conjunction: '#13c2c2',
      interjection: '#faad14'
    };
    return colorMap[wordTypeKey] || '#d9d9d9';
  }
}

module.exports = new ConfigurationService(); 