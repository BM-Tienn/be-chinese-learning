/**
 * DictionaryService - Tích hợp từ điển mở để giảm dependency vào AI
 * Refactored để sử dụng factory pattern với các providers riêng biệt
 * Giữ lại interface cũ để tương thích với code hiện tại
 */

const dictionaryProviderFactory = require('./dictionaryProviders');

class DictionaryService {
  
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🔄 [DICT-SERVICE] Khởi tạo từ điển với factory pattern...');
    
    try {
      await dictionaryProviderFactory.initialize();
      this.isInitialized = true;
      console.log('✅ [DICT-SERVICE] Từ điển đã được khởi tạo thành công');
      
    } catch (error) {
      console.error('❌ [DICT-SERVICE] Lỗi khởi tạo từ điển:', error.message);
      throw error;
    }
  }

  async lookupWord(word) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return await dictionaryProviderFactory.lookupWord(word);
  }

  async hasWord(word) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return await dictionaryProviderFactory.hasWord(word);
  }

  async getWordAnalysisBundle(word) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return await dictionaryProviderFactory.getWordAnalysisBundle(word);
  }

  getStatistics() {
    if (!this.isInitialized) {
      return {
        isInitialized: false,
        message: 'Dictionary service chưa được khởi tạo'
      };
    }

    const stats = dictionaryProviderFactory.getStatistics();
    
    return {
      ...stats,
      isInitialized: this.isInitialized,
      availableProviders: dictionaryProviderFactory.getAvailableProviders()
    };
  }

  // Legacy methods for backward compatibility
  get ccCedictData() {
    if (!this.isInitialized) return new Map();
    return dictionaryProviderFactory.getProvider('cccedict').data;
  }

  get hskData() {
    if (!this.isInitialized) return new Map();
    return dictionaryProviderFactory.getProvider('hsk').data;
  }

  get characterData() {
    if (!this.isInitialized) return new Map();
    return dictionaryProviderFactory.getProvider('character').data;
  }
}

// Singleton instance
const dictionaryService = new DictionaryService();

module.exports = dictionaryService; 