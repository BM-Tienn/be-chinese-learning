const Word = require('../models/Word');
const Vocabulary = require('../models/Vocabulary');
const User = require('../models/User');
const AppError = require('../utils/appError');
const ApiFeatures = require('../utils/apiFeatures');

class WordService {
  // Get user's words with filtering, sorting, and pagination
  async getUserWords(userId, queryString) {
    const features = new ApiFeatures(
      Word.find({ userId }).populate('vocabularyId'), 
      queryString
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const words = await features.query;
    const total = await Word.countDocuments({ 
      userId, 
      ...features.filterQuery 
    });

    return {
      data: words,
      pagination: {
        page: features.page,
        limit: features.limit,
        total,
        pages: Math.ceil(total / features.limit)
      }
    };
  }

  // Get word by ID
  async getWordById(wordId, userId) {
    const word = await Word.findOne({ 
      _id: wordId, 
      userId 
    }).populate('vocabularyId');

    if (!word) {
      throw new AppError('Không tìm thấy từ vựng', 404);
    }

    return word;
  }

  // Add word to user's vocabulary
  async addWordToUser(userId, vocabularyId, notes = null) {
    // Check if vocabulary exists
    const vocabulary = await Vocabulary.findById(vocabularyId);
    if (!vocabulary) {
      throw new AppError('Từ vựng không tồn tại', 404);
    }

    // Check if word already exists in user's vocabulary
    const existingWord = await Word.findOne({ 
      userId, 
      vocabularyId 
    });

    if (existingWord) {
      throw new AppError('Từ vựng đã có trong sổ tay của bạn', 400);
    }

    // Create new word entry
    const word = await Word.create({
      userId,
      vocabularyId,
      notes
    });

    // Update user statistics
    await this.updateUserWordStats(userId);

    return word.populate('vocabularyId');
  }

  // Update word
  async updateWord(wordId, userId, updateData) {
    const word = await Word.findOneAndUpdate(
      { _id: wordId, userId },
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('vocabularyId');

    if (!word) {
      throw new AppError('Không tìm thấy từ vựng', 404);
    }

    return word;
  }

  // Delete word from user's vocabulary
  async deleteWord(wordId, userId) {
    const word = await Word.findOneAndDelete({ 
      _id: wordId, 
      userId 
    });

    if (!word) {
      throw new AppError('Không tìm thấy từ vựng', 404);
    }

    // Update user statistics
    await this.updateUserWordStats(userId);

    return word;
  }

  // Get words by status
  async getWordsByStatus(userId, status, queryString) {
    const features = new ApiFeatures(
      Word.find({ userId, status }).populate('vocabularyId'), 
      queryString
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const words = await features.query;
    const total = await Word.countDocuments({ 
      userId, 
      status, 
      ...features.filterQuery 
    });

    return {
      data: words,
      pagination: {
        page: features.page,
        limit: features.limit,
        total,
        pages: Math.ceil(total / features.limit)
      }
    };
  }

  // Get words for practice
  async getWordsForPractice(userId, options = {}) {
    const { limit = 10, status } = options;

    let query = { userId };

    if (status) {
      query.status = status;
    }

    // Get words due for review first
    const dueWords = await Word.find({
      ...query,
      nextReview: { $lte: new Date() }
    })
    .populate('vocabularyId')
    .limit(limit);

    // If not enough due words, get random words
    if (dueWords.length < limit) {
      const remainingLimit = limit - dueWords.length;
      const randomWords = await Word.aggregate([
        { $match: query },
        { $sample: { size: remainingLimit } }
      ]);

      // Populate vocabulary data for random words
      const populatedRandomWords = await Word.populate(randomWords, {
        path: 'vocabularyId'
      });

      return [...dueWords, ...populatedRandomWords];
    }

    return dueWords;
  }

  // Update word progress
  async updateWordProgress(wordId, userId, isCorrect) {
    const word = await Word.findOne({ _id: wordId, userId });

    if (!word) {
      throw new AppError('Không tìm thấy từ vựng', 404);
    }

    // Add study session
    await word.addStudySession(isCorrect);

    // Update user statistics
    await this.updateUserWordStats(userId);

    return word.populate('vocabularyId');
  }

  // Get word statistics
  async getWordStats(userId) {
    const stats = await Word.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalWords: { $sum: 1 },
          newWords: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
          learningWords: { $sum: { $cond: [{ $eq: ['$status', 'learning'] }, 1, 0] } },
          masteredWords: { $sum: { $cond: [{ $eq: ['$status', 'mastered'] }, 1, 0] } },
          totalReviews: { $sum: '$reviewCount' },
          totalCorrect: { $sum: '$correctCount' },
          totalIncorrect: { $sum: '$incorrectCount' },
          averageDifficulty: { $avg: '$difficulty' },
          averageSuccessRate: {
            $avg: {
              $cond: [
                { $gt: [{ $add: ['$correctCount', '$incorrectCount'] }, 0] },
                { $divide: ['$correctCount', { $add: ['$correctCount', '$incorrectCount'] }] },
                0
              ]
            }
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        totalWords: 0,
        newWords: 0,
        learningWords: 0,
        masteredWords: 0,
        totalReviews: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        averageDifficulty: 0,
        averageSuccessRate: 0,
        successRate: 0
      };
    }

    const result = stats[0];
    const successRate = result.totalReviews > 0 
      ? (result.totalCorrect / result.totalReviews) * 100 
      : 0;

    return {
      ...result,
      successRate: Math.round(successRate * 100) / 100,
      averageSuccessRate: Math.round(result.averageSuccessRate * 100) / 100
    };
  }

  // Bulk add words to user's vocabulary
  async bulkAddWords(userId, vocabularyIds) {
    // Check if vocabularies exist
    const vocabularies = await Vocabulary.find({
      _id: { $in: vocabularyIds }
    });

    if (vocabularies.length !== vocabularyIds.length) {
      throw new AppError('Một số từ vựng không tồn tại', 400);
    }

    // Check for existing words
    const existingWords = await Word.find({
      userId,
      vocabularyId: { $in: vocabularyIds }
    });

    const existingVocabularyIds = existingWords.map(word => word.vocabularyId.toString());
    const newVocabularyIds = vocabularyIds.filter(id => !existingVocabularyIds.includes(id));

    if (newVocabularyIds.length === 0) {
      return {
        added: 0,
        skipped: existingWords.length,
        message: 'Tất cả từ vựng đã có trong sổ tay của bạn'
      };
    }

    // Create new words
    const wordsToCreate = newVocabularyIds.map(vocabularyId => ({
      userId,
      vocabularyId
    }));

    const createdWords = await Word.insertMany(wordsToCreate);

    // Update user statistics
    await this.updateUserWordStats(userId);

    return {
      added: createdWords.length,
      skipped: existingWords.length,
      message: `Đã thêm ${createdWords.length} từ vựng mới`
    };
  }

  // Export user's vocabulary
  async exportUserWords(userId, format = 'json') {
    const words = await Word.find({ userId })
      .populate('vocabularyId')
      .sort({ createdAt: -1 });

    if (format === 'json') {
      return {
        format: 'json',
        data: words,
        count: words.length,
        exportedAt: new Date()
      };
    } else if (format === 'csv') {
      // Convert to CSV format
      const csvData = words.map(word => ({
        word: word.vocabularyId.word,
        pinyin: word.vocabularyId.pinyin,
        meaning: word.vocabularyId.meaning,
        status: word.status,
        notes: word.notes || '',
        reviewCount: word.reviewCount,
        successRate: word.getSuccessRate(),
        lastReviewed: word.lastReviewed || '',
        nextReview: word.nextReview || ''
      }));

      return {
        format: 'csv',
        data: csvData,
        count: words.length,
        exportedAt: new Date()
      };
    }

    throw new AppError('Định dạng xuất không được hỗ trợ', 400);
  }

  // Update user word statistics
  async updateUserWordStats(userId) {
    const stats = await this.getWordStats(userId);
    
    await User.findByIdAndUpdate(userId, {
      'statistics.totalWords': stats.totalWords,
      'statistics.masteredWords': stats.masteredWords,
      'statistics.learningWords': stats.learningWords
    });
  }

  // Get words due for review
  async getWordsDueForReview(userId, limit = 20) {
    const words = await Word.find({
      userId,
      nextReview: { $lte: new Date() }
    })
    .populate('vocabularyId')
    .limit(limit)
    .sort({ nextReview: 1 });

    return words;
  }

  // Get favorite words
  async getFavoriteWords(userId, queryString) {
    const features = new ApiFeatures(
      Word.find({ userId, isFavorite: true }).populate('vocabularyId'), 
      queryString
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const words = await features.query;
    const total = await Word.countDocuments({ 
      userId, 
      isFavorite: true, 
      ...features.filterQuery 
    });

    return {
      data: words,
      pagination: {
        page: features.page,
        limit: features.limit,
        total,
        pages: Math.ceil(total / features.limit)
      }
    };
  }

  // Toggle favorite status
  async toggleFavorite(wordId, userId) {
    const word = await Word.findOne({ _id: wordId, userId });

    if (!word) {
      throw new AppError('Không tìm thấy từ vựng', 404);
    }

    word.isFavorite = !word.isFavorite;
    await word.save();

    return word.populate('vocabularyId');
  }

  // Get study history
  async getStudyHistory(userId, queryString) {
    const features = new ApiFeatures(
      Word.find({ userId })
        .populate('vocabularyId')
        .sort({ 'studyHistory.date': -1 }), 
      queryString
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const words = await features.query;
    const total = await Word.countDocuments({ 
      userId, 
      ...features.filterQuery 
    });

    return {
      data: words,
      pagination: {
        page: features.page,
        limit: features.limit,
        total,
        pages: Math.ceil(total / features.limit)
      }
    };
  }
}

module.exports = new WordService(); 