const openai = require('../config/openai');

class AIService {
  static async findRelevantSegments(query, segments) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: `Find the most relevant Chinese text segments for the user's query. Return up to 5 segments that best match the learning intent.`
        }, {
          role: "user",
          content: `Query: ${query}\n\nSegments: ${JSON.stringify(segments.slice(0, 20))}`
        }],
        temperature: 0.3
      });

      return JSON.parse(response.choices[0].message.content) || segments.slice(0, 5);
    } catch (error) {
      console.error('Relevance search error:', error);
      return segments.slice(0, 5);
    }
  }

  // Tạo cuộc hội thoại theo chủ đề và trình độ
  static async generateConversation(topic, level = 'beginner', context = '') {
    try {
      const systemPrompt = `Bạn là một giáo viên tiếng Trung chuyên nghiệp. Tạo một cuộc hội thoại tiếng Trung theo chủ đề và trình độ được yêu cầu.

Yêu cầu:
- Chủ đề: ${topic}
- Trình độ: ${level}
- Ngữ cảnh: ${context || 'Cuộc hội thoại hàng ngày'}
- Độ dài: Mỗi người nói khoảng 4-5 câu, tổng cộng 8-10 lượt đối thoại
- Nội dung: Tự nhiên, thực tế, phù hợp với trình độ

QUAN TRỌNG: Trả về CHÍNH XÁC JSON hợp lệ, không có text thêm nào khác.

Format JSON:
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
}

Lưu ý: Tạo cuộc hội thoại tự nhiên, có sự phát triển logic, không lặp lại quá nhiều.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: systemPrompt
        }],
        temperature: 0.7,
        max_tokens: 4000
      });

      let result;
      try {
        result = JSON.parse(response.choices[0].message.content);
      } catch (parseError) {
        console.error('❌ Failed to parse AI response as JSON:', parseError);
        console.log('Raw AI response:', response.choices[0].message.content);
        
        // Try to extract JSON from the response if it contains extra text
        const content = response.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          try {
            console.log('🔄 Attempting to extract JSON from response...');
            result = JSON.parse(jsonMatch[0]);
            console.log('✅ Successfully extracted and parsed JSON');
          } catch (extractError) {
            console.error('❌ Failed to extract JSON:', extractError);
            // Return a fallback structure
            return {
              title: `Cuộc hội thoại về ${topic}`,
              topic: topic,
              level: level,
              description: `Cuộc hội thoại tiếng Trung về ${topic}`,
              conversation: [],
              vocabulary_list: [],
              grammar_points: [],
              practice_questions: []
            };
          }
        } else {
          // Return a fallback structure
          return {
            title: `Cuộc hội thoại về ${topic}`,
            topic: topic,
            level: level,
            description: `Cuộc hội thoại tiếng Trung về ${topic}`,
            conversation: [],
            vocabulary_list: [],
            grammar_points: [],
            practice_questions: []
          };
        }
      }
      
      // Validate and ensure proper structure
      if (!result.practice_questions || !Array.isArray(result.practice_questions)) {
        console.warn('⚠️ AI returned invalid practice_questions, setting to empty array');
        result.practice_questions = [];
      }
      
      // Ensure all required fields exist
      if (!result.conversation || !Array.isArray(result.conversation)) {
        result.conversation = [];
      }
      
      if (!result.vocabulary_list || !Array.isArray(result.vocabulary_list)) {
        result.vocabulary_list = [];
      }
      
      if (!result.grammar_points || !Array.isArray(result.grammar_points)) {
        result.grammar_points = [];
      }
      
      return result;
    } catch (error) {
      console.error('Conversation generation error:', error);
      throw new Error('Không thể tạo cuộc hội thoại');
    }
  }

  // Tạo đoạn văn học tập
  static async generateLearningText(topic, level = 'beginner', length = 'short') {
    try {
      const systemPrompt = `Tạo một đoạn văn tiếng Trung để học tập với các yêu cầu sau:

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

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: systemPrompt
        }],
        temperature: 0.6,
        max_tokens: 1500
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Learning text generation error:', error);
      throw new Error('Không thể tạo đoạn văn học tập');
    }
  }

  // Tạo câu hỏi tương tác
  static async generateInteractiveQuestions(context, level = 'beginner') {
    try {
      const systemPrompt = `Tạo các câu hỏi tương tác để thực hành tiếng Trung dựa trên ngữ cảnh:

Ngữ cảnh: ${context}
Trình độ: ${level}

Trả về JSON với format:
{
  "questions": [
    {
      "type": "grammar_practice|vocabulary_practice|conversation_practice|translation",
      "question": "Câu hỏi hoặc hướng dẫn",
      "context": "Ngữ cảnh bổ sung",
      "expected_response": "Phản hồi mong đợi",
      "hints": ["Gợi ý 1", "Gợi ý 2"],
      "difficulty": 1-5,
      "learning_objective": "Mục tiêu học tập"
    }
  ],
  "conversation_starters": [
    {
      "topic": "Chủ đề",
      "starter": "Câu mở đầu",
      "suggested_responses": ["Phản hồi 1", "Phản hồi 2"],
      "vocabulary_focus": ["Từ vựng", "trọng tâm"]
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: systemPrompt
        }],
        temperature: 0.7,
        max_tokens: 1000
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Interactive questions generation error:', error);
      throw new Error('Không thể tạo câu hỏi tương tác');
    }
  }

  // Phân tích câu trả lời của người dùng
  static async analyzeUserResponse(userResponse, expectedResponse, context) {
    try {
      const systemPrompt = `Phân tích câu trả lời của người học tiếng Trung:

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

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: systemPrompt
        }],
        temperature: 0.3,
        max_tokens: 800
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Response analysis error:', error);
      throw new Error('Không thể phân tích câu trả lời');
    }
  }

  // Tạo bài tập thực hành
  static async generatePracticeExercise(topic, level = 'beginner', exerciseType = 'mixed') {
    try {
      const systemPrompt = `Tạo bài tập thực hành tiếng Trung:

Chủ đề: ${topic}
Trình độ: ${level}
Loại bài tập: ${exerciseType}

Trả về JSON với format:
{
  "title": "Tiêu đề bài tập",
  "topic": "Chủ đề",
  "level": "Trình độ",
  "instructions": "Hướng dẫn làm bài",
  "exercises": [
    {
      "type": "fill_blank|multiple_choice|translation|rearrange|conversation",
      "question": "Câu hỏi hoặc hướng dẫn",
      "content": "Nội dung bài tập",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "Đáp án đúng",
      "explanation": "Giải thích",
      "difficulty": 1-5
    }
  ],
  "vocabulary_focus": ["Từ vựng", "trọng tâm"],
  "grammar_focus": ["Điểm ngữ pháp", "trọng tâm"],
  "estimated_time": "Thời gian ước tính (phút)",
  "scoring": {
    "total_points": 100,
    "per_exercise": 20
  }
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: systemPrompt
        }],
        temperature: 0.6,
        max_tokens: 1200
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Practice exercise generation error:', error);
      throw new Error('Không thể tạo bài tập thực hành');
    }
  }
}

module.exports = AIService; 