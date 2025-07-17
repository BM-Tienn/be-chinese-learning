const express = require('express');
const router = express.Router();
const HybridAIService = require('../services/hybridAIService');
const HuggingFaceService = require('../services/huggingfaceService');

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const health = await HybridAIService.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      error: 'Health check failed',
      message: error.message
    });
  }
});

// Usage statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await HybridAIService.getUsageStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get stats',
      message: error.message
    });
  }
});

// Test QA endpoint
router.post('/qa', async (req, res) => {
  try {
    const { query, documentId } = req.body;
    
    if (!query || !documentId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['query', 'documentId']
      });
    }

    // Mock segments for testing
    const mockSegments = [
      {
        chinese: "你好",
        pinyin: "nǐ hǎo",
        translation: "Xin chào",
        difficulty: 1
      },
      {
        chinese: "学习",
        pinyin: "xué xí",
        translation: "Học tập",
        difficulty: 2
      },
      {
        chinese: "中国",
        pinyin: "zhōng guó",
        translation: "Trung Quốc",
        difficulty: 2
      }
    ];

    const result = await HybridAIService.findRelevantSegments(query, mockSegments);
    
    res.json({
      success: true,
      query,
      segments: result,
      provider: 'hybrid'
    });
  } catch (error) {
    res.status(500).json({
      error: 'QA request failed',
      message: error.message
    });
  }
});

// Test conversation generation
router.post('/conversation', async (req, res) => {
  try {
    const { topic, level = 'beginner', context = '' } = req.body;
    
    if (!topic) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['topic']
      });
    }

    const result = await HybridAIService.generateConversation(topic, level, context);
    
    res.json({
      success: true,
      conversation: result,
      provider: 'hybrid'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Conversation generation failed',
      message: error.message
    });
  }
});

// Test learning text generation
router.post('/learning-text', async (req, res) => {
  try {
    const { topic, level = 'beginner', length = 'short' } = req.body;
    
    if (!topic) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['topic']
      });
    }

    const result = await HybridAIService.generateLearningText(topic, level, length);
    
    res.json({
      success: true,
      learningText: result,
      provider: 'hybrid'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Learning text generation failed',
      message: error.message
    });
  }
});

// Test user response analysis
router.post('/analyze-response', async (req, res) => {
  try {
    const { userResponse, expectedResponse, context = '' } = req.body;
    
    if (!userResponse || !expectedResponse) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['userResponse', 'expectedResponse']
      });
    }

    const result = await HybridAIService.analyzeUserResponse(userResponse, expectedResponse, context);
    
    res.json({
      success: true,
      analysis: result,
      provider: 'hybrid'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Response analysis failed',
      message: error.message
    });
  }
});

// Hugging Face specific endpoints
router.get('/huggingface/info', (req, res) => {
  try {
    const info = HuggingFaceService.getUsageInfo();
    res.json(info);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get Hugging Face info',
      message: error.message
    });
  }
});

router.get('/huggingface/health', async (req, res) => {
  try {
    const health = await HuggingFaceService.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      error: 'Hugging Face health check failed',
      message: error.message
    });
  }
});

// Test Hugging Face directly
router.post('/huggingface/test', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['prompt']
      });
    }

    const response = await HuggingFaceService.findRelevantSegments(prompt, []);
    
    res.json({
      success: true,
      prompt,
      response,
      provider: 'huggingface'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Hugging Face test failed',
      message: error.message
    });
  }
});

// Training data endpoints
router.get('/training-data/count', async (req, res) => {
  try {
    const count = await HybridAIService.getTrainingDataCount();
    res.json({
      success: true,
      count,
      file: './training_data/hybrid_qa_training.jsonl'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get training data count',
      message: error.message
    });
  }
});

router.get('/training-data/export', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const trainingFile = './training_data/hybrid_qa_training.jsonl';
    
    const content = await fs.readFile(trainingFile, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    const data = lines.map(line => JSON.parse(line));
    
    res.json({
      success: true,
      count: data.length,
      data: data.slice(0, 10), // Return first 10 entries
      total_entries: data.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to export training data',
      message: error.message
    });
  }
});

module.exports = router; 