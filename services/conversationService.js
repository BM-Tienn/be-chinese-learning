const Conversation = require('../models/Conversation');
const AIService = require('./aiService');

class ConversationService {
  // Tạo cuộc hội thoại mới
  static async createConversation(topic, level = 'beginner', context = '', userId = 'default') {
    try {
      console.log(`🎭 Tạo cuộc hội thoại: ${topic} (${level})`);
      
      // Tạo session ID
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Sử dụng AI để tạo cuộc hội thoại
      const conversationData = await AIService.generateConversation(topic, level, context);
      
      // Debug: Log the structure of conversationData
      console.log('🔍 Conversation data structure:', {
        hasPracticeQuestions: !!conversationData.practice_questions,
        practiceQuestionsType: typeof conversationData.practice_questions,
        practiceQuestionsLength: conversationData.practice_questions ? conversationData.practice_questions.length : 'N/A'
      });
      
      // Log the full conversationData for debugging
      console.log('📋 Full conversationData:', JSON.stringify(conversationData, null, 2));
      
      // Validate and fix practice_questions if needed
      if (conversationData.practice_questions) {
        if (typeof conversationData.practice_questions === 'string') {
          try {
            console.log('⚠️ practice_questions is a string, attempting to parse...');
            console.log('Raw practice_questions string:', conversationData.practice_questions);
            conversationData.practice_questions = JSON.parse(conversationData.practice_questions);
            console.log('✅ Successfully parsed practice_questions from string');
          } catch (parseError) {
            console.error('❌ Failed to parse practice_questions string:', parseError);
            conversationData.practice_questions = [];
          }
        }
        
        // Ensure it's an array
        if (!Array.isArray(conversationData.practice_questions)) {
          console.warn('⚠️ practice_questions is not an array, converting to empty array');
          console.log('Current practice_questions value:', conversationData.practice_questions);
          conversationData.practice_questions = [];
        }
      } else {
        console.log('ℹ️ No practice_questions found, setting to empty array');
        conversationData.practice_questions = [];
      }
      
      // Lưu vào database
      const conversation = new Conversation({
        conversationType: 'conversation',
        conversationData,
        userId,
        sessionId,
        query: `Tạo cuộc hội thoại về: ${topic}`,
        response: JSON.stringify(conversationData)
      });
      
      await conversation.save();
      
      console.log(`✅ Cuộc hội thoại đã được tạo: ${conversation._id}`);
      
      return {
        success: true,
        conversationId: conversation._id,
        sessionId,
        data: conversationData
      };
    } catch (error) {
      console.error('❌ Lỗi tạo cuộc hội thoại:', error);
      throw new Error('Không thể tạo cuộc hội thoại');
    }
  }

  // Tạo đoạn văn học tập
  static async createLearningText(topic, level = 'beginner', length = 'short', userId = 'default') {
    try {
      console.log(`📚 Tạo đoạn văn học tập: ${topic} (${level}, ${length})`);
      
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Sử dụng AI để tạo đoạn văn
      const learningTextData = await AIService.generateLearningText(topic, level, length);
      
      // Lưu vào database
      const conversation = new Conversation({
        conversationType: 'learning_text',
        learningTextData,
        userId,
        sessionId,
        query: `Tạo đoạn văn học tập về: ${topic}`,
        response: JSON.stringify(learningTextData)
      });
      
      await conversation.save();
      
      console.log(`✅ Đoạn văn học tập đã được tạo: ${conversation._id}`);
      
      return {
        success: true,
        conversationId: conversation._id,
        sessionId,
        data: learningTextData
      };
    } catch (error) {
      console.error('❌ Lỗi tạo đoạn văn học tập:', error);
      throw new Error('Không thể tạo đoạn văn học tập');
    }
  }

  // Tạo bài tập thực hành
  static async createPracticeExercise(topic, level = 'beginner', exerciseType = 'mixed', userId = 'default') {
    try {
      console.log(`🏋️ Tạo bài tập thực hành: ${topic} (${level}, ${exerciseType})`);
      
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Sử dụng AI để tạo bài tập
      const exerciseData = await AIService.generatePracticeExercise(topic, level, exerciseType);
      
      // Lưu vào database
      const conversation = new Conversation({
        conversationType: 'practice_exercise',
        exerciseData,
        userId,
        sessionId,
        query: `Tạo bài tập thực hành về: ${topic}`,
        response: JSON.stringify(exerciseData)
      });
      
      await conversation.save();
      
      console.log(`✅ Bài tập thực hành đã được tạo: ${conversation._id}`);
      
      return {
        success: true,
        conversationId: conversation._id,
        sessionId,
        data: exerciseData
      };
    } catch (error) {
      console.error('❌ Lỗi tạo bài tập thực hành:', error);
      throw new Error('Không thể tạo bài tập thực hành');
    }
  }

  // Tạo câu hỏi tương tác
  static async createInteractiveQuestions(context, level = 'beginner', userId = 'default') {
    try {
      console.log(`❓ Tạo câu hỏi tương tác: ${context} (${level})`);
      
      // Sử dụng AI để tạo câu hỏi
      const questionsData = await AIService.generateInteractiveQuestions(context, level);
      
      // Lưu vào database
      const conversation = new Conversation({
        conversationType: 'qa',
        userId,
        query: `Tạo câu hỏi tương tác cho: ${context}`,
        response: JSON.stringify(questionsData)
      });
      
      await conversation.save();
      
      console.log(`✅ Câu hỏi tương tác đã được tạo: ${conversation._id}`);
      
      return {
        success: true,
        conversationId: conversation._id,
        data: questionsData
      };
    } catch (error) {
      console.error('❌ Lỗi tạo câu hỏi tương tác:', error);
      throw new Error('Không thể tạo câu hỏi tương tác');
    }
  }

