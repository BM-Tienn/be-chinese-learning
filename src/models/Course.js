const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course must have a title!'],
    trim: true,
    maxlength: [100, 'Course title must have less or equal than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Course must have a description!'],
    trim: true
  },
  level: {
    type: String,
    enum: ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6', 'Common', 'Idiom', 'Proverb', 'Advanced', 'Other', 'Place Name', 'Person Name', 'Technical', 'Literary', 'Informal'],
    required: [true, 'Course must have a level!']
  },
  levelColor: {
    type: String,
    enum: ['red', 'orange', 'yellow', 'green', 'blue', 'purple'],
    default: 'red'
  },
  image: {
    type: String,
    default: null
  },
  duration: {
    type: String, // e.g., "8 tuần", "10 tuần"
    required: [true, 'Course must have duration!']
  },
  lessons: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Lesson'
  }],
  totalLessons: {
    type: Number,
    default: 0
  },
  students: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  isNewCourse: {
    type: Boolean,
    default: false
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  metadata: {
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner'
    },
    category: {
      type: String,
      enum: ['Grammar', 'Vocabulary', 'Listening', 'Reading', 'Writing', 'Speaking', 'Mixed'],
      default: 'Mixed'
    },
    tags: [String]
  }
}, {
  timestamps: true,
  suppressReservedKeysWarning: true
});

// Indexes
courseSchema.index({ level: 1, order: 1 });
courseSchema.index({ isActive: 1 });
courseSchema.index({ isPopular: 1 });
courseSchema.index({ rating: -1 });

// Virtual for average progress
courseSchema.virtual('averageProgress').get(function() {
  // This would be calculated from UserProgress
  return 0;
});

// Pre-save middleware to update totalLessons
courseSchema.pre('save', function(next) {
  if (this.lessons && this.lessons.length > 0) {
    this.totalLessons = this.lessons.length;
  }
  next();
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course; 