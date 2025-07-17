const mongoose = require('mongoose');

const PronunciationSchema = new mongoose.Schema({
  text: String,
  audioFile: String,
  analysis: {
    accuracy: Number,
    words: [{
      word: String,
      score: Number,
      issues: [String]
    }]
  },
  userId: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pronunciation', PronunciationSchema); 