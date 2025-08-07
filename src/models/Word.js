const mongoose = require('mongoose');

// Schema for a user's custom vocabulary word
const wordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Bắt buộc phải có người dùng!']
  },
  chinese: {
    type: String,
    required: [true, 'Bắt buộc phải có ký tự tiếng Trung!'],
    trim: true,
    minlength: [1, 'Ký tự tiếng Trung không được để trống.']
  },
  pinyin: {
    type: String,
    required: [true, 'Bắt buộc phải có phiên âm!'],
    trim: true
  },
  vietnameseReading: {
    type: String,
    trim: true
  },
  meaning: {
    primary: {
      type: String,
      required: [true, 'Bắt buộc phải có nghĩa chính!'],
      trim: true
    },
    secondary: [String],
    partOfSpeech: {
      type: String,
      trim: true
    }
  },
  grammar: {
    level: {
      type: String,
      trim: true
    },
    frequency: {
      type: Number,
      min: 0
    },
    formality: {
      type: String,
      enum: ['formal', 'neutral', 'informal', 'literary'],
      default: 'neutral'
    }
  },
  examples: [{
    chinese: {
      type: String,
      required: true
    },
    pinyin: {
      type: String,
      required: true
    },
    vietnamese: {
      type: String,
      required: true
    },
    audio: String
  }],
  related: {
    synonyms: [String],
    antonyms: [String],
    compounds: [String]
  },
  hskLevel: {
    type: Number,
    min: 1,
    max: 6,
    default: null
  },
  category: {
    type: String,
    enum: ['Basic', 'Intermediate', 'Advanced', 'Business', 'Academic', 'Literary', 'Informal'],
    default: 'Basic'
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String],
  notes: String,
  metadata: {
    source: {
      type: String,
      trim: true
    }
  },
  statistics: {
    totalReviews: {
      type: Number,
      default: 0
    },
    masteryLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    lastReviewed: {
      type: Date,
      default: null
    },
    averageScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    nextReview: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

wordSchema.index({ user: 1, chinese: 1 }, { unique: true });

wordSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'username email'
  });
  next();
});

const Word = mongoose.model('Word', wordSchema);

module.exports = Word;
