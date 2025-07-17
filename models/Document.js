const mongoose = require('mongoose');

const WordSchema = new mongoose.Schema({
  text: String,
  pinyin: String,
  translation: String,
  difficulty: Number
}, { _id: false });

const SegmentSchema = new mongoose.Schema({
  chinese: String,
  pinyin: String,
  translation: String,
  difficulty: Number,
  tags: [String],
  words: [WordSchema] // Individual words in the segment
});

const DocumentSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  content: String,
  processedAt: { type: Date, default: Date.now },
  segments: [SegmentSchema]
});

module.exports = mongoose.model('Document', DocumentSchema); 