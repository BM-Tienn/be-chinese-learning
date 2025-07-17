const mongoose = require('mongoose');

// Schema cho ví dụ sử dụng từ
const ExampleSchema = new mongoose.Schema({
  chinese: { type: String, required: true }, // Câu ví dụ tiếng Trung
  pinyin: { type: String, required: true },  // Phiên âm của câu ví dụ  
  vietnamese: { type: String, required: true }, // Dịch tiếng Việt
  difficulty: { type: Number, default: 1, min: 1, max: 5 }, // Độ khó từ 1-5
  context: String // Ngữ cảnh sử dụng (formal, informal, literary, etc.)
}, { _id: false });

// Schema chính cho thông tin chi tiết từ vựng
const WordDetailSchema = new mongoose.Schema({
  // Từ gốc
  word: { 
    type: String, 
    required: true,
    index: true,
    trim: true
  },
  
  // Phiên âm
  pinyin: { 
    type: String, 
    required: true,
    trim: true
  },
  
  // Cách đọc tiếng Việt (âm Hán Việt)
  vietnameseReading: { 
    type: String,
    trim: true
  },
  
  // Nghĩa chính
  meaning: {
    primary: { type: String, required: true }, // Nghĩa chính
    secondary: [String], // Các nghĩa phụ
    partOfSpeech: { 
      type: String, 
      enum: ['noun', 'verb', 'adjective', 'adverb', 'measure', 'pronoun', 'conjunction', 'preposition', 'interjection', 'other'],
      default: 'other'
    }
  },
  
  // Thông tin ngữ pháp và sử dụng
  grammar: {
    level: { 
      type: String,
      enum: ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6', 'Advanced'],
      default: 'HSK1'
    },
    frequency: { type: Number, default: 0 }, // Tần suất sử dụng
    formality: {
      type: String,
      enum: ['formal', 'informal', 'neutral', 'literary'],
      default: 'neutral'
    }
  },
  
  // Ví dụ sử dụng
  examples: [ExampleSchema],
  
  // Từ liên quan
  related: {
    synonyms: [String], // Từ đồng nghĩa
    antonyms: [String], // Từ trái nghĩa
    compounds: [String] // Từ ghép chứa từ này
  },
  
  // Thông tin AI analysis
  aiAnalysis: {
    model: String, // Model AI đã phân tích (gpt-4, etc.)
    tokensUsed: { type: Number, default: 0 }, // Số token đã sử dụng
    confidence: { type: Number, default: 0.95, min: 0, max: 1 }, // Độ tin cậy
    analyzedAt: { type: Date, default: Date.now },
    prompt: String // Prompt đã sử dụng để phân tích
  },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false }, // Đã được xác minh bởi expert
  source: { 
    type: String, 
    enum: ['ai_generated', 'manual', 'dictionary_import'],
    default: 'ai_generated'
  }
});

// Indexes để tối ưu query
WordDetailSchema.index({ word: 1 });
WordDetailSchema.index({ 'grammar.level': 1 });
WordDetailSchema.index({ 'grammar.frequency': -1 });
WordDetailSchema.index({ createdAt: -1 });

// Virtual để tính tổng số ví dụ
WordDetailSchema.virtual('exampleCount').get(function() {
  return this.examples ? this.examples.length : 0;
});

// Middleware để update updatedAt
WordDetailSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method để tìm từ với cache
WordDetailSchema.statics.findWordWithCache = async function(word) {
  try {
    // Tìm từ trong database
    let wordDetail = await this.findOne({ word: word.trim() });
    
    if (!wordDetail) {
      console.log(`Word "${word}" not found in cache, will need AI analysis`);
      return null;
    }
    
    console.log(`Found cached word detail for "${word}"`);
    return wordDetail;
  } catch (error) {
    console.error('Error finding word in cache:', error);
    return null;
  }
};

// Instance method để cập nhật từ AI
WordDetailSchema.methods.updateFromAI = function(aiData, tokensUsed) {
  if (aiData.meaning) {
    this.meaning.primary = aiData.meaning.primary || this.meaning.primary;
    this.meaning.secondary = aiData.meaning.secondary || this.meaning.secondary;
    this.meaning.partOfSpeech = aiData.meaning.partOfSpeech || this.meaning.partOfSpeech;
  }
  
  if (aiData.pinyin) {
    this.pinyin = aiData.pinyin;
  }
  
  if (aiData.vietnameseReading) {
    this.vietnameseReading = aiData.vietnameseReading;
  }
  
  if (aiData.examples && Array.isArray(aiData.examples)) {
    this.examples = aiData.examples;
  }
  
  if (aiData.grammar) {
    this.grammar = { ...this.grammar.toObject(), ...aiData.grammar };
  }
  
  if (aiData.related) {
    this.related = { ...this.related.toObject(), ...aiData.related };
  }
  
  // Update AI analysis info
  this.aiAnalysis.tokensUsed += tokensUsed || 0;
  this.aiAnalysis.analyzedAt = new Date();
  this.updatedAt = new Date();
  
  return this;
};

module.exports = mongoose.model('WordDetail', WordDetailSchema); 