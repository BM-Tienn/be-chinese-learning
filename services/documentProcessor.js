const fs = require('fs').promises;
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const openai = require('../config/openai');
const WordAnalysisService = require('./wordAnalysisService');

class DocumentProcessor {
  static async extractText(filePath, mimeType) {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.txt':
        return await fs.readFile(filePath, 'utf8');
      case '.pdf':
        const pdfBuffer = await fs.readFile(filePath);
        const pdfData = await pdf(pdfBuffer);
        return pdfData.text;
      case '.docx':
        const docxBuffer = await fs.readFile(filePath);
        const result = await mammoth.extractRawText({ buffer: docxBuffer });
        return result.value;
      default:
        throw new Error('Unsupported file type');
    }
  }

  static async processWithAI(content) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: `You are a Chinese language processing expert. Extract meaningful Chinese text segments from the input and structure them for language learning. 

          For each segment, also break it down into individual words with their own pinyin and translation.

          Return a JSON array of segments, each with:
          - chinese: The Chinese text segment
          - pinyin: Pinyin pronunciation for the whole segment
          - translation: English translation for the segment
          - difficulty: 1-5 difficulty level
          - tags: Array of relevant tags (HSK level, topic, etc.)
          - words: Array of individual words in the segment, each with:
            - text: Individual Chinese word/character
            - pinyin: Pinyin for this word
            - translation: English meaning of this word
            - difficulty: 1-5 difficulty level for this word

          Focus on complete sentences or meaningful phrases. Ignore non-Chinese content.
          Example format:
          {
            "chinese": "你好世界",
            "pinyin": "nǐ hǎo shì jiè",
            "translation": "Hello world",
            "difficulty": 2,
            "tags": ["greeting", "HSK1"],
            "words": [
              {"text": "你", "pinyin": "nǐ", "translation": "you", "difficulty": 1},
              {"text": "好", "pinyin": "hǎo", "translation": "good", "difficulty": 1},
              {"text": "世界", "pinyin": "shì jiè", "translation": "world", "difficulty": 3}
            ]
          }`
        }, {
          role: "user",
          content: content
        }],
        temperature: 0.3
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('AI processing error:', error);
      // Fallback: basic segmentation
      return this.basicSegmentation(content);
    }
  }

  static basicSegmentation(content) {
    // Basic Chinese text detection and segmentation
    const sentences = content.split(/[。！？\n\r]/).filter(s => s.trim());
    
    return sentences.slice(0, 20).map((sentence, index) => {
      const cleanSentence = sentence.trim().replace(/[^\u4e00-\u9fff]/g, '');
      if (cleanSentence.length === 0) return null;
      
      // Basic word segmentation (split by characters for now)
      const words = cleanSentence.split('').map(char => ({
        text: char,
        pinyin: '', // Would need pinyin library
        translation: '',
        difficulty: Math.ceil(Math.random() * 3) + 1
      }));

      return {
        chinese: cleanSentence,
        pinyin: '', // Would need pinyin library
        translation: '',
        difficulty: Math.ceil(Math.random() * 3) + 1,
        tags: ['auto-generated'],
        words
      };
    }).filter(Boolean);
  }

  /**
   * Pre-analyze words trong document để cache thông tin chi tiết
   * Chạy async sau khi document đã được lưu để không làm chậm upload
   */
  static async preAnalyzeWords(segments, documentId) {
    try {
      console.log(`🔄 [PRE-ANALYSIS] Starting word pre-analysis for document ${documentId}`);
      
      // Collect tất cả unique words từ tất cả segments
      const allWords = new Set();
      
      segments.forEach(segment => {
        if (segment.words && Array.isArray(segment.words)) {
          segment.words.forEach(word => {
            if (word.text && word.text.trim().length > 0) {
              // Chỉ lấy từ tiếng Trung (skip các ký tự không phải Hán)
              const chineseText = word.text.trim().replace(/[^\u4e00-\u9fff]/g, '');
              if (chineseText.length > 0) {
                allWords.add(chineseText);
              }
            }
          });
        }
      });

      const uniqueWords = Array.from(allWords);
      console.log(`📊 [PRE-ANALYSIS] Found ${uniqueWords.length} unique words to analyze`);

      if (uniqueWords.length === 0) {
        console.log(`⚠️ [PRE-ANALYSIS] No Chinese words found to analyze`);
        return { success: true, wordsAnalyzed: 0, cost: { totalTokens: 0, costUSD: 0 } };
      }

      // Batch analyze với context từ document
      const documentContext = `Chinese learning document with ${segments.length} segments`;
      const result = await WordAnalysisService.batchAnalyzeWords(uniqueWords, documentContext);

      console.log(`✅ [PRE-ANALYSIS] Completed analysis for document ${documentId}`);
      console.log(`📈 [PRE-ANALYSIS] Summary:`, result.summary);

      return {
        success: true,
        wordsAnalyzed: result.summary.success,
        wordsFromCache: result.summary.fromCache,
        wordsWithErrors: result.summary.errors,
        cost: result.summary.totalCost
      };

    } catch (error) {
      console.error(`❌ [PRE-ANALYSIS] Error in pre-analysis for document ${documentId}:`, error);
      return {
        success: false,
        error: error.message,
        wordsAnalyzed: 0
      };
    }
  }

  /**
   * Process document với pre-analysis
   */
  static async processWithPreAnalysis(content, documentId = null) {
    try {
      console.log(`🔄 [PROCESS] Processing document with pre-analysis...`);
      
      // Gọi processWithAI như bình thường
      const segments = await this.processWithAI(content);
      
      // Nếu có documentId, chạy pre-analysis async (không block response)
      if (documentId && segments.length > 0) {
        // Chạy pre-analysis trong background
        setImmediate(async () => {
          const analysisResult = await this.preAnalyzeWords(segments, documentId);
          console.log(`🎯 [PROCESS] Pre-analysis completed for document ${documentId}:`, analysisResult);
        });
      }

      return segments;
      
    } catch (error) {
      console.error('❌ [PROCESS] Error in processWithPreAnalysis:', error);
      // Fallback về basic segmentation
      return this.basicSegmentation(content);
    }
  }
}

module.exports = DocumentProcessor; 