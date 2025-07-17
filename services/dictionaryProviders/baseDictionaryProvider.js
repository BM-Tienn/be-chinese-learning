/**
 * BaseDictionaryProvider - Base class cho tất cả dictionary providers
 * Chứa các method chung và interface chuẩn
 */

class BaseDictionaryProvider {
  constructor() {
    this.isInitialized = false;
    this.data = new Map();
    this.sourceName = 'base';
    this.confidence = 0.9;
  }

  /**
   * Abstract method - phải được implement bởi subclass
   */
  async initialize() {
    throw new Error('initialize method must be implemented by subclass');
  }

  /**
   * Abstract method - phải được implement bởi subclass
   */
  async lookupWord(word) {
    throw new Error('lookupWord method must be implemented by subclass');
  }

  /**
   * Abstract method - phải được implement bởi subclass
   */
  async hasWord(word) {
    throw new Error('hasWord method must be implemented by subclass');
  }

  /**
   * Common utility methods
   */
  normalizePinyin(pinyin) {
    return pinyin
      .replace(/([aeiou])1/g, '$1̄')
      .replace(/([aeiou])2/g, '$1́') 
      .replace(/([aeiou])3/g, '$1̌')
      .replace(/([aeiou])4/g, '$1̀')
      .replace(/\d/g, '');
  }

  getVietnameseTranslation(word) {
    // Bản dịch tiếng Việt cơ bản cho một số từ phổ biến
    const translations = {
      '你好': 'xin chào',
      '谢谢': 'cảm ơn',
      '再见': 'tạm biệt',
      '学习': 'học tập',
      '中文': 'tiếng Trung',
      '老师': 'giáo viên',
      '学生': 'học sinh',
      '朋友': 'bạn bè',
      '时间': 'thời gian',
      '工作': 'công việc',
      '家': 'nhà',
      '吃': 'ăn',
      '喝': 'uống',
      '好': 'tốt',
      '不': 'không',
      '我': 'tôi',
      '你': 'bạn',
      '他': 'anh ấy',
      '她': 'cô ấy'
    };
    
    return translations[word] || '';
  }

  /**
   * Standard data format cho tất cả providers
   */
  createStandardEntry(word, data) {
    return {
      word: word,
      traditional: data.traditional || word,
      simplified: data.simplified || word,
      pinyin: data.pinyin || '',
      vietnamese: data.vietnamese || this.getVietnameseTranslation(word),
      english: data.english || '',
      hskLevel: data.hskLevel || null,
      source: this.sourceName,
      confidence: data.confidence || this.confidence,
      ...data
    };
  }

  /**
   * Validate input word
   */
  validateWord(word) {
    if (!word || typeof word !== 'string') {
      throw new Error('Word must be a non-empty string');
    }
    return word.trim();
  }

  /**
   * Get statistics for this provider
   */
  getStatistics() {
    return {
      sourceName: this.sourceName,
      entryCount: this.data.size,
      isInitialized: this.isInitialized
    };
  }
}

module.exports = BaseDictionaryProvider; 