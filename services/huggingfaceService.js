const axios = require('axios');

class HuggingFaceService {
  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY;
    this.baseURL = 'https://api-inference.huggingface.co/models';
    this.model = process.env.HF_MODEL || 'THUDM/chatglm3-6b'; // Chinese model
  }

  static async findRelevantSegments(query, segments) {
    try {
      const prompt = `Tìm các đoạn văn bản tiếng Trung liên quan nhất cho câu hỏi: "${query}"

Các đoạn có sẵn: ${JSON.stringify(segments.slice(0, 20))}

Trả về JSON array với 5 đoạn liên quan nhất theo format:
[
  {
    "chinese": "Văn bản tiếng Trung",
    "pinyin": "Phiên âm pinyin", 
    "translation": "Bản dịch tiếng Việt",
    "difficulty": 1-5,
    "relevance_score": 0.0-1.0
  }
]`;

      const response = await axios.post(
        `${this.baseURL}/${this.model}`,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: 1000,
            temperature: 0.3,
            do_sample: true,
            top_p: 0.9
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      // Parse response từ Hugging Face
      const result = this.parseHFResponse(response.data);
      return result || segments.slice(0, 5);
    } catch (error) {
      console.error('HuggingFace QA error:', error);
      return segments.slice(0, 5);
    }
  }

  static async generateConversation(topic, level = 'beginner', context = '') {
    try {
      const prompt = `Bạn là giáo viên tiếng Trung. Tạo cuộc hội thoại về "${topic}" cho trình độ ${level}.
      
Ngữ cảnh: ${context || 'Cuộc hội thoại hàng ngày'}

Trả về JSON với format:
{
  "title": "Tiêu đề cuộc hội thoại",
  "topic": "Chủ đề",
  "level": "Trình độ",
  "description": "Mô tả ngắn",
  "conversation": [
    {
      "speaker": "A hoặc B",
      "chinese": "Văn bản tiếng Trung",
      "pinyin": "Phiên âm pinyin",
      "translation": "Bản dịch tiếng Việt",
      "grammar_notes": "Ghi chú ngữ pháp (nếu có)",
      "vocabulary": ["từ vựng", "quan trọng"]
    }
  ],
  "vocabulary_list": [
    {
      "word": "Từ vựng",
      "pinyin": "Phiên âm",
      "translation": "Nghĩa",
      "example": "Ví dụ sử dụng"
    }
  ],
  "grammar_points": [
    {
      "point": "Điểm ngữ pháp",
      "explanation": "Giải thích",
      "examples": ["Ví dụ 1", "Ví dụ 2"]
    }
  ],
  "practice_questions": [
    {
      "question": "Câu hỏi thực hành",
      "type": "multiple_choice hoặc fill_blank",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "Đáp án đúng",
      "explanation": "Giải thích"
    }
  ]
}`;

      const response = await axios.post(
        `${this.baseURL}/${this.model}`,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: 2000,
            temperature: 0.7,
            do_sample: true,
            top_p: 0.9
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 45000 // 45 seconds timeout for longer generation
        }
      );

      const result = this.parseHFResponse(response.data);
      return result || this.getFallbackConversation(topic, level);
    } catch (error) {
      console.error('HuggingFace conversation error:', error);
      return this.getFallbackConversation(topic, level);
    }
  }

  static async generateLearningText(topic, level = 'beginner', length = 'short') {
    try {
      const prompt = `Tạo một đoạn văn tiếng Trung để học tập với các yêu cầu sau:

- Chủ đề: ${topic}
- Trình độ: ${level}
- Độ dài: ${length === 'short' ? '50-100 từ' : length === 'medium' ? '100-200 từ' : '200-300 từ'}

Trả về JSON với format:
{
  "title": "Tiêu đề đoạn văn",
  "topic": "Chủ đề",
  "level": "Trình độ",
  "text": {
    "chinese": "Đoạn văn tiếng Trung",
    "pinyin": "Phiên âm pinyin",
    "translation": "Bản dịch tiếng Việt"
  },
  "segments": [
    {
      "chinese": "Câu tiếng Trung",
      "pinyin": "Phiên âm",
      "translation": "Bản dịch",
      "difficulty": 1-5
    }
  ],
  "vocabulary": [
    {
      "word": "Từ vựng",
      "pinyin": "Phiên âm",
      "translation": "Nghĩa",
      "part_of_speech": "Từ loại"
    }
  ],
  "grammar_notes": [
    {
      "pattern": "Mẫu câu",
      "explanation": "Giải thích",
      "examples": ["Ví dụ 1", "Ví dụ 2"]
    }
  ],
  "comprehension_questions": [
    {
      "question": "Câu hỏi hiểu",
      "type": "multiple_choice",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "Đáp án",
      "explanation": "Giải thích"
    }
  ]
}`;

      const response = await axios.post(
        `${this.baseURL}/${this.model}`,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: 1500,
            temperature: 0.6,
            do_sample: true
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return this.parseHFResponse(response.data);
    } catch (error) {
      console.error('HuggingFace learning text error:', error);
      throw new Error('Không thể tạo đoạn văn học tập');
    }
  }

  static async analyzeUserResponse(userResponse, expectedResponse, context) {
    try {
      const prompt = `Phân tích câu trả lời của người học tiếng Trung:

Câu trả lời của người dùng: ${userResponse}
Câu trả lời mong đợi: ${expectedResponse}
Ngữ cảnh: ${context}

Trả về JSON với format:
{
  "accuracy": 0-100,
  "feedback": {
    "positive": ["Điểm tốt 1", "Điểm tốt 2"],
    "improvements": ["Cần cải thiện 1", "Cần cải thiện 2"],
    "suggestions": ["Gợi ý 1", "Gợi ý 2"]
  },
  "grammar_analysis": {
    "correct_patterns": ["Mẫu câu đúng"],
    "errors": ["Lỗi ngữ pháp"],
    "corrections": ["Cách sửa"]
  },
  "pronunciation_notes": {
    "tone_issues": ["Vấn đề về thanh điệu"],
    "sound_issues": ["Vấn đề về âm"],
    "recommendations": ["Khuyến nghị"]
  },
  "vocabulary_usage": {
    "appropriate_words": ["Từ dùng phù hợp"],
    "suggested_alternatives": ["Từ thay thế"],
    "new_vocabulary": ["Từ vựng mới nên học"]
  },
  "overall_assessment": "Đánh giá tổng thể",
  "next_steps": ["Bước tiếp theo để cải thiện"]
}`;

      const response = await axios.post(
        `${this.baseURL}/${this.model}`,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: 800,
            temperature: 0.3,
            do_sample: true
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return this.parseHFResponse(response.data);
    } catch (error) {
      console.error('HuggingFace response analysis error:', error);
      throw new Error('Không thể phân tích câu trả lời');
    }
  }

  static parseHFResponse(response) {
    try {
      // Hugging Face trả về array với generated_text
      if (Array.isArray(response) && response[0]?.generated_text) {
        const text = response[0].generated_text;
        
        // Extract JSON từ text (có thể có text trước và sau JSON)
        const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.log('Raw text:', text);
            return null;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Parse HF response error:', error);
      return null;
    }
  }

  // Fallback conversation khi API lỗi
  static getFallbackConversation(topic, level) {
    return {
      title: `Cuộc hội thoại về ${topic}`,
      topic: topic,
      level: level,
      description: `Cuộc hội thoại tiếng Trung về ${topic}`,
      conversation: [
        {
          speaker: "A",
          chinese: "你好",
          pinyin: "nǐ hǎo",
          translation: "Xin chào",
          grammar_notes: "Cách chào hỏi cơ bản",
          vocabulary: ["你好"]
        },
        {
          speaker: "B", 
          chinese: "你好，很高兴认识你",
          pinyin: "nǐ hǎo, hěn gāo xìng rèn shí nǐ",
          translation: "Xin chào, rất vui được gặp bạn",
          grammar_notes: "Cách diễn đạt cảm xúc",
          vocabulary: ["高兴", "认识"]
        }
      ],
      vocabulary_list: [
        {
          word: "你好",
          pinyin: "nǐ hǎo",
          translation: "Xin chào",
          example: "你好，老师！"
        }
      ],
      grammar_points: [
        {
          point: "Cách chào hỏi",
          explanation: "你好 là cách chào hỏi phổ biến nhất",
          examples: ["你好", "您好", "早上好"]
        }
      ],
      practice_questions: [
        {
          question: "Cách nói 'Xin chào' bằng tiếng Trung?",
          type: "multiple_choice",
          options: ["再见", "你好", "谢谢", "对不起"],
          correct_answer: "你好",
          explanation: "你好 là cách chào hỏi chuẩn"
        }
      ]
    };
  }

  // Training data collection
  static async collectTrainingData(conversation) {
    try {
      const trainingData = {
        query: conversation.query,
        response: conversation.response,
        segments: conversation.segments,
        timestamp: new Date(),
        provider: 'huggingface',
        quality_score: conversation.quality_score || 0
      };

      await this.saveTrainingData(trainingData);
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
      const trainingFile = path.join(trainingDir, 'hf_qa_training.jsonl');
      
      await fs.mkdir(trainingDir, { recursive: true });
      await fs.appendFile(trainingFile, JSON.stringify(data) + '\n');
    } catch (error) {
      console.error('Save training data error:', error);
    }
  }

  // Free tier limits và usage info
  static getUsageInfo() {
    return {
      free_tier: {
        requests_per_hour: 1000,
        max_tokens_per_request: 2000,
        models_available: [
          'THUDM/chatglm3-6b',
          'Qwen/Qwen2.5-7B-Instruct',
          'microsoft/DialoGPT-medium-chinese',
          'fnlp/moss-moon-003-base'
        ],
        rate_limit: '1000 requests/hour',
        timeout: '30 seconds per request'
      },
      cost: '$0 (Free tier)',
      advantages: [
        'No setup required',
        'Good Chinese language support',
        'Multiple model options',
        'Reliable API'
      ],
      limitations: [
        'Rate limited',
        'No fine-tuning',
        'Dependent on internet',
        'Response time 2-5 seconds'
      ]
    };
  }

  // Health check
  static async healthCheck() {
    try {
      const response = await axios.get(
        `${this.baseURL}/${this.model}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 10000
        }
      );
      
      return {
        status: 'healthy',
        model: this.model,
        available: true,
        response_time: response.headers['x-response-time'] || 'unknown'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        model: this.model,
        available: false,
        error: error.message
      };
    }
  }
}

module.exports = HuggingFaceService; 