  // Phân tích câu trả lời của người dùng
  static async analyzeUserResponse(conversationId, userResponse, expectedResponse, context) {
    try {
      console.log(`🔍 Phân tích câu trả lời: ${userResponse}`);
      
      // Sử dụng AI để phân tích
      const analysis = await AIService.analyzeUserResponse(userResponse, expectedResponse, context);
      
      // Cập nhật conversation với lịch sử tương tác
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new Error('Không tìm thấy cuộc hội thoại');
      }
      
      // Thêm vào lịch sử tương tác
      conversation.interactionHistory.push({
        type: 'practice',
        content: expectedResponse,
        userResponse,
        aiFeedback: analysis
      });
      
      // Cập nhật thống kê học tập
      conversation.learningStats.totalInteractions += 1;
      conversation.learningStats.averageAccuracy = 
        (conversation.learningStats.averageAccuracy * (conversation.learningStats.totalInteractions - 1) + analysis.accuracy) / 
        conversation.learningStats.totalInteractions;
      
      // Thêm từ vựng mới vào danh sách đã học
      if (analysis.vocabulary_usage.new_vocabulary) {
        conversation.learningStats.vocabularyLearned.push(...analysis.vocabulary_usage.new_vocabulary);
      }
      
      conversation.learningStats.lastPracticeDate = new Date();
      
      await conversation.save();
      
      console.log(`✅ Phân tích hoàn thành với độ chính xác: ${analysis.accuracy}%`);
      
      return {
        success: true,
        analysis,
        updatedStats: conversation.learningStats
      };
    } catch (error) {
      console.error('❌ Lỗi phân tích câu trả lời:', error);
      throw new Error('Không thể phân tích câu trả lời');
    }
  }

  // Lấy lịch sử cuộc hội thoại
  static async getConversationHistory(userId = 'default', limit = 20) {
    try {
      const conversations = await Conversation.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('conversationType topic level createdAt learningStats');
      
      return {
        success: true,
        conversations
      };
    } catch (error) {
      console.error('❌ Lỗi lấy lịch sử cuộc hội thoại:', error);
      throw new Error('Không thể lấy lịch sử cuộc hội thoại');
    }
  }

  // Lấy chi tiết cuộc hội thoại
  static async getConversationDetail(conversationId) {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new Error('Không tìm thấy cuộc hội thoại');
      }
      
      return {
        success: true,
        conversation
      };
    } catch (error) {
      console.error('❌ Lỗi lấy chi tiết cuộc hội thoại:', error);
      throw new Error('Không thể lấy chi tiết cuộc hội thoại');
    }
  }

  // Lấy thống kê học tập
  static async getLearningStats(userId = 'default') {
    try {
      const stats = await Conversation.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalConversations: { $sum: 1 },
            totalInteractions: { $sum: '$learningStats.totalInteractions' },
            averageAccuracy: { $avg: '$learningStats.averageAccuracy' },
            totalPracticeTime: { $sum: '$learningStats.practiceTime' },
            uniqueVocabulary: { $addToSet: '$learningStats.vocabularyLearned' },
            uniqueGrammarPoints: { $addToSet: '$learningStats.grammarPointsCovered' }
          }
        }
      ]);
      
      if (stats.length === 0) {
        return {
          success: true,
          stats: {
            totalConversations: 0,
            totalInteractions: 0,
            averageAccuracy: 0,
            totalPracticeTime: 0,
            uniqueVocabulary: [],
            uniqueGrammarPoints: []
          }
        };
      }
      
      const result = stats[0];
      result.uniqueVocabulary = result.uniqueVocabulary.flat().filter((v, i, a) => a.indexOf(v) === i);
      result.uniqueGrammarPoints = result.uniqueGrammarPoints.flat().filter((v, i, a) => a.indexOf(v) === i);
      
      return {
        success: true,
        stats: result
      };
    } catch (error) {
      console.error('❌ Lỗi lấy thống kê học tập:', error);
      throw new Error('Không thể lấy thống kê học tập');
    }
  }

  // Tìm kiếm cuộc hội thoại theo chủ đề
  static async searchConversations(query, userId = 'default', limit = 10) {
    try {
      const conversations = await Conversation.find({
        userId,
        $or: [
          { 'conversationData.topic': { $regex: query, $options: 'i' } },
          { 'learningTextData.topic': { $regex: query, $options: 'i' } },
          { 'exerciseData.topic': { $regex: query, $options: 'i' } },
          { query: { $regex: query, $options: 'i' } }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('conversationType topic level createdAt');
      
      return {
        success: true,
        conversations
      };
    } catch (error) {
      console.error('❌ Lỗi tìm kiếm cuộc hội thoại:', error);
      throw new Error('Không thể tìm kiếm cuộc hội thoại');
    }
  }

  // Xóa cuộc hội thoại
  static async deleteConversation(conversationId, userId = 'default') {
    try {
      const conversation = await Conversation.findOneAndDelete({
        _id: conversationId,
        userId
      });
      
      if (!conversation) {
        throw new Error('Không tìm thấy cuộc hội thoại để xóa');
      }
      
      console.log(`🗑️ Đã xóa cuộc hội thoại: ${conversationId}`);
      
      return {
        success: true,
        message: 'Cuộc hội thoại đã được xóa'
      };
    } catch (error) {
      console.error('❌ Lỗi xóa cuộc hội thoại:', error);
      throw new Error('Không thể xóa cuộc hội thoại');
    }
  }
}

module.exports = ConversationService; 