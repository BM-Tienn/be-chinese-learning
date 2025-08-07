const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'User progress must belong to a user!']
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: [true, 'User progress must belong to a course!']
  },
  lesson: {
    type: mongoose.Schema.ObjectId,
    ref: 'Lesson'
  },
  flashcardSet: {
    type: mongoose.Schema.ObjectId,
    ref: 'FlashcardSet'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  timeSpent: {
    type: Number, // in minutes
    default: 0
  },
  completedAt: {
    type: Date,
    default: null
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  lastStudied: {
    type: Date,
    default: Date.now
  },
  studySessions: [{
    date: {
      type: Date,
      default: Date.now
    },
    duration: {
      type: Number, // in minutes
      default: 0
    },
    score: {
      type: Number,
      default: 0
    },
    progress: {
      type: Number,
      default: 0
    }
  }],
  metadata: {
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
    streak: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
userProgressSchema.index({ user: 1, course: 1 });
userProgressSchema.index({ user: 1, lesson: 1 });
userProgressSchema.index({ user: 1, flashcardSet: 1 });
userProgressSchema.index({ user: 1, isCompleted: 1 });
userProgressSchema.index({ user: 1, lastStudied: -1 });

// Compound unique index to prevent duplicate progress records
userProgressSchema.index(
  { user: 1, course: 1, lesson: 1 },
  { unique: true, sparse: true }
);

userProgressSchema.index(
  { user: 1, course: 1, flashcardSet: 1 },
  { unique: true, sparse: true }
);

// Pre-find middleware to populate references
userProgressSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'course',
    select: 'title level'
  }).populate({
    path: 'lesson',
    select: 'title order'
  }).populate({
    path: 'flashcardSet',
    select: 'title category'
  });
  next();
});

const UserProgress = mongoose.model('UserProgress', userProgressSchema);

module.exports = UserProgress; 