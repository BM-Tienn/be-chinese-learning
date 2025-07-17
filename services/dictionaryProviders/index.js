/**
 * DictionaryProviderFactory - Factory pattern cho dictionary providers
 * Quản lý việc tạo và sử dụng các dictionary providers khác nhau
 */

const CCCedictProvider = require('./ccCedictProvider');
const HSKProvider = require('./hskProvider');
const CharacterProvider = require('./characterProvider');

class DictionaryProviderFactory {
  constructor() {
    this.providers = new Map();
    this.isInitialized = false;
  }

  /**
   * Khởi tạo tất cả providers
   */
  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🔄 [DICT-FACTORY] Khởi tạo dictionary providers...');
    
    try {
      // Khởi tạo các providers
      this.providers.set('cccedict', new CCCedictProvider());
      this.providers.set('hsk', new HSKProvider());
      this.providers.set('character', new CharacterProvider());
      
      // Khởi tạo song song để tăng tốc
      await Promise.all([
        this.providers.get('cccedict').initialize(),
        this.providers.get('hsk').initialize(),
        this.providers.get('character').initialize()
      ]);
      
      this.isInitialized = true;
      console.log('✅ [DICT-FACTORY] Tất cả dictionary providers đã sẵn sàng');
      
    } catch (error) {
      console.error('❌ [DICT-FACTORY] Lỗi khởi tạo providers:', error.message);
      throw error;
    }
  }

  /**
   * Lấy provider theo tên
   */
  getProvider(providerName) {
    if (!this.isInitialized) {
      throw new Error('Dictionary providers chưa được khởi tạo. Gọi initialize() trước.');
    }
    
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider không tồn tại: ${providerName}`);
    }
    
    return provider;
  }

  /**
   * Lookup word từ tất cả providers
   */
  async lookupWord(word) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const results = {
      found: false,
      sources: [],
      combinedData: null
    };

    // Tìm kiếm từ tất cả providers
    for (const [providerName, provider] of this.providers) {
      try {
        const result = await provider.lookupWord(word);
        if (result.found) {
          results.sources.push(result.data);
          results.found = true;
        }
      } catch (error) {
        console.warn(`⚠️ [DICT-FACTORY] Provider ${providerName} lỗi:`, error.message);
      }
    }

    if (results.found) {
      results.combinedData = this.combineWordData(word, results.sources);
    }

    return results;
  }

  /**
   * Kiểm tra word có tồn tại trong bất kỳ provider nào
   */
  async hasWord(word) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    for (const [providerName, provider] of this.providers) {
      try {
        if (await provider.hasWord(word)) {
          return true;
        }
      } catch (error) {
        console.warn(`⚠️ [DICT-FACTORY] Provider ${providerName} lỗi:`, error.message);
      }
    }

    return false;
  }

  /**
   * Kết hợp dữ liệu từ nhiều sources
   */
  combineWordData(word, sources) {
    const combined = {
      word: word,
      pinyin: null,
      vietnameseReading: null,
      meaning: {
        primary: null,
        secondary: [],
        partOfSpeech: 'other'
      },
      grammar: {
        level: 'HSK1',
        frequency: 0
      },
      examples: [],
      metadata: {
        traditional: word,
        simplified: word
      },
      source: 'dictionary_lookup',
      confidence: 0.9,
      sourceDetails: sources.map(s => s.source)
    };

    // Ưu tiên: HSK > CC-CEDICT > Character
    const priorityOrder = ['builtin-verified', 'complete-hsk-vocabulary', 'json-hsk', 'cc-cedict-official', 'krmanik-cedict-json', 'fallback', 'unicode-basic'];
    
    const sortedSources = sources.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a.source);
      const bIndex = priorityOrder.indexOf(b.source);
      return aIndex - bIndex;
    });

    sortedSources.forEach(source => {
      if (!combined.pinyin && source.pinyin) {
        combined.pinyin = source.pinyin;
      }

      if (!combined.vietnameseReading && source.vietnamese) {
        combined.vietnameseReading = source.vietnamese;
      }

      if (!combined.meaning.primary) {
        if (source.vietnamese) {
          combined.meaning.primary = source.vietnamese;
        } else if (source.english) {
          combined.meaning.primary = source.english;
        }
      }

      if (source.english && source.english !== combined.meaning.primary) {
        combined.meaning.secondary.push(source.english);
      }

      if (source.hskLevel) {
        combined.grammar.level = `HSK${source.hskLevel}`;
      }

      if (source.traditional) combined.metadata.traditional = source.traditional;
      if (source.simplified) combined.metadata.simplified = source.simplified;
    });

    combined.meaning.secondary = [...new Set(combined.meaning.secondary)];
    return combined;
  }

  /**
   * Lấy bundle analysis với completeness và missing fields
   */
  async getWordAnalysisBundle(word) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Normalize input
    const cleanWord = typeof word === 'string' ? word.trim() : '';
    const lookup = await this.lookupWord(cleanWord);
    
    let completeness = 0;
    let missingFields = [];
    
    if (lookup.found && lookup.combinedData) {
      // Kiểm tra các trường thực sự meaningful
      const data = lookup.combinedData;
      
      // Các trường bắt buộc
      const requiredFields = [
        { key: 'pinyin', check: v => typeof v === 'string' && v.trim().length > 0 },
        { key: 'meaning.primary', check: v => typeof v === 'string' && v.trim().length > 0 },
        { key: 'examples', check: v => Array.isArray(v) && v.length > 0 },
      ];
      
      let present = 0;
      for (const field of requiredFields) {
        let value = data;
        for (const part of field.key.split('.')) {
          value = value && value[part];
        }
        if (field.check(value)) {
          present++;
        } else {
          missingFields.push(field.key);
        }
      }
      completeness = Math.round((present / requiredFields.length) * 100);
    } else {
      missingFields = ['pinyin', 'meaning.primary', 'examples'];
    }
    
    return {
      found: lookup.found,
      combinedData: lookup.combinedData,
      completeness,
      missingFields
    };
  }

  /**
   * Lấy thống kê từ tất cả providers
   */
  getStatistics() {
    const stats = {
      totalEntries: 0,
      providers: {},
      dataSources: []
    };

    for (const [providerName, provider] of this.providers) {
      const providerStats = provider.getStatistics();
      stats.providers[providerName] = providerStats;
      stats.totalEntries += providerStats.entryCount;
      
      if (providerStats.dataSources) {
        stats.dataSources.push(...providerStats.dataSources);
      }
    }

    return stats;
  }

  /**
   * Lấy danh sách providers có sẵn
   */
  getAvailableProviders() {
    return Array.from(this.providers.keys());
  }
}

// Singleton instance
const dictionaryProviderFactory = new DictionaryProviderFactory();

module.exports = dictionaryProviderFactory; 