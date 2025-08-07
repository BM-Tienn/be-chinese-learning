const mongoose = require('mongoose');

const flashcardSetSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Flashcard set must have a title!'],
    trim: true,
    maxlength: [100, 'Flashcard set title must have less or equal than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Flashcard set must have a description!'],
    trim: true
  },
  category: {
    type: String,
    enum: ['greetings', 'food', 'family', 'numbers', 'colors', 'animals', 'weather', 'travel', 'business', 'other'],
    required: [true, 'Flashcard set must have a category!']
  },
  type: {
    type: String,
    enum: ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection', 'mixed'],
    default: 'mixed'
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  color: {
    type: String,
    enum: ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink'],
    default: 'red'
  },
  icon: {
    type: String,
    default: 'BookOpen' // Lucide icon name
  },
  cards: [{
    vocabulary: {
      type: mongoose.Schema.ObjectId,
      ref: 'Vocabulary',
      required: true
    },
    order: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  cardCount: {
    type: Number,
    default: 0
  },
  timeEstimate: {
    type: String, // e.g., "10 phút", "15 phút"
    default: "10 phút"
  },
  isNewSet: {
    type: Boolean,
    default: false
  },
  isRecommended: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  level: {
    type: String,
    enum: ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'],
    default: 'HSK1'
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course'
  },
  lesson: {
    type: mongoose.Schema.ObjectId,
    ref: 'Lesson'
  },
  metadata: {
    tags: [String],
    learningObjectives: [String],
    prerequisites: [{
      type: mongoose.Schema.ObjectId,
      ref: 'FlashcardSet'
    }]
  },
  statistics: {
    totalCards: {
      type: Number,
      default: 0
    },
    masteredCards: {
      type: Number,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    lastReviewed: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true,
  suppressReservedKeysWarning: true
});

// Indexes
flashcardSetSchema.index({ category: 1, type: 1 });
flashcardSetSchema.index({ difficulty: 1 });
flashcardSetSchema.index({ level: 1 });
flashcardSetSchema.index({ isActive: 1 });
flashcardSetSchema.index({ isRecommended: 1 });

// Pre-save middleware to update cardCount
flashcardSetSchema.pre('save', function(next) {
  if (this.cards && this.cards.length > 0) {
    this.cardCount = this.cards.filter(card => card.isActive).length;
  }
  next();
});

// Pre-find middleware to populate references
flashcardSetSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'cards.vocabulary',
    select: 'chinese pinyin meaning'
  }).populate({
    path: 'course',
    select: 'title level'
  }).populate({
    path: 'lesson',
    select: 'title level'
  });
  next();
});

const FlashcardSet = mongoose.model('FlashcardSet', flashcardSetSchema);

module.exports = FlashcardSet; 