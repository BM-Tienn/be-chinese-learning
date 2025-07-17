const Document = require('../models/Document');
const Conversation = require('../models/Conversation');
const HybridAIService = require('../services/hybridAIService');
const ConversationService = require('../services/conversationService');
const PronunciationAnalyzer = require('../services/pronunciationAnalyzer');

const socketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Chat/QA handler
    socket.on('ask_question', async (data) => {
      try {
        const { query, documentId } = data;
        
        const document = await Document.findById(documentId);
        if (!document) {
          socket.emit('qa_error', { error: 'Document not found' });
          return;
        }

        // Use Hybrid AI to find relevant segments
        const relevantSegments = await HybridAIService.findRelevantSegments(query, document.segments);
        
        const conversation = new Conversation({
          query,
          response: JSON.stringify(relevantSegments),
          documentId
        });
        await conversation.save();

        socket.emit('qa_response', {
          query,
          segments: relevantSegments,
          conversationId: conversation._id
        });
      } catch (error) {
        console.error('QA error:', error);
        socket.emit('qa_error', { error: 'Failed to process question' });
      }
    });

    // Tạo cuộc hội thoại mới
    socket.on('create_conversation', async (data) => {
      try {
        const { topic, level = 'beginner', context = '', userId = 'default' } = data;
        
        console.log(`🎭 Tạo cuộc hội thoại qua socket: ${topic} (${level})`);
        
        const result = await ConversationService.createConversation(topic, level, context, userId);
        
        socket.emit('conversation_created', result);
      } catch (error) {
        console.error('Conversation creation error:', error);
        socket.emit('conversation_error', { 
          error: 'Không thể tạo cuộc hội thoại',
          details: error.message 
        });
      }
    });

    // Tạo đoạn văn học tập
    socket.on('create_learning_text', async (data) => {
      try {
        const { topic, level = 'beginner', length = 'short', userId = 'default' } = data;
        
        console.log(`📚 Tạo đoạn văn học tập qua socket: ${topic} (${level}, ${length})`);
        
        const result = await ConversationService.createLearningText(topic, level, length, userId);
        
        socket.emit('learning_text_created', result);
      } catch (error) {
        console.error('Learning text creation error:', error);
        socket.emit('learning_text_error', { 
          error: 'Không thể tạo đoạn văn học tập',
          details: error.message 
        });
      }
    });

    // Tạo bài tập thực hành
    socket.on('create_practice_exercise', async (data) => {
      try {
        const { topic, level = 'beginner', exerciseType = 'mixed', userId = 'default' } = data;
        
        console.log(`🏋️ Tạo bài tập thực hành qua socket: ${topic} (${level}, ${exerciseType})`);
        
        const result = await ConversationService.createPracticeExercise(topic, level, exerciseType, userId);
        
        socket.emit('practice_exercise_created', result);
      } catch (error) {
        console.error('Practice exercise creation error:', error);
        socket.emit('practice_exercise_error', { 
          error: 'Không thể tạo bài tập thực hành',
          details: error.message 
        });
      }
    });

    // Phân tích câu trả lời của người dùng
    socket.on('analyze_user_response', async (data) => {
      try {
        const { conversationId, userResponse, expectedResponse, context = '' } = data;
        
        console.log(`🔍 Phân tích câu trả lời qua socket: ${userResponse}`);
        
        const result = await ConversationService.analyzeUserResponse(
          conversationId, 
          userResponse, 
          expectedResponse, 
          context
        );
        
        socket.emit('response_analyzed', result);
      } catch (error) {
        console.error('Response analysis error:', error);
        socket.emit('response_analysis_error', { 
          error: 'Không thể phân tích câu trả lời',
          details: error.message 
        });
      }
    });

    // Lấy lịch sử cuộc hội thoại
    socket.on('get_conversation_history', async (data) => {
      try {
        const { userId = 'default', limit = 20 } = data;
        
        const result = await ConversationService.getConversationHistory(userId, limit);
        
        socket.emit('conversation_history', result);
      } catch (error) {
        console.error('Conversation history error:', error);
        socket.emit('conversation_history_error', { 
          error: 'Không thể lấy lịch sử cuộc hội thoại',
          details: error.message 
        });
      }
    });

    // Lấy thống kê học tập
    socket.on('get_learning_stats', async (data) => {
      try {
        const { userId = 'default' } = data;
        
        const result = await ConversationService.getLearningStats(userId);
        
        socket.emit('learning_stats', result);
      } catch (error) {
        console.error('Learning stats error:', error);
        socket.emit('learning_stats_error', { 
          error: 'Không thể lấy thống kê học tập',
          details: error.message 
        });
      }
    });

    // Tìm kiếm cuộc hội thoại
    socket.on('search_conversations', async (data) => {
      try {
        const { query, userId = 'default', limit = 10 } = data;
        
        const result = await ConversationService.searchConversations(query, userId, limit);
        
        socket.emit('conversations_found', result);
      } catch (error) {
        console.error('Conversation search error:', error);
        socket.emit('conversation_search_error', { 
          error: 'Không thể tìm kiếm cuộc hội thoại',
          details: error.message 
        });
      }
    });

    // Enhanced pronunciation analysis
    socket.on('pronunciation_chunk', async (data) => {
      const requestId = `req_${Date.now()}_${socket.id.substr(-6)}`;
      
      try {
        const { audioChunk, text, wordIndex } = data;
        
        console.log(`🎯 [${requestId}] ===== PRONUNCIATION REQUEST START =====`);
        console.log(`📝 [${requestId}] Text: "${text}"`);
        console.log(`🔢 [${requestId}] Word index: ${wordIndex}`);
        console.log(`🔗 [${requestId}] Socket ID: ${socket.id}`);
        console.log(`📊 [${requestId}] Audio chunk size (base64): ${audioChunk ? audioChunk.length : 0} chars`);
        
        if (!audioChunk) {
          console.error(`❌ [${requestId}] No audio chunk received!`);
          throw new Error('No audio data received');
        }
        
        // Convert base64 to buffer
        const audioBuffer = Buffer.from(audioChunk, 'base64');
        console.log(`🔄 [${requestId}] Converted to buffer: ${audioBuffer.length} bytes`);
        
        if (audioBuffer.length === 0) {
          console.error(`❌ [${requestId}] Empty audio buffer after conversion!`);
          throw new Error('Empty audio buffer');
        }
        
        // Perform detailed pronunciation analysis
        console.log(`🔬 [${requestId}] Starting pronunciation analysis...`);
        const analysis = await PronunciationAnalyzer.analyzeAudio(audioBuffer, text);
        console.log('analysis', analysis);
        
        // Extract results for the specific segment
        const segmentResults = analysis.words.map((wordAnalysis, index) => ({
          wordIndex: index,
          word: wordAnalysis.word,
          score: wordAnalysis.score,
          details: wordAnalysis.details,
          feedback: wordAnalysis.feedback,
          issues: wordAnalysis.issues
        }));

        // Send comprehensive results
        const result = {
          segmentIndex: wordIndex,
          text: text,
          overallAccuracy: analysis.overallAccuracy,
          transcription: analysis.transcription,
          words: segmentResults,
          audioQuality: analysis.audioQuality,
          audioValidation: analysis.audioValidation, // Include debug info
          recommendations: analysis.recommendations,
          timestamp: new Date().toISOString()
        };
        
        console.log(`📤 [${requestId}] Sending results:`);
        console.log(`   🎯 Overall accuracy: ${analysis.overallAccuracy}%`);
        console.log(`   📝 Transcription: "${analysis.transcription.transcript}"`);
        console.log(`   💪 Confidence: ${analysis.transcription.confidence.toFixed(2)}`);
        console.log(`   🔊 Audio quality: ${analysis.audioQuality.rating}`);
        console.log(`   ⚠️ Recommendations: ${analysis.recommendations.length} items`);
        console.log(`🏁 [${requestId}] ===== PRONUNCIATION REQUEST END =====\n`);
        
        socket.emit('pronunciation_result', result);
        
      } catch (error) {
        console.error(`💥 [${requestId}] Pronunciation analysis error:`, error);
        console.error(`💥 [${requestId}] Error stack:`, error.stack);
        console.log(`🏁 [${requestId}] ===== PRONUNCIATION REQUEST FAILED =====\n`);
        
        socket.emit('pronunciation_error', { 
          error: 'Analysis failed',
          details: error.message,
          requestId: requestId,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Pronunciation practice session management
    socket.on('start_practice_session', async (data) => {
      try {
        const { documentId, segmentIds } = data;
        
        const document = await Document.findById(documentId);
        if (!document) {
          socket.emit('session_error', { error: 'Document not found' });
          return;
        }

        // Filter segments for practice
        const practiceSegments = segmentIds 
          ? document.segments.filter(seg => segmentIds.includes(seg._id.toString()))
          : document.segments;

        socket.emit('session_started', {
          sessionId: `session_${Date.now()}_${socket.id}`,
          segments: practiceSegments,
          totalSegments: practiceSegments.length
        });

      } catch (error) {
        console.error('Session start error:', error);
        socket.emit('session_error', { error: 'Failed to start practice session' });
      }
    });

    // Batch pronunciation analysis for entire segments
    socket.on('analyze_segment', async (data) => {
      try {
        const { audioChunk, segmentText, segmentIndex } = data;
        
        console.log(`Analyzing segment ${segmentIndex}: "${segmentText}"`);
        
        const audioBuffer = Buffer.from(audioChunk, 'base64');
        const analysis = await PronunciationAnalyzer.analyzeAudio(audioBuffer, segmentText);
        
        // Calculate segment-level metrics
        const segmentScore = analysis.words.reduce((sum, word) => sum + word.score, 0) / analysis.words.length;
        
        socket.emit('segment_analysis_result', {
          segmentIndex,
          segmentText,
          overallScore: Math.round(segmentScore),
          overallAccuracy: analysis.overallAccuracy,
          wordAnalysis: analysis.words,
          transcription: analysis.transcription.transcript,
          confidence: analysis.transcription.confidence,
          audioQuality: analysis.audioQuality,
          recommendations: analysis.recommendations,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Segment analysis error:', error);
        socket.emit('segment_analysis_error', { 
          error: 'Segment analysis failed',
          details: error.message
        });
      }
    });

    // Get pronunciation statistics
    socket.on('get_practice_stats', async (data) => {
      try {
        const { userId, timeframe = '7d' } = data;
        
        // Mock statistics - in production, query actual database
        const stats = {
          sessionsCompleted: Math.floor(Math.random() * 20) + 5,
          averageAccuracy: Math.floor(Math.random() * 30) + 70,
          totalPracticeTime: Math.floor(Math.random() * 120) + 30, // minutes
          improvementTrend: Math.random() > 0.5 ? 'improving' : 'stable',
          weakAreas: ['tone', 'pronunciation'],
          strongAreas: ['fluency'],
          recommendedPractice: [
            'Focus on tone 3 (falling-rising)',
            'Practice "zh", "ch", "sh" sounds',
            'Work on sentence rhythm'
          ]
        };

        socket.emit('practice_stats', stats);

      } catch (error) {
        console.error('Stats error:', error);
        socket.emit('stats_error', { error: 'Failed to fetch statistics' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

module.exports = socketHandlers; 