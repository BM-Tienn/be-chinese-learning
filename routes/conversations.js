const express = require('express');
const router = express.Router();
const ConversationService = require('../services/conversationService');

// Tạo cuộc hội thoại mới
router.post('/create-conversation', async (req, res) => {
  try {
    const { topic, level = 'beginner', context = '', userId = 'default' } = req.body;
    
    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'Chủ đề là bắt buộc'
      });
    }
    
    const result = await ConversationService.createConversation(topic, level, context, userId);
    res.json(result);
  } catch (error) {
    console.error('Lỗi tạo cuộc hội thoại:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Tạo đoạn văn học tập
router.post('/create-learning-text', async (req, res) => {
  try {
    const { topic, level = 'beginner', length = 'short', userId = 'default' } = req.body;
    
    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'Chủ đề là bắt buộc'
      });
    }
    
    const result = await ConversationService.createLearningText(topic, level, length, userId);
    res.json(result);
  } catch (error) {
    console.error('Lỗi tạo đoạn văn học tập:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Tạo bài tập thực hành
router.post('/create-practice-exercise', async (req, res) => {
  try {
    const { topic, level = 'beginner', exerciseType = 'mixed', userId = 'default' } = req.body;
    
    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'Chủ đề là bắt buộc'
      });
    }
    
    const result = await ConversationService.createPracticeExercise(topic, level, exerciseType, userId);
    res.json(result);
  } catch (error) {
    console.error('Lỗi tạo bài tập thực hành:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Tạo câu hỏi tương tác
router.post('/create-interactive-questions', async (req, res) => {
  try {
    const { context, level = 'beginner', userId = 'default' } = req.body;
    
    if (!context) {
      return res.status(400).json({
        success: false,
        error: 'Ngữ cảnh là bắt buộc'
      });
    }
    
    const result = await ConversationService.createInteractiveQuestions(context, level, userId);
    res.json(result);
  } catch (error) {
    console.error('Lỗi tạo câu hỏi tương tác:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Phân tích câu trả lời của người dùng
router.post('/analyze-response', async (req, res) => {
  try {
    const { conversationId, userResponse, expectedResponse, context } = req.body;
    
    if (!conversationId || !userResponse || !expectedResponse) {
      return res.status(400).json({
        success: false,
        error: 'conversationId, userResponse và expectedResponse là bắt buộc'
      });
    }
    
    const result = await ConversationService.analyzeUserResponse(
      conversationId, 
      userResponse, 
      expectedResponse, 
      context || ''
    );
    res.json(result);
  } catch (error) {
    console.error('Lỗi phân tích câu trả lời:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Lấy lịch sử cuộc hội thoại
router.get('/history', async (req, res) => {
  try {
    const { userId = 'default', limit = 20 } = req.query;
    
    const result = await ConversationService.getConversationHistory(userId, parseInt(limit));
    res.json(result);
  } catch (error) {
    console.error('Lỗi lấy lịch sử cuộc hội thoại:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Lấy chi tiết cuộc hội thoại
router.get('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const result = await ConversationService.getConversationDetail(conversationId);
    res.json(result);
  } catch (error) {
    console.error('Lỗi lấy chi tiết cuộc hội thoại:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Lấy thống kê học tập
router.get('/stats/learning', async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    
    const result = await ConversationService.getLearningStats(userId);
    res.json(result);
  } catch (error) {
    console.error('Lỗi lấy thống kê học tập:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Tìm kiếm cuộc hội thoại
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { userId = 'default', limit = 10 } = req.query;
    
    const result = await ConversationService.searchConversations(query, userId, parseInt(limit));
    res.json(result);
  } catch (error) {
    console.error('Lỗi tìm kiếm cuộc hội thoại:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Xóa cuộc hội thoại
router.delete('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId = 'default' } = req.query;
    
    const result = await ConversationService.deleteConversation(conversationId, userId);
    res.json(result);
  } catch (error) {
    console.error('Lỗi xóa cuộc hội thoại:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 