const express = require('express');
const WordAnalysisService = require('../services/wordAnalysisService');
const WordDetail = require('../models/WordDetail');
const cacheService = require('../services/cacheService');
const dictionaryService = require('../services/dictionaryService');

const router = express.Router();

/**
 * GET /api/words/:word
 * Lấy thông tin chi tiết của một từ
 */
router.get('/:word', async (req, res) => {
  try {
    const { word } = req.params;
    const { context, forceRefresh } = req.query;

    console.log(`📚 [WORDS-API] Getting word detail: "${word}"`);

    if (!word || word.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Word parameter is required'
      });
    }

    // Lấy thông tin từ (từ cache hoặc AI analysis)
    const result = await WordAnalysisService.getWordDetail(
      word.trim(), 
      context || '',
      forceRefresh === 'true'
    );

    if (result.success) {
      console.log(`📤 [WORDS-API] Sending response for word: "${word}"`, {
        success: result.success,
        hasData: !!result.data,
        fromCache: result.fromCache,
        method: result.method,
        cost: result.cost,
        analysisTime: result.analysisTime
      });
      
      res.json({
        success: true,
        data: result.data,
        fromCache: result.fromCache,
        cost: result.cost || null,
        analysisTime: result.analysisTime || null
      });
    } else {
      console.error(`❌ [WORDS-API] Failed to get word detail: "${word}"`, {
        success: result.success,
        error: result.error,
        method: result.method
      });
      
      res.status(500).json({
        success: false,
        error: result.error,
        word: word
      });
    }
    
  } catch (error) {
    console.error('❌ [WORDS-API] Error in GET /:word:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * POST /api/words/batch
 * Phân tích nhiều từ cùng lúc
 */
router.post('/batch', async (req, res) => {
  try {
    const { words, context } = req.body;

    console.log(`🔄 [WORDS-API] Batch processing ${words?.length || 0} words`);

    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Words array is required'
      });
    }

    if (words.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 50 words per batch request'
      });
    }

    // Validate words
    const validWords = words.filter(word => 
      word && typeof word === 'string' && word.trim().length > 0
    );

    if (validWords.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid words found in request'
      });
    }

    // Batch analyze
    const result = await WordAnalysisService.batchAnalyzeWords(
      validWords.map(w => w.trim()),
      context || ''
    );

    res.json({
      success: true,
      results: result.results,
      summary: result.summary
    });
    
  } catch (error) {
    console.error('❌ [WORDS-API] Error in POST /batch:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * GET /api/words/search/:query
 * Tìm kiếm từ vựng trong database
 */
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 20, skip = 0, level, partOfSpeech } = req.query;

    console.log(`🔍 [WORDS-API] Searching words: "${query}"`);

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    // Build search filter
    const searchFilter = {
      $or: [
        { word: { $regex: query.trim(), $options: 'i' } },
        { pinyin: { $regex: query.trim(), $options: 'i' } },
        { 'meaning.primary': { $regex: query.trim(), $options: 'i' } },
        { 'meaning.secondary': { $in: [new RegExp(query.trim(), 'i')] } }
      ]
    };

    // Add additional filters
    if (level) {
      searchFilter['grammar.level'] = level;
    }
    if (partOfSpeech) {
      searchFilter['meaning.partOfSpeech'] = partOfSpeech;
    }

    // Execute search
    const words = await WordDetail.find(searchFilter)
      .sort({ 'grammar.frequency': -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select('-aiAnalysis.prompt') // Exclude long prompt field
      .lean();

    const totalCount = await WordDetail.countDocuments(searchFilter);

    res.json({
      success: true,
      data: words,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: totalCount > parseInt(skip) + words.length
      }
    });
    
  } catch (error) {
    console.error('❌ [WORDS-API] Error in GET /search:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * GET /api/words/stats/tokens
 * Lấy thống kê sử dụng token
 */
router.get('/stats/tokens', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    console.log(`📊 [WORDS-API] Getting token stats for ${days} days`);

    const stats = await WordAnalysisService.getTokenStats(parseInt(days));
    
    if (stats) {
      res.json({
        success: true,
        data: stats
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to get token statistics'
      });
    }
    
  } catch (error) {
    console.error('❌ [WORDS-API] Error in GET /stats/tokens:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * PUT /api/words/:id/verify
 * Xác minh từ vựng (cho admin/expert)
 */
router.put('/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified = true, corrections } = req.body;

    console.log(`✅ [WORDS-API] Verifying word ID: ${id}`);

    const word = await WordDetail.findById(id);
    if (!word) {
      return res.status(404).json({
        success: false,
        error: 'Word not found'
      });
    }

    // Apply corrections if provided
    if (corrections) {
      Object.keys(corrections).forEach(key => {
        if (word[key] !== undefined) {
          word[key] = corrections[key];
        }
      });
    }

    word.isVerified = isVerified;
    word.updatedAt = new Date();
    
    await word.save();

    res.json({
      success: true,
      data: word,
      message: `Word ${isVerified ? 'verified' : 'unverified'} successfully`
    });
    
  } catch (error) {
    console.error('❌ [WORDS-API] Error in PUT /:id/verify:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * DELETE /api/words/:id
 * Xóa từ vựng (cho admin)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ [WORDS-API] Deleting word ID: ${id}`);

    const deletedWord = await WordDetail.findByIdAndDelete(id);
    
    if (!deletedWord) {
      return res.status(404).json({
        success: false,
        error: 'Word not found'
      });
    }

    res.json({
      success: true,
      message: 'Word deleted successfully',
      data: { id, word: deletedWord.word }
    });
    
  } catch (error) {
    console.error('❌ [WORDS-API] Error in DELETE /:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * GET /api/words/level/:level
 * Lấy từ vựng theo level HSK
 */
router.get('/level/:level', async (req, res) => {
  try {
    const { level } = req.params;
    const { limit = 50, skip = 0, verified } = req.query;

    console.log(`📖 [WORDS-API] Getting words for level: ${level}`);

    const validLevels = ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6', 'Advanced'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid HSK level',
        validLevels: validLevels
      });
    }

    const filter = { 'grammar.level': level };
    if (verified !== undefined) {
      filter.isVerified = verified === 'true';
    }

    const words = await WordDetail.find(filter)
      .sort({ 'grammar.frequency': -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select('-aiAnalysis.prompt')
      .lean();

    const totalCount = await WordDetail.countDocuments(filter);

    res.json({
      success: true,
      data: words,
      level: level,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: totalCount > parseInt(skip) + words.length
      }
    });
    
  } catch (error) {
    console.error('❌ [WORDS-API] Error in GET /level/:level:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * GET /api/words/cache/stats
 * Lấy thống kê cache và optimization
 */
router.get('/cache/stats', async (req, res) => {
  try {
    console.log('📊 [WORDS-API] Getting cache and optimization stats...');

    // Initialize services if needed
    if (!cacheService.isConnected) {
      await cacheService.initialize();
    }
    await dictionaryService.initialize();

    // Get cache statistics
    const cacheStats = await cacheService.getStatistics();
    
    // Get dictionary statistics
    const dictStats = dictionaryService.getStatistics();
    
    // Get token usage statistics
    const tokenStats = await WordAnalysisService.getTokenStats(30);
    
    // Cache health check
    const cacheHealth = await cacheService.healthCheck();

    res.json({
      success: true,
      data: {
        cache: {
          ...cacheStats,
          health: cacheHealth
        },
        dictionary: dictStats,
        tokenUsage: tokenStats,
        optimization: {
          cacheHitRate: cacheStats.keys ? 
            ((cacheStats.keys.word_analysis + cacheStats.keys.dictionary) / 
             (cacheStats.keys.total || 1) * 100).toFixed(1) + '%' : 'N/A',
          costSavings: tokenStats?.costAnalysis?.savings || null
        },
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ [WORDS-API] Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * DELETE /api/words/cache/clear
 * Xóa cache (admin function)
 */
router.delete('/cache/clear', async (req, res) => {
  try {
    const { type } = req.query; // 'all', 'words', 'dictionary'
    
    console.log(`🗑️ [WORDS-API] Clearing cache: ${type || 'all'}`);

    if (!cacheService.isConnected) {
      await cacheService.initialize();
    }

    let cleared = false;
    let message = '';

    switch (type) {
      case 'words':
        cleared = await cacheService.clearAllWords();
        message = 'Word analysis cache cleared';
        break;
      case 'all':
      default:
        // Clear all cache types
        cleared = await cacheService.clearAllWords();
        // Could add dictionary cache clearing here if implemented
        message = 'All cache cleared';
        break;
    }

    if (cleared) {
      res.json({
        success: true,
        message: message,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to clear cache'
      });
    }
    
  } catch (error) {
    console.error('❌ [WORDS-API] Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * POST /api/words/cache/warmup
 * Pre-cache từ HSK để tăng performance
 */
router.post('/cache/warmup', async (req, res) => {
  try {
    const { levels = [1, 2, 3] } = req.body; // HSK levels to warm up
    
    console.log(`🔥 [WORDS-API] Cache warmup for HSK levels: ${levels.join(', ')}`);

    // Get HSK words for specified levels
    const hskWords = [];
    for (const level of levels) {
      const words = await WordDetail.find({ 
        'grammar.level': `HSK${level}` 
      }).select('word').limit(100); // Limit to avoid overwhelming
      
      hskWords.push(...words.map(w => w.word));
    }

    if (hskWords.length === 0) {
      return res.json({
        success: true,
        message: 'No HSK words found to warm up',
        wordsProcessed: 0
      });
    }

    // Batch analyze to warm up cache
    const result = await WordAnalysisService.batchAnalyzeWords(hskWords, 'cache_warmup');
    
    res.json({
      success: true,
      message: `Cache warmup completed for HSK levels ${levels.join(', ')}`,
      wordsProcessed: result.summary.total,
      cacheHits: result.summary.fromCache,
      newAnalyses: result.summary.success - result.summary.fromCache,
      cost: result.summary.totalCost
    });
    
  } catch (error) {
    console.error('❌ [WORDS-API] Error in cache warmup:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * GET /api/words/dictionary/lookup/:word
 * Tra cứu từ trong dictionary (không AI)
 */
router.get('/dictionary/lookup/:word', async (req, res) => {
  try {
    const { word } = req.params;
    
    console.log(`📚 [WORDS-API] Dictionary lookup: "${word}"`);

    await dictionaryService.initialize();
    
    const lookup = await dictionaryService.lookupWord(word);
    const completeness = await dictionaryService.getWordCompleteness(word);

    if (lookup.found) {
      res.json({
        success: true,
        data: lookup.combinedData,
        sources: lookup.sources.map(s => s.source),
        completeness: completeness,
        fromDictionary: true
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Word not found in dictionaries',
        word: word,
        suggestion: 'Try the full analysis endpoint with AI enhancement'
      });
    }
    
  } catch (error) {
    console.error('❌ [WORDS-API] Error in dictionary lookup:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

module.exports = router; 