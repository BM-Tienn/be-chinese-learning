const mongoose = require('mongoose');

// Schema cho cấu hình chung của ứng dụng
const configurationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Configuration must have a type!'],
    enum: ['filter', 'topic', 'wordType', 'level', 'category'],
    trim: true
  },
  key: {
    type: String,
    required: [true, 'Configuration must have a key!'],
    trim: true
  },
  label: {
    type: String,
    required: [true, 'Configuration must have a label!'],
    trim: true
  },
  count: {
    type: Number,
    default: 0,
    min: 0
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
    color: String,
    icon: String,
    description: String,
    parentKey: String, // Cho các cấu hình có quan hệ cha-con
    level: Number, // Cho HSK levels
    difficulty: String, // easy, medium, hard
    category: String // Cho các danh mục con
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index để đảm bảo unique combination của type và key
configurationSchema.index({ type: 1, key: 1 }, { unique: true });

// Index cho tìm kiếm hiệu quả
configurationSchema.index({ type: 1, isActive: 1 });
configurationSchema.index({ type: 1, order: 1 });

// Pre-save middleware để cập nhật updatedAt
configurationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method để lấy cấu hình theo type
configurationSchema.statics.getByType = function(type) {
  return this.find({ type, isActive: true }).sort({ order: 1, label: 1 });
};

// Static method để lấy tất cả cấu hình
configurationSchema.statics.getAllConfigurations = function() {
  return this.find({ isActive: true }).sort({ type: 1, order: 1, label: 1 });
};

// Instance method để update count
configurationSchema.methods.updateCount = function(newCount) {
  this.count = newCount;
  return this.save();
};

const Configuration = mongoose.model('Configuration', configurationSchema);

module.exports = Configuration; 