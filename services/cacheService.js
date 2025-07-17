/**
 * CacheService - Redis cache layer cho WordAnalysisService
 * Theo đề xuất từ ai_dictionary_optimization.md
 */

const Redis = require('redis');

class CacheService {
  
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || null,
      db: process.env.REDIS_DB || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    };
    
    // Cache TTL settings (giây)
    this.ttl = {
      word_analysis: 7 * 24 * 60 * 60, // 7 ngày cho analysis kết quả
      dictionary_lookup: 30 * 24 * 60 * 60, // 30 ngày cho dictionary data  
      batch_session: 1 * 60 * 60, // 1 giờ cho batch session
      temp_cache: 5 * 60 // 5 phút cho temporary data
    };
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    if (this.isConnected) return true;
    
    try {
      console.log('🔄 [CACHE-SERVICE] Initializing Redis connection...');
      
      this.redis = Redis.createClient(this.config);
      
      this.redis.on('connect', () => {
        console.log('✅ [CACHE-SERVICE] Redis connected successfully');
        this.isConnected = true;
      });
      
      this.redis.on('error', (err) => {
        console.error('❌ [CACHE-SERVICE] Redis connection error:', err);
        this.isConnected = false;
      });
      
      this.redis.on('end', () => {
        console.log('⚠️ [CACHE-SERVICE] Redis connection ended');
        this.isConnected = false;
      });

      await this.redis.connect();
      await this.redis.ping();
      
      return true;
      
    } catch (error) {
      console.error('❌ [CACHE-SERVICE] Failed to initialize Redis:', error);
      // Don't throw error - continue without cache
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Generate cache key cho word analysis
   */
  generateWordKey(word, context = '') {
    const contextHash = context ? this.hashString(context) : '';
    return `word:${word}${contextHash ? ':' + contextHash : ''}`;
  }

  /**
   * Generate cache key cho dictionary lookup
   */
  generateDictKey(word) {
    return `dict:${word}`;
  }

  /**
   * Generate cache key cho batch session
   */
  generateBatchKey(words, context = '') {
    const wordsHash = this.hashString(words.sort().join(','));
    const contextHash = context ? this.hashString(context) : '';
    return `batch:${wordsHash}${contextHash ? ':' + contextHash : ''}`;
  }

  /**
   * Hash string for cache key generation
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get word analysis từ cache
   */
  async getWordAnalysis(word, context = '') {
    if (!this.isConnected) return null;
    
    try {
      const key = this.generateWordKey(word, context);
      const cached = await this.redis.get(key);
      
      if (cached) {
        console.log(`📋 [CACHE-SERVICE] Cache HIT for word: "${word}"`);
        const data = JSON.parse(cached);
        
        // Sanitize data trước khi trả về
        const sanitizedData = this.sanitizeCachedData(data);
        
        return {
          ...sanitizedData,
          fromCache: true,
          cacheSource: 'redis'
        };
      }
      
      console.log(`❌ [CACHE-SERVICE] Cache MISS for word: "${word}"`);
      return null;
      
    } catch (error) {
      console.error('❌ [CACHE-SERVICE] Error getting word from cache:', error);
      return null;
    }
  }

  /**
   * Sanitize cached data để đồng nhất format
   */
  sanitizeCachedData(data) {
    // Đảm bảo các field bắt buộc có mặt
    return {
      _id: data._id || data.id,
      word: data.word,
      pinyin: data.pinyin,
      vietnameseReading: data.vietnameseReading,
      meaning: {
        primary: data.meaning?.primary || '',
        secondary: data.meaning?.secondary || [],
        partOfSpeech: data.meaning?.partOfSpeech || 'other'
      },
      grammar: {
        level: data.grammar?.level || 'HSK1',
        frequency: data.grammar?.frequency || 50,
        formality: data.grammar?.formality || 'neutral'
      },
      examples: data.examples || [],
      related: {
        synonyms: data.related?.synonyms || [],
        antonyms: data.related?.antonyms || [],
        compounds: data.related?.compounds || []
      },
      isVerified: data.isVerified || false,
      source: data.source || 'unknown',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      cachedAt: data.cachedAt
    };
  }

  /**
   * Set word analysis vào cache
   */
  async setWordAnalysis(word, data, context = '') {
    if (!this.isConnected) return false;
    
    try {
      const key = this.generateWordKey(word, context);
      const cacheData = {
        ...data,
        cachedAt: new Date().toISOString(),
        cacheSource: 'redis'
      };
      
      await this.redis.setEx(key, this.ttl.word_analysis, JSON.stringify(cacheData));
      console.log(`✅ [CACHE-SERVICE] Cached word analysis: "${word}"`);
      return true;
      
    } catch (error) {
      console.error('❌ [CACHE-SERVICE] Error setting word cache:', error);
      return false;
    }
  }

  /**
   * Get dictionary lookup từ cache
   */
  async getDictionaryLookup(word) {
    if (!this.isConnected) return null;
    
    try {
      const key = this.generateDictKey(word);
      const cached = await this.redis.get(key);
      
      if (cached) {
        console.log(`📚 [CACHE-SERVICE] Dictionary cache HIT for: "${word}"`);
        return JSON.parse(cached);
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ [CACHE-SERVICE] Error getting dictionary cache:', error);
      return null;
    }
  }

  /**
   * Set dictionary lookup vào cache
   */
  async setDictionaryLookup(word, data) {
    if (!this.isConnected) return false;
    
    try {
      const key = this.generateDictKey(word);
      const cacheData = {
        ...data,
        cachedAt: new Date().toISOString()
      };
      
      await this.redis.setEx(key, this.ttl.dictionary_lookup, JSON.stringify(cacheData));
      console.log(`📚 [CACHE-SERVICE] Cached dictionary lookup: "${word}"`);
      return true;
      
    } catch (error) {
      console.error('❌ [CACHE-SERVICE] Error setting dictionary cache:', error);
      return false;
    }
  }

  /**
   * Get batch session results
   */
  async getBatchSession(words, context = '') {
    if (!this.isConnected) return null;
    
    try {
      const key = this.generateBatchKey(words, context);
      const cached = await this.redis.get(key);
      
      if (cached) {
        console.log(`🔄 [CACHE-SERVICE] Batch cache HIT for ${words.length} words`);
        return JSON.parse(cached);
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ [CACHE-SERVICE] Error getting batch cache:', error);
      return null;
    }
  }

  /**
   * Set batch session results
   */
  async setBatchSession(words, data, context = '') {
    if (!this.isConnected) return false;
    
    try {
      const key = this.generateBatchKey(words, context);
      const cacheData = {
        ...data,
        cachedAt: new Date().toISOString(),
        wordCount: words.length
      };
      
      await this.redis.setEx(key, this.ttl.batch_session, JSON.stringify(cacheData));
      console.log(`🔄 [CACHE-SERVICE] Cached batch session: ${words.length} words`);
      return true;
      
    } catch (error) {
      console.error('❌ [CACHE-SERVICE] Error setting batch cache:', error);
      return false;
    }
  }

  /**
   * Multi-get cho multiple words
   */
  async getMultipleWords(words, context = '') {
    if (!this.isConnected) return {};
    
    try {
      const keys = words.map(word => this.generateWordKey(word, context));
      const results = await this.redis.mGet(keys);
      
      const cached = {};
      const hits = [];
      const misses = [];
      
      results.forEach((result, index) => {
        const word = words[index];
        if (result) {
          const parsedData = JSON.parse(result);
          cached[word] = this.sanitizeCachedData(parsedData);
          hits.push(word);
        } else {
          misses.push(word);
        }
      });
      
      console.log(`📊 [CACHE-SERVICE] Multi-get: ${hits.length} hits, ${misses.length} misses`);
      
      return {
        cached,
        hits,
        misses,
        hitRate: (hits.length / words.length * 100).toFixed(1)
      };
      
    } catch (error) {
      console.error('❌ [CACHE-SERVICE] Error in multi-get:', error);
      return { cached: {}, hits: [], misses: words, hitRate: '0' };
    }
  }

  /**
   * Multi-set cho multiple words
   */
  async setMultipleWords(wordDataMap, context = '') {
    if (!this.isConnected) return false;
    
    try {
      const pipeline = this.redis.multi();
      
      Object.entries(wordDataMap).forEach(([word, data]) => {
        const key = this.generateWordKey(word, context);
        const cacheData = {
          ...data,
          cachedAt: new Date().toISOString(),
          cacheSource: 'redis'
        };
        pipeline.setEx(key, this.ttl.word_analysis, JSON.stringify(cacheData));
      });
      
      await pipeline.exec();
      console.log(`✅ [CACHE-SERVICE] Multi-set completed: ${Object.keys(wordDataMap).length} words`);
      return true;
      
    } catch (error) {
      console.error('❌ [CACHE-SERVICE] Error in multi-set:', error);
      return false;
    }
  }

  /**
   * Clear cache cho specific word
   */
  async clearWord(word, context = '') {
    if (!this.isConnected) return false;
    
    try {
      const key = this.generateWordKey(word, context);
      await this.redis.del(key);
      console.log(`🗑️ [CACHE-SERVICE] Cleared cache for word: "${word}"`);
      return true;
      
    } catch (error) {
      console.error('❌ [CACHE-SERVICE] Error clearing word cache:', error);
      return false;
    }
  }

  /**
   * Clear all word analysis cache
   */
  async clearAllWords() {
    if (!this.isConnected) return false;
    
    try {
      const keys = await this.redis.keys('word:*');
      if (keys.length > 0) {
        await this.redis.del(keys);
        console.log(`🗑️ [CACHE-SERVICE] Cleared ${keys.length} word cache entries`);
      }
      return true;
      
    } catch (error) {
      console.error('❌ [CACHE-SERVICE] Error clearing all word cache:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStatistics() {
    if (!this.isConnected) {
      return {
        connected: false,
        error: 'Redis not connected'
      };
    }
    
    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      
      // Count different types of keys
      const wordKeys = await this.redis.keys('word:*');
      const dictKeys = await this.redis.keys('dict:*');
      const batchKeys = await this.redis.keys('batch:*');
      
      return {
        connected: true,
        memory: this.parseRedisInfo(info),
        keyspace: this.parseRedisInfo(keyspace),
        keys: {
          word_analysis: wordKeys.length,
          dictionary: dictKeys.length,
          batch_sessions: batchKeys.length,
          total: wordKeys.length + dictKeys.length + batchKeys.length
        },
        ttl_settings: this.ttl
      };
      
    } catch (error) {
      console.error('❌ [CACHE-SERVICE] Error getting cache stats:', error);
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Parse Redis INFO output
   */
  parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const parsed = {};
    
    lines.forEach(line => {
      const [key, value] = line.split(':');
      if (key && value) {
        parsed[key] = value;
      }
    });
    
    return parsed;
  }

  /**
   * Health check
   */
  async healthCheck() {
    if (!this.isConnected) {
      return { healthy: false, error: 'Not connected' };
    }
    
    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;
      
      return {
        healthy: true,
        latency: `${latency}ms`,
        connected: this.isConnected
      };
      
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.redis && this.isConnected) {
      try {
        await this.redis.quit();
        console.log('✅ [CACHE-SERVICE] Redis connection closed gracefully');
      } catch (error) {
        console.error('❌ [CACHE-SERVICE] Error closing Redis:', error);
      }
    }
  }
}

// Singleton instance
const cacheService = new CacheService();

module.exports = cacheService; 