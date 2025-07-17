# 🎯 Chinese Learning Backend - Hugging Face AI Integration

Backend server cho ứng dụng học tiếng Trung với tích hợp AI miễn phí qua Hugging Face Inference API.

## 🚀 Features

- **🤖 AI-Powered QA System**: Hỏi đáp thông minh về tiếng Trung
- **💬 Conversation Generation**: Tạo cuộc hội thoại theo chủ đề và trình độ
- **📚 Learning Text Generation**: Tạo đoạn văn học tập
- **🔍 User Response Analysis**: Phân tích câu trả lời của người học
- **📊 Training Data Collection**: Thu thập dữ liệu để cải thiện AI
- **🆓 Free AI Integration**: Sử dụng Hugging Face Inference API (100% miễn phí)

## 🛠️ Tech Stack

- **Node.js** + **Express.js**
- **Socket.IO** cho real-time communication
- **MongoDB** cho data storage
- **Hugging Face Inference API** cho AI services
- **Redis** cho caching (optional)

## 📋 Prerequisites

- Node.js 16+
- MongoDB
- Hugging Face API key (free)

## 🚀 Quick Start

### 1. Clone & Install
```bash
cd backend2
npm install
```

### 2. Environment Setup
```bash
# Tạo file .env
cat > .env << EOF
PORT=5001
MONGODB_URI=mongodb://localhost:27017/chinese_learning
HUGGINGFACE_API_KEY=hf_your_token_here
HF_MODEL=THUDM/chatglm3-6b
EOF
```

### 3. Get Hugging Face API Key
1. Truy cập https://huggingface.co/
2. Tạo tài khoản miễn phí
3. Tạo API token tại https://huggingface.co/settings/tokens
4. Copy token và paste vào `.env` file

### 4. Test Setup
```bash
# Test Hugging Face integration
node test-huggingface-setup.js
```

### 5. Start Server
```bash
npm start
```

## 🎯 API Endpoints

### AI Services
- `GET /api/ai/health` - Health check
- `GET /api/ai/stats` - Usage statistics
- `POST /api/ai/qa` - QA system
- `POST /api/ai/conversation` - Generate conversation
- `POST /api/ai/learning-text` - Generate learning text
- `POST /api/ai/analyze-response` - Analyze user response

### Hugging Face Specific
- `GET /api/ai/huggingface/info` - Hugging Face info
- `GET /api/ai/huggingface/health` - Hugging Face health
- `POST /api/ai/huggingface/test` - Test Hugging Face directly

### Training Data
- `GET /api/ai/training-data/count` - Training data count
- `GET /api/ai/training-data/export` - Export training data

### Documents
- `GET /api/documents` - Get all documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/:id` - Get specific document

### Words
- `GET /api/words/:word` - Get word details
- `POST /api/words/batch` - Batch analyze words
- `GET /api/words/search` - Search words

### Conversations
- `GET /api/conversations` - Get conversations
- `POST /api/conversations` - Create conversation

## 🔌 Socket.IO Events

### QA Events
- `ask_question` - Gửi câu hỏi
- `qa_response` - Nhận câu trả lời
- `qa_error` - Lỗi QA

### Conversation Events
- `create_conversation` - Tạo cuộc hội thoại
- `conversation_created` - Cuộc hội thoại đã tạo
- `conversation_error` - Lỗi tạo cuộc hội thoại

### Learning Events
- `create_learning_text` - Tạo đoạn văn học tập
- `learning_text_created` - Đoạn văn đã tạo
- `create_practice_exercise` - Tạo bài tập
- `practice_exercise_created` - Bài tập đã tạo

## 🎯 Usage Examples

### Test QA System
```bash
curl -X POST http://localhost:5001/api/ai/qa \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Tìm từ vựng HSK1",
    "documentId": "your_document_id"
  }'
```

### Generate Conversation
```bash
curl -X POST http://localhost:5001/api/ai/conversation \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "chào hỏi",
    "level": "beginner",
    "context": "Cuộc hội thoại hàng ngày"
  }'
