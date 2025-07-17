const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  // Thông tin cơ bản
  query: String,
  response: String,
  documentId: mongoose.Schema.Types.ObjectId,
  
  // Thông tin mở rộng cho cuộc hội thoại
  conversationType: {
    type: String,
    enum: ['qa', 'conversation', 'learning_text', 'practice_exercise'],
    default: 'qa'
  },
  
  // Dữ liệu cuộc hội thoại
  conversationData: {
    title: String,
    topic: String,
    level: String,
    description: String,
    conversation: [{
      speaker: String,
      chinese: String,
      pinyin: String,
      translation: String,
      grammar_notes: String,
      vocabulary: [String]
    }],
    vocabulary_list: [{
      word: String,
      pinyin: String,
      translation: String,
      example: String
    }],
    grammar_points: [{
      point: String,
      explanation: String,
      examples: [String]
    }],
    practice_questions: [{
      question: String,
      type: String,
      options: [String],
      correct_answer: String,
      explanation: String
    }]
  },
  
  // Dữ liệu đoạn văn học tập
  learningTextData: {
    title: String,
    topic: String,
    level: String,
    text: {
      chinese: String,
      pinyin: String,
      translation: String
    },
    segments: [{
      chinese: String,
      pinyin: String,
      translation: String,
      difficulty: Number
    }],
    vocabulary: [{
      word: String,
      pinyin: String,
      translation: String,
      part_of_speech: String
    }],
    grammar_notes: [{
      pattern: String,
      explanation: String,
      examples: [String]
    }],
    comprehension_questions: [{
      question: String,
      type: String,
      options: [String],
      correct_answer: String,
      explanation: String
    }]
  },
  
  // Dữ liệu bài tập thực hành
  exerciseData: {
    title: String,
    topic: String,
    level: String,
    instructions: String,
    exercises: [{
      type: String,
      question: String,
      content: String,
      options: [String],
      correct_answer: String,
      explanation: String,
      difficulty: Number
    }],
    vocabulary_focus: [String],
    grammar_focus: [String],
    estimated_time: String,
    scoring: {
      total_points: Number,
      per_exercise: Number
    }
  },
  
  // Lịch sử tương tác
  interactionHistory: [{
    type: {
      type: String,
      enum: ['question', 'response', 'practice', 'feedback']
    },
    content: String,
    timestamp: { type: Date, default: Date.now },
    userResponse: String,
    aiFeedback: {
      accuracy: Number,
      feedback: {
        positive: [String],
        improvements: [String],
        suggestions: [String]
      },
      grammar_analysis: {
        correct_patterns: [String],
        errors: [String],
        corrections: [String]
      },
      pronunciation_notes: {
        tone_issues: [String],
        sound_issues: [String],
        recommendations: [String]
      },
      vocabulary_usage: {
        appropriate_words: [String],
        suggested_alternatives: [String],
        new_vocabulary: [String]
      },
      overall_assessment: String,
      next_steps: [String]
    }
  }],
  
  // Thống kê học tập
  learningStats: {
    totalInteractions: { type: Number, default: 0 },
    averageAccuracy: { type: Number, default: 0 },
    vocabularyLearned: [String],
    grammarPointsCovered: [String],
    practiceTime: { type: Number, default: 0 }, // phút
    lastPracticeDate: Date
  },
  
  // Metadata
  userId: String, // Để hỗ trợ đa người dùng trong tương lai
  sessionId: String, // Để nhóm các tương tác trong một phiên học
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware để cập nhật updatedAt
ConversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index để tối ưu truy vấn
ConversationSchema.index({ userId: 1, createdAt: -1 });
ConversationSchema.index({ conversationType: 1, topic: 1 });
ConversationSchema.index({ sessionId: 1 });

module.exports = mongoose.model('Conversation', ConversationSchema); 