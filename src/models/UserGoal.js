const mongoose = require('mongoose');

const userGoalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'User goal must belong to a user!']
  },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom'],
    required: [true, 'User goal must have a type!']
  },
  category: {
    type: String,
    enum: ['new_words', 'characters', 'listening', 'reading', 'writing', 'speaking', 'mixed'],
    required: [true, 'User goal must have a category!']
  },
  label: {
    type: String,
    required: [true, 'User goal must have a label!'],
    trim: true
  },
  current: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: [true, 'User goal must have a total target!'],
    min: 1
  },
  unit: {
    type: String,
    required: [true, 'User goal must have a unit!'],
    enum: ['từ', 'chữ', 'bài', 'phút', 'điểm'],
    default: 'từ'
  },
  color: {
    type: String,
    enum: ['blue', 'green', 'purple', 'red', 'orange', 'yellow'],
    default: 'blue'
  },
  icon: {
    type: String,
    default: 'BookOpen' // Lucide icon name
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'User goal must have an end date!']
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  metadata: {
    description: String,
    notes: String,
    reminders: [{
      time: Date,
      message: String,
      isSent: {
        type: Boolean,
        default: false
      }
    }]
  }
}, {
  timestamps: true
});

// Indexes
userGoalSchema.index({ user: 1, type: 1 });
userGoalSchema.index({ user: 1, category: 1 });
userGoalSchema.index({ user: 1, isActive: 1 });
userGoalSchema.index({ user: 1, endDate: 1 });

// Pre-save middleware to calculate progress
userGoalSchema.pre('save', function(next) {
  if (this.total > 0) {
    this.progress = Math.round((this.current / this.total) * 100);
    this.isCompleted = this.current >= this.total;
  }
  next();
});

// Pre-find middleware to populate references
userGoalSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'username email'
  });
  next();
});

const UserGoal = mongoose.model('UserGoal', userGoalSchema);

module.exports = UserGoal; 