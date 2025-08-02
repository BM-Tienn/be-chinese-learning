const Vocabulary = require('../models/Vocabulary');
const AppError = require('../utils/appError');
const ApiFeatures = require('../utils/apiFeatures');

class VocabularyService {
  // Get all vocabularies with filtering, sorting, and pagination
  async getAllVocabularies(queryString) {
    const features = new ApiFeatures(Vocabulary.find({ isActive: true }), queryString)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const vocabularies = await features.query;
    const total = await Vocabulary.countDocuments({ 
      isActive: true, 
      ...features.filterQuery 
    });

    return {
      data: vocabularies,
      pagination: {
        page: features.page,
        limit: features.limit,
        total,
        pages: Math.ceil(total / features.limit)
      }
    };
  }

  // Get vocabulary by ID
  async getVocabularyById(vocabularyId) {
    const vocabulary = await Vocabulary.findOne({ 
      _id: vocabularyId, 
      isActive: true 
    });

    if (!vocabulary) {
      throw new AppError('Không tìm thấy từ vựng', 404);
    }

    return vocabulary;
  }

  // Create new vocabulary
  async createVocabulary(vocabularyData) {
    const vocabulary = await Vocabulary.create(vocabularyData);
    return vocabulary;
  }

  // Update vocabulary
  async updateVocabulary(vocabularyId, updateData) {
    const vocabulary = await Vocabulary.findByIdAndUpdate(
      vocabularyId,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!vocabulary) {
      throw new AppError('Không tìm thấy từ vựng', 404);
    }

    return vocabulary;
  }

  // Delete vocabulary (soft delete)
  async deleteVocabulary(vocabularyId) {
    const vocabulary = await Vocabulary.findByIdAndUpdate(
      vocabularyId,
      { isActive: false },
      { new: true }
    );

    if (!vocabulary) {
      throw new AppError('Không tìm thấy từ vựng', 404);
    }

    return vocabulary;
  }

  // Search vocabularies
  async searchVocabularies(searchOptions) {
    const { query, level, category, difficulty, limit = 20 } = searchOptions;

    let searchQuery = {
      isActive: true
    };

    // Text search
    if (query) {
      searchQuery.$text = { $search: query };
    }

    // Filter by level
    if (level) {
      searchQuery.level = level;
    }

    // Filter by category
    if (category) {
      searchQuery.category = category;
    }

    // Filter by difficulty
    if (difficulty) {
      searchQuery.difficulty = difficulty;
    }

    const vocabularies = await Vocabulary.find(searchQuery, {
      score: { $meta: 'textScore' }
    })
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit);

    return vocabularies;
  }

  // Get vocabularies by level
  async getVocabulariesByLevel(level, queryString) {
    const features = new ApiFeatures(
      Vocabulary.find({ level, isActive: true }), 
      queryString
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const vocabularies = await features.query;
    const total = await Vocabulary.countDocuments({ 
      level, 
      isActive: true, 
      ...features.filterQuery 
    });

    return {
      data: vocabularies,
      pagination: {
        page: features.page,
        limit: features.limit,
        total,
        pages: Math.ceil(total / features.limit)
      }
    };
  }

  // Get vocabularies by category
  async getVocabulariesByCategory(category, queryString) {
    const features = new ApiFeatures(
      Vocabulary.find({ category, isActive: true }), 
      queryString
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const vocabularies = await features.query;
    const total = await Vocabulary.countDocuments({ 
      category, 
      isActive: true, 
      ...features.filterQuery 
    });

    return {
      data: vocabularies,
      pagination: {
        page: features.page,
        limit: features.limit,
        total,
        pages: Math.ceil(total / features.limit)
      }
    };
  }

  // Get vocabulary statistics
  async getVocabularyStats() {
    const stats = await Vocabulary.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byLevel: {
            $push: {
              level: '$level',
              count: 1
            }
          },
          byCategory: {
            $push: {
              category: '$category',
              count: 1
            }
          },
          byDifficulty: {
            $push: {
              difficulty: '$difficulty',
              count: 1
            }
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        total: 0,
        byLevel: [],
        byCategory: [],
        byDifficulty: []
      };
    }

    // Process the results
    const result = stats[0];
    
    // Group by level
    const levelStats = {};
    result.byLevel.forEach(item => {
      levelStats[item.level] = (levelStats[item.level] || 0) + 1;
    });

    // Group by category
    const categoryStats = {};
    result.byCategory.forEach(item => {
      categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;
    });

    // Group by difficulty
    const difficultyStats = {};
    result.byDifficulty.forEach(item => {
      difficultyStats[item.difficulty] = (difficultyStats[item.difficulty] || 0) + 1;
    });

    return {
      total: result.total,
      byLevel: Object.entries(levelStats).map(([level, count]) => ({ level, count })),
      byCategory: Object.entries(categoryStats).map(([category, count]) => ({ category, count })),
      byDifficulty: Object.entries(difficultyStats).map(([difficulty, count]) => ({ difficulty, count }))
    };
  }

  // Get random vocabularies for practice
  async getRandomVocabularies(level, category, limit = 10) {
    let query = { isActive: true };

    if (level) query.level = level;
    if (category) query.category = category;

    const vocabularies = await Vocabulary.aggregate([
      { $match: query },
      { $sample: { size: limit } }
    ]);

    return vocabularies;
  }

  // Get vocabularies by difficulty
  async getVocabulariesByDifficulty(difficulty, queryString) {
    const features = new ApiFeatures(
      Vocabulary.find({ difficulty, isActive: true }), 
      queryString
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const vocabularies = await features.query;
    const total = await Vocabulary.countDocuments({ 
      difficulty, 
      isActive: true, 
      ...features.filterQuery 
    });

    return {
      data: vocabularies,
      pagination: {
        page: features.page,
        limit: features.limit,
        total,
        pages: Math.ceil(total / features.limit)
      }
    };
  }

  // Get vocabularies by tags
  async getVocabulariesByTags(tags, queryString) {
    const features = new ApiFeatures(
      Vocabulary.find({ 
        tags: { $in: tags }, 
        isActive: true 
      }), 
      queryString
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const vocabularies = await features.query;
    const total = await Vocabulary.countDocuments({ 
      tags: { $in: tags }, 
      isActive: true, 
      ...features.filterQuery 
    });

    return {
      data: vocabularies,
      pagination: {
        page: features.page,
        limit: features.limit,
        total,
        pages: Math.ceil(total / features.limit)
      }
    };
  }

  // Update vocabulary usage statistics
  async updateVocabularyStats(vocabularyId, isCorrect, difficulty) {
    const vocabulary = await Vocabulary.findById(vocabularyId);

    if (!vocabulary) {
      throw new AppError('Không tìm thấy từ vựng', 404);
    }

    await vocabulary.updateUsageStats(isCorrect, difficulty);
    return vocabulary.statistics;
  }

  // Bulk create vocabularies
  async bulkCreateVocabularies(vocabulariesData) {
    const vocabularies = await Vocabulary.insertMany(vocabulariesData);
    return vocabularies;
  }

  // Get vocabulary suggestions based on user's learning history
  async getVocabularySuggestions(userId, limit = 10) {
    // This would typically involve analyzing user's learning patterns
    // For now, return random vocabularies
    return this.getRandomVocabularies(null, null, limit);
  }
}

module.exports = new VocabularyService(); 