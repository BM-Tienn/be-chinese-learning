const mongoose = require('mongoose');

// Schema for a user's custom vocabulary word
const wordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A word must belong to a user!']
  },
  chinese: {
    type: String,
    required: [true, 'A word must have Chinese characters!'],
    trim: true,
    minlength: [1, 'Chinese characters cannot be empty.']
  },
  pinyin: {
    type: String,
    required: [true, 'A word must have Pinyin!'],
    trim: true
  },
  definition: {
    type: String,
    required: [true, 'A word must have a definition!'],
    trim: true
  },
  hskLevel: {
    type: Number,
    min: 1,
    max: 6,
    default: null // Optional HSK level
  },
  tags: [String], // Array of tags for categorization
  notes: String, // Additional notes for the word
  // Add other fields as needed, e.g., example sentences, audio links
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient lookup by user and chinese characters
wordSchema.index({ user: 1, chinese: 1 }, { unique: true });

// Populate user details when querying words
wordSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'username email' // Select only necessary fields
  });
  next();
});

const Word = mongoose.model('Word', wordSchema);

module.exports = Word;
