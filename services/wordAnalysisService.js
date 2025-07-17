const openai = require('../config/openai');
const WordDetail = require('../models/WordDetail');
const dictionaryService = require('./dictionaryService');

class WordAnalysisService {

  /**
   * Validate input parameters
   */
  static validateInput(word, context = '') {
    if (!word || typeof word !== 'string') {
      throw new Error('Từ cần phân tích phải là chuỗi không rỗng');
    }

    const cleanWord = word.trim();
    if (cleanWord.length === 0) {
      throw new Error('Từ cần phân tích không được rỗng');
    }

    if (cleanWord.length > 50) {
      throw new Error('Từ cần phân tích quá dài (tối đa 50 ký tự)');
    }

    if (context && typeof context !== 'string') {
      throw new Error('Context phải là chuỗi');
    }

    return cleanWord;
  }

  /**
   * Retry logic với exponential backoff và timeout
   */
  static async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000, timeoutMs = 30000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Thêm timeout cho mỗi lần thử
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
        });

        const result = await Promise.race([fn(), timeoutPromise]);
        return result;
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.warn(`⚠️ Lần thử ${attempt} thất bại, thử lại sau ${delay}ms:`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Ước tính số token sử dụng cho prompt (rough estimation)
   * OpenAI sử dụng tiktoken, nhưng đây là ước tính đơn giản
   */
  static estimateTokens(text) {
    // Ước tính: 1 token ≈ 4 ký tự cho tiếng Anh, 1-2 ký tự cho tiếng Trung
    const englishChars = text.match(/[a-zA-Z\s]/g)?.length || 0;
    const chineseChars = text.match(/[\u4e00-\u9fff]/g)?.length || 0;
    const otherChars = text.length - englishChars - chineseChars;

    const estimatedTokens = Math.ceil(
      englishChars / 4 +
      chineseChars / 1.5 +
      otherChars / 3
    );

    return estimatedTokens;
  }

  /**
   * Tính toán chi phí token dựa trên model và loại token
   */
  static calculateTokenCost(inputTokens, outputTokens, model = 'gpt-4') {
    // Giá token của OpenAI (USD per 1K tokens) - cập nhật theo giá hiện tại
    const pricing = {
      'gpt-4': {
        input: 0.03,   // $0.03 per 1K input tokens
        output: 0.06   // $0.06 per 1K output tokens
      },
      'gpt-4o': {
        input: 0.015,  // $0.015 per 1K input tokens (cheaper than GPT-4)
        output: 0.03   // $0.03 per 1K output tokens
      },
      'gpt-3.5-turbo': {
        input: 0.0015, // $0.0015 per 1K input tokens  
        output: 0.002  // $0.002 per 1K output tokens
      }
    };

    const modelPricing = pricing[model] || pricing['gpt-4'];
    const cost = (inputTokens / 1000 * modelPricing.input) +
      (outputTokens / 1000 * modelPricing.output);

    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      costUSD: cost,
      costVND: cost * 24000, // Ước tính tỉ giá USD/VND
      model: model
    };
  }

  /**
   * Chọn model AI phù hợp dựa trên complexity và yêu cầu
   * Theo đề xuất từ ai_dictionary_optimization.md
   */
  static selectOptimalModel(word, context = '', taskType = 'full_analysis') {
    const complexity = this.assessWordComplexity(word, context);

    // Ưu tiên GPT-3.5 cho các trường hợp đơn giản
    if (taskType === 'basic_info' || complexity.level === 'simple') {
      return 'gpt-3.5-turbo';
    }

    // GPT-4o cho trường hợp trung bình
    if (complexity.level === 'medium' || taskType === 'examples_only') {
      return 'gpt-4o';
    }

    // GPT-4 chỉ cho trường hợp phức tạp
    if (complexity.level === 'complex' || taskType === 'deep_analysis') {
      return 'gpt-4';
    }

    return 'gpt-3.5-turbo'; // default fallback
  }

  /**
   * Đánh giá độ phức tạp của từ
   */
  static assessWordComplexity(word, context = '') {
    let complexityScore = 0;
    const factors = [];

    // Length factor
    if (word.length > 2) {
      complexityScore += 20;
      factors.push('multi_character');
    }

    // Character complexity (stroke count estimate)
    const complexChars = ['響', '影', '現', '會', '過', '還', '開', '關', '學', '說'];
    const hasComplexChars = word.split('').some(char => complexChars.includes(char));
    if (hasComplexChars) {
      complexityScore += 30;
      factors.push('complex_characters');
    }

    // Context complexity
    if (context && context.length > 50) {
      complexityScore += 15;
      factors.push('rich_context');
    }

    // Technical/literary terms (heuristic)
    const technicalIndicators = ['技', '科', '学', '术', '理', '论', '法', '式'];
    const hasTechnicalChars = word.split('').some(char => technicalIndicators.includes(char));
    if (hasTechnicalChars) {
      complexityScore += 25;
      factors.push('technical_term');
    }

    let level = 'simple';
    if (complexityScore >= 50) {
      level = 'complex';
    } else if (complexityScore >= 25) {
      level = 'medium';
    }

    // Tự xác định model thay vì gọi selectOptimalModel để tránh vòng lặp vô hạn
    let recommendedModel = 'gpt-3.5-turbo'; // default
    if (level === 'complex') {
      recommendedModel = 'gpt-4';
    } else if (level === 'medium') {
      recommendedModel = 'gpt-4o';
    }

    return {
      score: complexityScore,
      level,
      factors,
      recommended_model: recommendedModel
    };
  }

  /**
   * Tạo prompt tối ưu dựa trên missing data từ dictionary lookup
   * Chỉ yêu cầu AI sinh phần thiếu
   */
  static createOptimizedPrompt(word, missingFields = [], existingData = null, context = '') {
    // Nếu có đầy đủ thông tin cơ bản, chỉ yêu cầu ví dụ
    if (missingFields.length === 1 && missingFields.includes('examples')) {
      return this.createExamplesOnlyPrompt(word, existingData, context);
    }

    // Nếu thiếu nhiều thông tin, tạo prompt đầy đủ nhưng tối ưu
    return this.createMinimalAnalysisPrompt(word, missingFields, existingData, context);
  }

  /**
   * Prompt chỉ yêu cầu ví dụ (tiết kiệm token)
   */
  static createExamplesOnlyPrompt(word, existingData, context = '') {
    const prompt = `Tạo 3 ví dụ câu thực tế cho từ tiếng Trung "${word}".

Thông tin từ: 
- Nghĩa: ${existingData?.meaning?.primary || 'chưa có'}
- Pinyin: ${existingData?.pinyin || 'chưa có'}

Trả về JSON:
{
  "examples": [
    {
      "chinese": "câu ví dụ",
      "pinyin": "phiên âm câu",
      "vietnamese": "dịch tiếng Việt",
      "difficulty": "1-5",
      "context": "formal|informal|neutral"
    }
  ]
}

${context ? `Ngữ cảnh: ${context}` : ''}
Chỉ trả về JSON, không giải thích.`;

    return prompt;
  }

  /**
   * Prompt tối thiểu chỉ yêu cầu thông tin thiếu
   */
  static createMinimalAnalysisPrompt(word, missingFields, existingData, context = '') {
    const needFields = [];

    if (missingFields.includes('pinyin') || missingFields.includes('vietnameseReading')) {
      needFields.push('"pinyin": "phiên âm chuẩn"');
      needFields.push('"vietnameseReading": "âm Hán Việt"');
    }

    if (missingFields.includes('meaning.primary')) {
      needFields.push(`"meaning": {
        "primary": "nghĩa chính tiếng Việt",
        "partOfSpeech": "noun|verb|adjective|adverb|other"
      }`);
    }

    if (missingFields.includes('examples')) {
      needFields.push(`"examples": [{
        "chinese": "ví dụ",
        "pinyin": "phiên âm",
        "vietnamese": "dịch",
        "difficulty": "1-5"
      }]`);
    }

    const prompt = `Phân tích từ "${word}" và trả về JSON với các thông tin sau:

{
  "word": "${word}",
  ${needFields.join(',\n  ')}
}

${context ? `Ngữ cảnh: ${context}` : ''}
Chỉ trả về JSON.`;

    return prompt;
  }

  /**
   * Hybrid analysis: Dictionary + AI (Đơn giản hóa)
   */
  static async hybridAnalyzeWord(word, context = '', forceRefresh = false) {
    const analysisId = `hybrid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      console.log(`🔍 [HYBRID-ANALYSIS] Bắt đầu phân tích hybrid cho từ: "${word}"`);

      // Validate input
      const cleanWord = this.validateInput(word, context);

      // Step 1: Check MongoDB first
      if (!forceRefresh) {
        try {
          const cachedWord = await WordDetail.findOne({ word: cleanWord }).lean();
          if (cachedWord) {
            console.log(`📋 [${analysisId}] Tìm thấy dữ liệu trong DB cho từ: "${cleanWord}"`);
            return {
              success: true,
              data: this.sanitizeWordData(cachedWord),
              fromCache: true,
              method: 'database',
              cost: { totalTokens: 0, costUSD: 0, costVND: 0 },
              analysisId: analysisId
            };
          }
        } catch (dbError) {
          console.warn(`⚠️ [${analysisId}] Lỗi DB lookup:`, dbError.message);
        }
      }

      // Step 2: Check dictionary lookup
      console.log(`📚 [${analysisId}] Kiểm tra từ điển cho từ: "${cleanWord}"`);

      const dictBundle = await dictionaryService.getWordAnalysisBundle(cleanWord);
      if (dictBundle.found) {
        console.log(`✅ [${analysisId}] Tìm thấy trong từ điển, completeness: ${dictBundle.completeness}%, thiếu: ${dictBundle.missingFields.join(', ')}`);
        // If dictionary data is sufficient (>80% complete), use it
        if (dictBundle.completeness >= 80) {
          const wordDetail = await this.saveDictionaryResult(cleanWord, dictBundle.combinedData, context);
          return {
            success: true,
            data: this.sanitizeWordData(wordDetail),
            fromCache: false,
            method: 'dictionary_only',
            cost: { totalTokens: 0, costUSD: 0, costVND: 0 },
            completeness: dictBundle.completeness,
            analysisId: analysisId
          };
        }
        // If incomplete, use AI to fill missing parts
        console.log(`🤖 [${analysisId}] Dữ liệu từ điển không đầy đủ, sử dụng AI để bổ sung`);
        return await this.enhanceWithAI(cleanWord, dictBundle.combinedData, dictBundle.missingFields, context);
      }

      // Step 3: No dictionary data, full AI analysis
      console.log(`🤖 [${analysisId}] Không tìm thấy dữ liệu từ điển, sử dụng phân tích AI đầy đủ`);
      return await this.fullAIAnalysis(cleanWord, context);

    } catch (error) {
      console.error(`❌ [${analysisId}] Lỗi trong phân tích hybrid cho từ "${word}":`, error);
      return {
        success: false,
        error: error.message,
        word: word,
        method: 'error',
        analysisId: analysisId
      };
    }
  }

  /**
   * Save dictionary result to database
   */
  static async saveDictionaryResult(word, dictionaryData, context = '') {
    try {
      const wordDetail = new WordDetail({
        word: word.trim(),
        pinyin: dictionaryData.pinyin,
        vietnameseReading: dictionaryData.vietnameseReading,
        meaning: dictionaryData.meaning,
        grammar: dictionaryData.grammar,
        examples: dictionaryData.examples || [],
        related: dictionaryData.related || {},
        source: 'dictionary_import',
        aiAnalysis: {
          model: 'none',
          tokensUsed: 0,
          confidence: dictionaryData.confidence || 0.9,
          analyzedAt: new Date(),
          prompt: 'dictionary_lookup'
        }
      });

      await wordDetail.save();

      console.log(`✅ Lưu kết quả từ điển vào DB cho từ: "${word}"`);
      return wordDetail;
    } catch (error) {
      console.error(`❌ Lỗi lưu kết quả từ điển cho từ "${word}":`, error);
      throw error;
    }
  }

  /**
   * Enhance dictionary data with AI for missing parts
   */
  static async enhanceWithAI(word, existingData, missingFields, context = '') {
    const analysisId = `enhance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const complexity = this.assessWordComplexity(word, context);
      const selectedModel = this.selectOptimalModel(word, context, 'enhancement');

      console.log(`🎯 [${analysisId}] Sử dụng ${selectedModel} để bổ sung, thiếu: ${missingFields.join(', ')}`);

      // Create optimized prompt for missing fields only
      const prompt = this.createOptimizedPrompt(word, missingFields, existingData, context);
      const estimatedInputTokens = this.estimateTokens(prompt);

      console.log(`📊 [${analysisId}] Ước tính tokens: ${estimatedInputTokens}, độ phức tạp: ${complexity.level}`);

      const startTime = Date.now();
      const response = await this.retryWithBackoff(async () => {
        return await openai.chat.completions.create({
          model: selectedModel,
          messages: [
            {
              role: "system",
              content: "Bạn là chuyên gia từ vựng tiếng Trung. Trả về chính xác JSON theo yêu cầu."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.2, // Lower for more consistent results
          max_tokens: missingFields.includes('examples') ? 600 : 300 // Adjust based on missing fields
        });
      }, 3, 1000, 30000); // 3 retries, 1s base delay, 30s timeout

      const analysisTime = Date.now() - startTime;

      // Parse AI response
      let aiData;
      try {
        const responseContent = response.choices[0].message.content.trim();
        const jsonContent = responseContent.replace(/```json\n?|\n?```/g, '');
        aiData = JSON.parse(jsonContent);
      } catch (parseError) {
        console.error(`❌ [${analysisId}] Lỗi parse JSON:`, parseError);
        throw new Error('Phản hồi AI không đúng định dạng JSON');
      }

      // Merge dictionary data with AI enhancement
      const enhancedData = this.mergeDataSources(existingData, aiData);

      // Calculate cost
      const actualTokenUsage = response.usage || {
        prompt_tokens: estimatedInputTokens,
        completion_tokens: this.estimateTokens(response.choices[0].message.content),
        total_tokens: 0
      };
      actualTokenUsage.total_tokens = actualTokenUsage.prompt_tokens + actualTokenUsage.completion_tokens;

      const cost = this.calculateTokenCost(
        actualTokenUsage.prompt_tokens,
        actualTokenUsage.completion_tokens,
        selectedModel
      );

      // Save enhanced result
      const wordDetail = new WordDetail({
        word: word.trim(),
        pinyin: enhancedData.pinyin,
        vietnameseReading: enhancedData.vietnameseReading,
        meaning: enhancedData.meaning,
        grammar: enhancedData.grammar,
        examples: enhancedData.examples || [],
        related: enhancedData.related || {},
        source: 'ai_generated',
        aiAnalysis: {
          model: selectedModel,
          tokensUsed: actualTokenUsage.total_tokens,
          confidence: 0.95,
          analyzedAt: new Date(),
          prompt: prompt,
          enhancementFields: missingFields
        }
      });

      await wordDetail.save();

      console.log(`✅ [${analysisId}] Đã lưu từ "${word}" vào DB, phương thức: dictionary+${selectedModel}`);
      console.log(`💰 [${analysisId}] Chi phí: $${cost.costUSD.toFixed(4)} (${cost.costVND.toFixed(0)} VND)`);

      return {
        success: true,
        data: this.sanitizeWordData(wordDetail),
        fromCache: false,
        method: `hybrid_dictionary_${selectedModel}`,
        cost: cost,
        analysisTime: analysisTime,
        enhancementFields: missingFields,
        analysisId: analysisId
      };
    } catch (error) {
      console.error(`❌ [${analysisId}] Lỗi trong enhanceWithAI cho từ "${word}":`, error);
      throw error;
    }
  }

  /**
   * Full AI analysis (fallback when no dictionary data)
   */
  static async fullAIAnalysis(word, context = '') {
    const analysisId = `fullai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const complexity = this.assessWordComplexity(word, context);
      const selectedModel = this.selectOptimalModel(word, context, 'full_analysis');

      console.log(`🤖 [${analysisId}] Phân tích AI đầy đủ sử dụng ${selectedModel}, độ phức tạp: ${complexity.level}`);

      // Use existing createAnalysisPrompt but optimized
      const prompt = this.createAnalysisPrompt(word, context);
      const estimatedInputTokens = this.estimateTokens(prompt);

      const startTime = Date.now();
      const response = await this.retryWithBackoff(async () => {
        return await openai.chat.completions.create({
          model: selectedModel,
          messages: [
            {
              role: "system",
              content: "Bạn là chuyên gia phân tích từ vựng tiếng Trung. Trả về JSON chính xác theo yêu cầu."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: selectedModel === 'gpt-3.5-turbo' ? 800 : 1000 // Adjust based on model
        });
      }, 3, 1000, 30000); // 3 retries, 1s base delay, 30s timeout

      const analysisTime = Date.now() - startTime;

      // Parse and validate
      let aiData;
      try {
        const responseContent = response.choices[0].message.content.trim();
        const jsonContent = responseContent.replace(/```json\n?|\n?```/g, '');
        aiData = JSON.parse(jsonContent);
      } catch (parseError) {
        console.error(`❌ [${analysisId}] Lỗi parse JSON:`, parseError);
        throw new Error('AI response không đúng định dạng JSON');
      }

      if (!aiData.word || !aiData.pinyin || !aiData.meaning?.primary) {
        throw new Error('AI response thiếu thông tin bắt buộc');
      }

      // Calculate cost
      const actualTokenUsage = response.usage || {
        prompt_tokens: estimatedInputTokens,
        completion_tokens: this.estimateTokens(response.choices[0].message.content),
        total_tokens: 0
      };
      actualTokenUsage.total_tokens = actualTokenUsage.prompt_tokens + actualTokenUsage.completion_tokens;

      const cost = this.calculateTokenCost(
        actualTokenUsage.prompt_tokens,
        actualTokenUsage.completion_tokens,
        selectedModel
      );

      // Save result
      const wordDetail = new WordDetail({
        word: word.trim(),
        pinyin: aiData.pinyin,
        vietnameseReading: aiData.vietnameseReading,
        meaning: aiData.meaning,
        grammar: aiData.grammar || {},
        examples: aiData.examples || [],
        related: aiData.related || {},
        source: 'ai_generated',
        aiAnalysis: {
          model: selectedModel,
          tokensUsed: actualTokenUsage.total_tokens,
          confidence: 0.95,
          analyzedAt: new Date(),
          prompt: prompt
        }
      });

      await wordDetail.save();

      console.log(`✅ [${analysisId}] Hoàn thành phân tích AI đầy đủ cho từ "${word}" sử dụng ${selectedModel}, đã lưu vào DB`);
      console.log(`💰 [${analysisId}] Chi phí: $${cost.costUSD.toFixed(4)} (${cost.costVND.toFixed(0)} VND)`);

      return {
        success: true,
        data: this.sanitizeWordData(wordDetail),
        fromCache: false,
        method: `full_ai_${selectedModel}`,
        cost: cost,
        analysisTime: analysisTime,
        analysisId: analysisId
      };
    } catch (error) {
      console.error(`❌ [${analysisId}] Lỗi trong fullAIAnalysis cho từ "${word}":`, error);
      throw error;
    }
  }

  /**
   * Merge dictionary and AI data intelligently
   */
  static mergeDataSources(dictionaryData, aiData) {
    return {
      ...dictionaryData,
      // AI data overrides/enhances dictionary data
      examples: aiData.examples || dictionaryData.examples || [],
      related: {
        ...dictionaryData.related,
        ...(aiData.related || {})
      },
      // Keep dictionary data for core fields unless AI provides better info
      pinyin: dictionaryData.pinyin || aiData.pinyin,
      vietnameseReading: dictionaryData.vietnameseReading || aiData.vietnameseReading,
      meaning: {
        ...dictionaryData.meaning,
        ...(aiData.meaning || {})
      },
      grammar: {
        ...dictionaryData.grammar,
        ...(aiData.grammar || {})
      }
    };
  }

  /**
   * Tạo prompt để phân tích từ vựng (updated version)
   */
  static createAnalysisPrompt(word, context = '') {
    const prompt = `Hãy phân tích từ tiếng Trung "${word}" và trả về thông tin JSON theo định dạng sau:

{
  "word": "${word}",
  "pinyin": "phiên âm chính xác",
  "vietnameseReading": "cách đọc Hán Việt (nếu có)",
  "meaning": {
    "primary": "nghĩa chính bằng tiếng Việt",
    "secondary": ["nghĩa phụ 1", "nghĩa phụ 2"],
    "partOfSpeech": "noun|verb|adjective|adverb|measure|pronoun|conjunction|preposition|interjection|other"
  },
  "grammar": {
    "level": "HSK1|HSK2|HSK3|HSK4|HSK5|HSK6|Advanced",
    "frequency": "số từ 1-100 thể hiện tần suất sử dụng",
    "formality": "formal|informal|neutral|literary"
  },
  "examples": [
    {
      "chinese": "câu ví dụ tiếng Trung",
      "pinyin": "phiên âm của câu ví dụ",
      "vietnamese": "dịch tiếng Việt",
      "difficulty": "1-5",
      "context": "formal|informal|neutral"
    }
  ],
  "related": {
    "synonyms": ["từ đồng nghĩa 1", "từ đồng nghĩa 2", "từ đồng nghĩa 3", "từ đồng nghĩa 4", v.v],
    "antonyms": ["từ trái nghĩa 1", "từ trái nghĩa 2", "từ trái nghĩa 3", "từ trái nghĩa 4", v.v],
    "compounds": ["từ ghép chứa từ này 1", "từ ghép chứa từ này 2", "từ ghép chứa từ này 3", "từ ghép chứa từ này 4", v.v]
  }
}

${context ? `Ngữ cảnh sử dụng: ${context}` : ''}

Yêu cầu:
1. Phiên âm phải chính xác theo tiêu chuẩn Pinyin
2. Nghĩa tiếng Việt phải tự nhiên và dễ hiểu
3. Ít nhất 2-3 ví dụ thực tế
4. Từ đồng nghĩa/trái nghĩa nếu có
5. Đánh giá chính xác level HSK

Chỉ trả về JSON, không thêm giải thích gì khác.`;

    return prompt;
  }

  /**
   * Updated method: Phân tích từ vựng bằng Hybrid approach
   * Main entry point - replaces old analyzeWord
   */
  static async analyzeWord(word, context = '', forceRefresh = false) {
    return await this.hybridAnalyzeWord(word, context, forceRefresh);
  }

  /**
   * Improved batch analysis with intelligent grouping
   */
  static async batchAnalyzeWords(words, context = '') {
    console.log(`🔄 [BATCH-ANALYSIS] Processing ${words.length} words with hybrid approach...`);

    const results = [];
    let totalCost = { totalTokens: 0, costUSD: 0, costVND: 0 };
    const methodStats = {};

    // Step 1: Check DB for all words at once
    const dbWords = await WordDetail.find({ word: { $in: words } }).lean();
    const dbWordMap = {};
    dbWords.forEach(word => {
      dbWordMap[word.word] = word;
    });

    const foundWords = Object.keys(dbWordMap);
    const missingWords = words.filter(word => !dbWordMap[word]);

    console.log(`📋 [BATCH-ANALYSIS] DB lookup: ${foundWords.length} hits, ${missingWords.length} misses`);

    // Add DB hits to results
    foundWords.forEach(word => {
      results.push({
        success: true,
        data: this.sanitizeWordData(dbWordMap[word]),
        fromCache: true,
        method: 'database',
        cost: { totalTokens: 0, costUSD: 0, costVND: 0 }
      });
      methodStats['database'] = (methodStats['database'] || 0) + 1;
    });

    // Step 2: Process missing words
    if (missingWords.length === 0) {
      console.log(`✅ [BATCH-ANALYSIS] All words found in DB!`);
      return {
        results: results,
        summary: {
          total: words.length,
          success: results.length,
          errors: 0,
          fromCache: results.length,
          methodBreakdown: methodStats,
          totalCost: totalCost,
          avgCostPerWord: 0
        }
      };
    }

    // Group missing words by complexity for batch optimization
    const wordGroups = this.groupWordsByComplexity(missingWords);
    console.log(`📊 [BATCH-ANALYSIS] Missing word groups: simple(${wordGroups.simple.length}), medium(${wordGroups.medium.length}), complex(${wordGroups.complex.length})`);

    // Process each group
    for (const [complexityLevel, groupWords] of Object.entries(wordGroups)) {
      if (groupWords.length === 0) continue;

      console.log(`🔄 [BATCH-ANALYSIS] Processing ${groupWords.length} ${complexityLevel} words...`);

      for (const word of groupWords) {
        const result = await this.hybridAnalyzeWord(word, context);
        results.push(result);

        // Track statistics
        const method = result.method || 'unknown';
        methodStats[method] = (methodStats[method] || 0) + 1;

        if (result.success && result.cost) {
          totalCost.totalTokens += result.cost.totalTokens || 0;
          totalCost.costUSD += result.cost.costUSD || 0;
          totalCost.costVND += result.cost.costVND || 0;
        }

        // Small delay for rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    const fromCacheCount = results.filter(r => r.fromCache).length;

    console.log(`✅ [BATCH-ANALYSIS] Completed: ${successCount} success, ${errorCount} errors`);
    console.log(`📈 [BATCH-ANALYSIS] Methods used:`, methodStats);
    console.log(`💰 [BATCH-ANALYSIS] Total cost: $${totalCost.costUSD.toFixed(4)} (${totalCost.costVND.toFixed(0)} VND)`);

    return {
      results: results,
      summary: {
        total: words.length,
        success: successCount,
        errors: errorCount,
        fromCache: fromCacheCount,
        methodBreakdown: methodStats,
        totalCost: totalCost,
        avgCostPerWord: words.length > 0 ? (totalCost.costUSD / words.length).toFixed(6) : 0
      }
    };
  }

  /**
   * Group words by complexity for better batch processing
   */
  static groupWordsByComplexity(words) {
    const groups = { simple: [], medium: [], complex: [] };

    words.forEach(word => {
      const complexity = this.assessWordComplexity(word, '');
      groups[complexity.level].push(word);
    });

    return groups;
  }

  /**
   * Updated getWordDetail method - Đơn giản hóa, lấy từ DB
   */
  static async getWordDetail(word, context = '') {
    try {
      console.log(`📚 [GET-WORD] Lấy chi tiết từ: "${word}"`);

      // Validate input
      const cleanWord = this.validateInput(word, context);

      // Tìm trong DB trước
      let wordDetail = await WordDetail.findOne({ word: cleanWord }).lean();

      if (wordDetail) {
        console.log(`✅ [GET-WORD] Tìm thấy từ trong DB: "${cleanWord}"`);
        const response = {
          success: true,
          data: this.sanitizeWordData(wordDetail),
          fromCache: true,
          method: 'database',
          cost: { totalTokens: 0, costUSD: 0, costVND: 0 }
        };

        console.log(`📤 [GET-WORD] Response structure:`, {
          success: response.success,
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : null,
          fromCache: response.fromCache,
          method: response.method,
          cost: response.cost
        });

        return response;
      }

      // Nếu không có trong DB, phân tích bằng AI
      console.log(`🤖 [GET-WORD] Không tìm thấy trong DB, phân tích AI: "${cleanWord}"`);
      const result = await this.hybridAnalyzeWord(cleanWord, context);

      if (result.success && result.data) {
        const response = {
          ...result,
          data: this.sanitizeWordData(result.data)
        };

        console.log(`📤 [GET-WORD] AI Response structure:`, {
          success: response.success,
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : null,
          fromCache: response.fromCache,
          method: response.method,
          cost: response.cost,
          analysisTime: response.analysisTime
        });

        return response;
      }

      return result;
    } catch (error) {
      console.error(`❌ [GET-WORD] Lỗi khi lấy chi tiết từ:`, error);
      return {
        success: false,
        error: error.message,
        word: word,
        method: 'error'
      };
    }
  }

  /**
   * Sanitize word data để đồng nhất format cho frontend
   */
  static sanitizeWordData(wordData) {
    // Nếu là Mongoose document, chuyển thành plain object
    if (wordData && typeof wordData.toObject === 'function') {
      wordData = wordData.toObject();
    }

    // Nếu có _doc field (Mongoose internal), lấy dữ liệu từ đó
    if (wordData && wordData._doc) {
      wordData = wordData._doc;
    }

    // Mapping partOfSpeech về đúng enum frontend
    const mapPartOfSpeech = (pos) => {
      const validPos = ['noun', 'verb', 'adjective', 'adverb', 'measure', 'pronoun', 'conjunction', 'preposition', 'interjection', 'other'];
      if (validPos.includes(pos)) {
        return pos;
      }
      // Mapping các giá trị lạ về 'other'
      const mapping = {
        'particle': 'other',
        'auxiliary': 'other',
        'modal': 'other',
        'numeral': 'other',
        'classifier': 'measure'
      };
      return mapping[pos] || 'other';
    };

    // Đảm bảo các field bắt buộc có mặt với giá trị mặc định
    const sanitized = {
      _id: wordData._id || wordData.id || `${wordData.word || 'unknown'}_${Date.now()}`,
      word: wordData.word || '',
      pinyin: wordData.pinyin || '',
      vietnameseReading: wordData.vietnameseReading || '',
      meaning: {
        primary: wordData.meaning?.primary || '',
        secondary: wordData.meaning?.secondary || [],
        partOfSpeech: mapPartOfSpeech(wordData.meaning?.partOfSpeech || 'other')
      },
      grammar: {
        level: wordData.grammar?.level || 'HSK1',
        frequency: wordData.grammar?.frequency || 50,
        formality: wordData.grammar?.formality || 'neutral'
      },
      examples: wordData.examples || [],
      related: {
        synonyms: wordData.related?.synonyms || [],
        antonyms: wordData.related?.antonyms || [],
        compounds: wordData.related?.compounds || []
      },
      isVerified: wordData.isVerified || false,
      source: wordData.source || 'unknown',
      createdAt: wordData.createdAt || new Date(),
      updatedAt: wordData.updatedAt || new Date()
    };

    return sanitized;
  }

  /**
   * Lấy thống kê sử dụng token (updated with method breakdown)
   */
  static async getTokenStats(dateRange = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - dateRange);

      const stats = await WordDetail.aggregate([
        {
          $match: {
            'aiAnalysis.analyzedAt': { $gte: cutoffDate }
          }
        },
        {
          $group: {
            _id: '$source',
            totalWords: { $sum: 1 },
            totalTokens: { $sum: '$aiAnalysis.tokensUsed' },
            avgTokensPerWord: { $avg: '$aiAnalysis.tokensUsed' },
            maxTokens: { $max: '$aiAnalysis.tokensUsed' },
            minTokens: { $min: '$aiAnalysis.tokensUsed' }
          }
        }
      ]);

      // Calculate method distribution
      const methodBreakdown = {};
      let totalWords = 0;
      let totalTokens = 0;

      stats.forEach(stat => {
        methodBreakdown[stat._id] = stat;
        totalWords += stat.totalWords;
        totalTokens += stat.totalTokens;
      });

      // Calculate cost savings
      const estimatedFullAICost = this.calculateTokenCost(totalTokens * 1.5, totalTokens * 0.5, 'gpt-4');
      const actualCost = this.calculateTokenCost(totalTokens * 0.6, totalTokens * 0.4, 'gpt-3.5-turbo');

      return {
        dateRange,
        totalWords,
        totalTokens,
        methodBreakdown,
        costAnalysis: {
          actual: actualCost,
          wouldBeFullAI: estimatedFullAICost,
          savings: {
            costUSD: estimatedFullAICost.costUSD - actualCost.costUSD,
            costVND: estimatedFullAICost.costVND - actualCost.costVND,
            percentage: ((estimatedFullAICost.costUSD - actualCost.costUSD) / estimatedFullAICost.costUSD * 100).toFixed(1)
          }
        },
        dictionaryStats: dictionaryService.getStatistics()
      };

    } catch (error) {
      console.error('Error getting token stats:', error);
      return null;
    }
  }
}

module.exports = WordAnalysisService; 