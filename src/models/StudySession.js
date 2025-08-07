const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Study session must belong to a user!']
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course'
  },
  lesson: {
    type: mongoose.Schema.ObjectId,
    ref: 'Lesson'
  },
  flashcardSet: {
    type: mongoose.Schema.ObjectId,
    ref: 'FlashcardSet'
  },
  type: {
    type: String,
    enum: ['lesson', 'flashcard', 'quiz', 'writing', 'listening', 'mixed'],
    required: [true, 'Study session must have a type!']
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  vocabularyStudied: [{
    vocabulary: {
      type: mongoose.Schema.ObjectId,
      ref: 'Vocabulary'
    },
    mastery: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    attempts: {
      type: Number,
      default: 0
    },
    correctAnswers: {
      type: Number,
      default: 0
    }
  }],
  metadata: {
    device: {
      type: String,
      default: 'web'
    },
    location: {
      type: String,
      default: null
    },
    notes: {
      type: String,
      default: null
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium'
    }
  }
}, {
  timestamps: true
});

// Indexes
studySessionSchema.index({ user: 1, startTime: -1 });
studySessionSchema.index({ user: 1, type: 1 });
studySessionSchema.index({ user: 1, isCompleted: 1 });
studySessionSchema.index({ user: 1, course: 1 });
studySessionSchema.index({ user: 1, lesson: 1 });
studySessionSchema.index({ user: 1, flashcardSet: 1 });

// Pre-find middleware to populate references
studySessionSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'course',
    select: 'title level'
  }).populate({
    path: 'lesson',
    select: 'title order'
  }).populate({
    path: 'flashcardSet',
    select: 'title category'
  }).populate({
    path: 'vocabularyStudied.vocabulary',
    select: 'chinese pinyin meaning'
  });
  next();
});

// Virtual for session duration in minutes
studySessionSchema.virtual('durationMinutes').get(function() {
  if (this.endTime && this.startTime) {
    return Math.round((this.endTime - this.startTime) / (1000 * 60));
  }
  return this.duration;
});

const StudySession = mongoose.model('StudySession', studySessionSchema);

module.exports = StudySession; 