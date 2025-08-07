const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Lesson must have a title!'],
    trim: true,
    maxlength: [100, 'Lesson title must have less or equal than 100 characters']
  },
  subtitle: {
    type: String,
    trim: true
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: [true, 'Lesson must belong to a course!']
  },
  level: {
    type: String,
    enum: ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'],
    required: [true, 'Lesson must have a level!']
  },
  order: {
    type: Number,
    required: [true, 'Lesson must have an order!']
  },
  image: {
    type: String,
    default: null
  },
  content: {
    type: String,
    required: [true, 'Lesson must have content!']
  },
  vocabulary: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Vocabulary'
  }],
  grammar: [{
    title: String,
    explanation: String,
    examples: [{
      chinese: String,
      pinyin: String,
      vietnamese: String
    }]
  }],
  exercises: [{
    type: {
      type: String,
      enum: ['multiple_choice', 'fill_blank', 'matching', 'listening', 'writing'],
      required: true
    },
    question: String,
    options: [String],
    correctAnswer: String,
    explanation: String,
    points: {
      type: Number,
      default: 1
    }
  }],
  estimatedTime: {
    type: Number, // in minutes
    default: 15
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
  metadata: {
    tags: [String],
    prerequisites: [{
      type: mongoose.Schema.ObjectId,
      ref: 'Lesson'
    }],
    learningObjectives: [String]
  }
}, {
  timestamps: true
});

// Indexes
lessonSchema.index({ level: 1 });
lessonSchema.index({ isActive: 1 });

// Compound unique index to prevent duplicate lessons in same course
lessonSchema.index({ course: 1, order: 1 }, { unique: true });

// Pre-find middleware to populate references
lessonSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'course',
    select: 'title level'
  }).populate({
    path: 'vocabulary',
    select: 'chinese pinyin meaning'
  });
  next();
});

const Lesson = mongoose.model('Lesson', lessonSchema);

module.exports = Lesson; 