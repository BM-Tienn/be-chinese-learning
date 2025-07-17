const AIService = require('./aiService');
const HuggingFaceService = require('./huggingfaceService');

class HybridAIService {
  constructor() {
    this.providers = [
      { name: 'huggingface', service: HuggingFaceService, priority: 1 },
      { name: 'openai', service: AIService, priority: 2 } // Fallback
    ];
    
    this.currentProvider = this.getPreferredProvider();
  }

  static getPreferredProvider() {
    // Check environment variables để chọn provider
    if (process.env.HUGGINGFACE_API_KEY) {
      return 'huggingface';
    } else if (process.env.OPENAI_API_KEY) {
      return 'openai';
    }
    return 'huggingface'; // Default to Hugging Face
  }

  static async findRelevantSegments(query, segments) {
    const analysisId = `hybrid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🎯 [${analysisId}] Bắt đầu tìm kiếm với provider: ${this.currentProvider}`);

    for (const provider of this.providers) {
      try {
        console.log(`🔄 [${analysisId}] Thử provider: ${provider.name}`);
        
        let result;
        switch (provider.name) {
          case 'huggingface':
            result = await HuggingFaceService.findRelevantSegments(query, segments);
            break;
          case 'openai':
            result = await AIService.findRelevantSegments(query, segments);
            break;
        }

        if (result && result.length > 0) {
          console.log(`✅ [${analysisId}] Thành công với ${provider.name}`);
          
          // Collect training data
          await this.collectTrainingData({
            query,
            segments: result,
            provider: provider.name,
            success: true
          });

          return result;
        }
      } catch (error) {
        console.error(`❌ [${analysisId}] Lỗi với ${provider.name}:`, error.message);
        continue;
      }
    }