```

### Check Health
```bash
curl http://localhost:5001/api/ai/health
```

### Get Statistics
```bash
curl http://localhost:5001/api/ai/stats
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:5001/api/ai/health
```

Response:
```json
{
  "overall_status": "healthy",
  "providers": {
    "huggingface": {
      "status": "healthy",
      "model": "THUDM/chatglm3-6b",
      "available": true
    },
    "openai": {
      "status": "available",
      "provider": "openai"
    }
  },
  "current_provider": "huggingface"
}
```

### Usage Statistics
```bash
curl http://localhost:5001/api/ai/stats
```

Response:
```json
{
  "providers": ["huggingface", "openai"],
  "current_provider": "huggingface",
  "training_data_count": 1250,
  "cost_savings": {
    "huggingface_savings": "100%",
    "estimated_monthly_savings": "$150",
    "free_tier_limits": "1000 requests/hour"
  }
}
```

## 🎯 Available Chinese Models

### Recommended Models
1. **THUDM/chatglm3-6b** ⭐⭐⭐⭐⭐
   - Best Chinese understanding
   - Good for conversation generation
   - 6B parameters

2. **Qwen/Qwen2.5-7B-Instruct** ⭐⭐⭐⭐
   - Excellent instruction following
   - Good for structured outputs
   - 7B parameters

3. **microsoft/DialoGPT-medium-chinese** ⭐⭐⭐
   - Specialized for conversations
   - Smaller, faster
   - 345M parameters

### Model Selection
```bash
# For QA and conversation
export HF_MODEL=THUDM/chatglm3-6b

# For faster responses
export HF_MODEL=microsoft/DialoGPT-medium-chinese

# For structured outputs
export HF_MODEL=Qwen/Qwen2.5-7B-Instruct
```

## 💰 Cost Analysis

### Before (OpenAI Only)
- Average cost per request: $0.03-0.06
- Monthly cost (1000 requests): $30-60
- No rate limits

### After (Hugging Face)
- Average cost per request: $0
- Monthly cost: $0
- Rate limit: 1000 requests/hour
- Estimated savings: $30-60/month

## 🚨 Troubleshooting

### Common Issues

1. **"Model is currently loading"**
   ```bash
   # Wait 1-2 minutes for model to load
   # Retry the request
   ```

2. **"Rate limit exceeded"**
   ```bash
   # Free tier: 1000 requests/hour
   # Wait or upgrade to paid plan
   ```

3. **"Invalid API key"**
   ```bash
   # Check token at https://huggingface.co/settings/tokens
   # Ensure token starts with "hf_"
   ```

### Performance Optimization
```bash
# Use smaller models for faster response
export HF_MODEL=microsoft/DialoGPT-medium-chinese

# Optimize parameters
{
  "max_new_tokens": 500,  # Reduce for faster response
  "temperature": 0.3,     # Lower for more consistent results
  "do_sample": true,
  "top_p": 0.9
}
```

## 📈 Training Data Collection

### Automatic Collection
Mọi conversation và QA interaction được tự động lưu để training:

```bash
# View collected data
curl http://localhost:5001/api/ai/training-data/count

# Export data
curl http://localhost:5001/api/ai/training-data/export
```

### Data Format
```json
{
  "query": "Câu hỏi của user",
  "segments": [...],
  "provider": "huggingface",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "success": true
}
```

## 🔧 Development

### Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server
npm test           # Run tests
node test-huggingface-setup.js  # Test Hugging Face setup
```

### Environment Variables
```bash
PORT=5001                                    # Server port
MONGODB_URI=mongodb://localhost:27017/...   # MongoDB connection
HUGGINGFACE_API_KEY=hf_your_token_here      # Hugging Face API key
HF_MODEL=THUDM/chatglm3-6b                  # Hugging Face model
OPENAI_API_KEY=sk-your-key-here            # OpenAI API key (fallback)
```

## 📚 Documentation

- [Hugging Face Setup Guide](./FREE_AI_SETUP_GUIDE.md)
- [Dictionary Integration Guide](./DICTIONARY_INTEGRATION_GUIDE.md)
- [AI Services Setup](./AI_SERVICES_SETUP.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

Nếu gặp vấn đề:
1. Kiểm tra logs trong terminal
2. Test với script: `node test-huggingface-setup.js`
3. Verify API key tại https://huggingface.co/settings/tokens
4. Kiểm tra rate limits (1000 requests/hour cho free tier)

---

**🎉 Chúc mừng! Bạn đã setup thành công hệ thống AI miễn phí cho việc học tiếng Trung!** 