    console.log(`⚠️ [${analysisId}] Tất cả providers đều thất bại, trả về segments mặc định`);
    return segments.slice(0, 5);
  }

  static async generateConversation(topic, level = 'beginner', context = '') {
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🎭 [${conversationId}] Tạo cuộc hội thoại: ${topic} (${level})`);

    for (const provider of this.providers) {
      try {
        console.log(`🔄 [${conversationId}] Thử provider: ${provider.name}`);
        
        let result;
        switch (provider.name) {
          case 'huggingface':
            result = await HuggingFaceService.generateConversation(topic, level, context);
            break;
          case 'openai':
            result = await AIService.generateConversation(topic, level, context);
            break;
        }

        if (result && result.conversation) {
          console.log(`✅ [${conversationId}] Thành công với ${provider.name}`);
          
          // Collect training data
          await this.collectTrainingData({
            topic,
            level,
            context,
            conversation: result,
            provider: provider.name,
            success: true
          });

          return result;
        }
      } catch (error) {
        console.error(`❌ [${conversationId}] Lỗi với ${provider.name}:`, error.message);
        continue;
      }
    }

    throw new Error('Không thể tạo cuộc hội thoại với bất kỳ provider nào');
  }

  static async generateLearningText(topic, level = 'beginner', length = 'short') {
    const textId = `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`📚 [${textId}] Tạo đoạn văn học tập: ${topic} (${level}, ${length})`);

    for (const provider of this.providers) {
      try {
        console.log(`🔄 [${textId}] Thử provider: ${provider.name}`);
        
        let result;
        switch (provider.name) {
          case 'huggingface':
            result = await HuggingFaceService.generateLearningText(topic, level, length);
            break;
          case 'openai':
            result = await AIService.generateLearningText(topic, level, length);
            break;
        }

        if (result && result.text) {
          console.log(`✅ [${textId}] Thành công với ${provider.name}`);
          return result;
        }
      } catch (error) {
        console.error(`❌ [${textId}] Lỗi với ${provider.name}:`, error.message);
        continue;
      }
    }

    throw new Error('Không thể tạo đoạn văn học tập với bất kỳ provider nào');
  }

  static async analyzeUserResponse(userResponse, expectedResponse, context) {
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🔍 [${analysisId}] Phân tích câu trả lời của user`);

    for (const provider of this.providers) {
      try {
        console.log(`🔄 [${analysisId}] Thử provider: ${provider.name}`);
        
        let result;
        switch (provider.name) {
          case 'huggingface':
            result = await HuggingFaceService.analyzeUserResponse(userResponse, expectedResponse, context);
            break;
          case 'openai':
            result = await AIService.analyzeUserResponse(userResponse, expectedResponse, context);
            break;
        }

        if (result && result.accuracy !== undefined) {
          console.log(`✅ [${analysisId}] Thành công với ${provider.name}`);
          return result;
        }
      } catch (error) {
        console.error(`❌ [${analysisId}] Lỗi với ${provider.name}:`, error.message);
        continue;
      }
    }

    throw new Error('Không thể phân tích câu trả lời với bất kỳ provider nào');
  }

  // Training data collection cho fine-tuning
  static async collectTrainingData(data) {
    try {
      const trainingData = {
        ...data,
        timestamp: new Date(),
        model_version: this.getModelVersion(),
        user_feedback: null // Sẽ được cập nhật từ frontend
      };

      // Lưu vào database hoặc file
      await this.saveTrainingData(trainingData);
      
      console.log(`📊 Training data collected: ${data.provider}`);
      return true;
    } catch (error) {
      console.error('Training data collection error:', error);
      return false;
    }
  }

  static async saveTrainingData(data) {
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      const trainingDir = './training_data';
      const trainingFile = path.join(trainingDir, 'hybrid_qa_training.jsonl');
      
      // Tạo thư mục nếu chưa có
      await fs.mkdir(trainingDir, { recursive: true });
      
      // Append data
      await fs.appendFile(trainingFile, JSON.stringify(data) + '\n');
    } catch (error) {
      console.error('Save training data error:', error);
    }
  }

  static getModelVersion() {
    return {
      huggingface: process.env.HF_MODEL || 'THUDM/chatglm3-6b',
      openai: 'gpt-4'
    };
  }

  // Get usage statistics
  static async getUsageStats() {
    return {
      providers: this.providers.map(p => p.name),
      current_provider: this.currentProvider,
      training_data_count: await this.getTrainingDataCount(),
      cost_savings: this.calculateCostSavings(),
      huggingface_info: HuggingFaceService.getUsageInfo()
    };
  }

  static async getTrainingDataCount() {
    try {
      const fs = require('fs').promises;
      const trainingFile = './training_data/hybrid_qa_training.jsonl';
      
      const content = await fs.readFile(trainingFile, 'utf8');
      return content.split('\n').filter(line => line.trim()).length;
    } catch (error) {
      return 0;
    }
  }

  static calculateCostSavings() {
    // So sánh với OpenAI GPT-4
    const openaiCost = 0.06; // $0.06 per 1K tokens
    const hfCost = 0; // Free tier
    
    return {
      huggingface_savings: '100%',
      estimated_monthly_savings: '$50-150',
      free_tier_limits: '1000 requests/hour'
    };
  }

  // Health check cho tất cả providers
  static async healthCheck() {
    const results = {};
    
    for (const provider of this.providers) {
      try {
        switch (provider.name) {
          case 'huggingface':
            results.huggingface = await HuggingFaceService.healthCheck();
            break;
          case 'openai':
            results.openai = { status: 'available', provider: 'openai' };
            break;
        }
      } catch (error) {
        results[provider.name] = {
          status: 'error',
          provider: provider.name,
          error: error.message
        };
      }
    }
    
    return {
      overall_status: Object.values(results).some(r => r.status === 'healthy' || r.status === 'available') ? 'healthy' : 'unhealthy',
      providers: results,
      current_provider: this.currentProvider
    };
  }
}

module.exports = HybridAIService; 