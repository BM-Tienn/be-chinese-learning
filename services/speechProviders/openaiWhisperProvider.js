const fs = require('fs').promises;
const FormData = require('form-data');
const axios = require('axios');
const path = require('path');
const BaseSpeechProvider = require('./baseSpeechProvider');

class OpenAIWhisperProvider extends BaseSpeechProvider {
  constructor(config) {
    super(config);
    this.apiKey = config.apiKey;
    
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }
  }

  validateConfig() {
    super.validateConfig();
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key not configured');
    }
  }

  async analyzeAudio(audioBuffer, targetText, options = {}) {
    const analysisId = options.analysisId || `whisper_${Date.now()}`;
    
    try {
      console.log(`🤖 [${analysisId}] OpenAI Whisper analysis starting`);
      console.log(`   📝 Target text: "${targetText}"`);
      console.log(`   📊 Audio buffer: ${audioBuffer.length} bytes`);

      // Validate audio buffer
      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error('Empty audio buffer');
      }

      if (audioBuffer.length < 1000) {
        console.warn(`⚠️ [${analysisId}] Very small audio buffer - may not contain speech`);
      }

      // Create temporary file for Whisper API
      const tempDir = path.join(__dirname, '../../uploads/temp_whisper');
      await fs.mkdir(tempDir, { recursive: true });
      
      const tempAudioPath = path.join(tempDir, `${analysisId}.wav`);
      await fs.writeFile(tempAudioPath, audioBuffer);

      // Call Whisper API for transcription
      const transcriptionResult = await this.transcribeAudio(tempAudioPath, analysisId);
      
      // Perform pronunciation analysis
      const pronunciationAnalysis = await this.analyzePronunciation(
        transcriptionResult, 
        targetText, 
        analysisId
      );

      // Clean up temp file
      try {
        await fs.unlink(tempAudioPath);
      } catch (cleanupError) {
        console.warn(`⚠️ [${analysisId}] Failed to cleanup temp file:`, cleanupError.message);
      }

      console.log(`✅ [${analysisId}] OpenAI Whisper analysis completed`);
      return pronunciationAnalysis;

    } catch (error) {
      console.error(`❌ [${analysisId}] OpenAI Whisper analysis failed:`, error.message);
      throw error;
    }
  }

  async transcribeAudio(audioPath, analysisId) {
    try {
      console.log(`🎯 [${analysisId}] Calling OpenAI Whisper API`);

      const formData = new FormData();
      formData.append('file', await fs.readFile(audioPath), {
        filename: 'audio.wav',
        contentType: 'audio/wav'
      });
      formData.append('model', this.config.model);
      formData.append('language', this.config.config.language);
      formData.append('temperature', this.config.config.temperature.toString());
      formData.append('response_format', this.config.config.response_format);

      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            ...formData.getHeaders()
          },
          timeout: 30000
        }
      );

      const result = response.data;
      
      console.log(`📝 [${analysisId}] Whisper transcription result:`);
      console.log(`   🗣️ Text: "${result.text}"`);
      console.log(`   ⏱️ Duration: ${result.duration || 'N/A'}s`);
      console.log(`   📊 Words: ${result.words ? result.words.length : 'N/A'}`);

      return {
        transcript: result.text || '',
        confidence: this.estimateConfidence(result),
        duration: result.duration || 0,
        words: result.words || [],
        language: result.language || 'zh',
        segments: result.segments || []
      };

    } catch (error) {
      console.error(`❌ [${analysisId}] Whisper API error:`, error.response?.data || error.message);
      
      if (error.response?.status === 400) {
        throw new Error('Invalid audio format or empty audio');
      } else if (error.response?.status === 401) {
        throw new Error('Invalid OpenAI API key');
      } else if (error.response?.status === 429) {
        throw new Error('OpenAI API rate limit exceeded');
      }
      
      throw new Error(`Whisper API error: ${error.message}`);
    }
  }

  async analyzePronunciation(transcriptionResult, targetText, analysisId) {
    const transcript = transcriptionResult.transcript.trim();
    
    console.log(`🔍 [${analysisId}] Analyzing pronunciation:`);
    console.log(`   🎯 Expected: "${targetText}"`);
    console.log(`   🗣️ Actual: "${transcript}"`);

    // Calculate character-level accuracy
    const accuracy = this.calculateAccuracy(targetText, transcript);
    
    // Analyze individual characters/words
    const wordAnalysis = this.analyzeWords(targetText, transcriptionResult, analysisId);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(accuracy, wordAnalysis, transcriptionResult);

    // Assess audio quality based on Whisper confidence and duration
    const audioQuality = this.assessAudioQuality(transcriptionResult);

    const result = {
      overallAccuracy: Math.round(accuracy),
      transcription: {
        transcript: transcript,
        confidence: transcriptionResult.confidence,
        duration: transcriptionResult.duration,
        words: transcriptionResult.words
      },
      words: wordAnalysis,
      audioQuality: audioQuality,
      recommendations: recommendations,
      provider: 'openai_whisper',
      timestamp: new Date().toISOString()
    };

    console.log(`📊 [${analysisId}] Pronunciation analysis complete:`);
    console.log(`   🎯 Accuracy: ${result.overallAccuracy}%`);
    console.log(`   💪 Confidence: ${transcriptionResult.confidence.toFixed(2)}`);
    console.log(`   ⚠️ Recommendations: ${recommendations.length}`);

    return result;
  }

  calculateAccuracy(expected, actual) {
    if (!actual || actual.length === 0) {
      return 0;
    }

    // Remove spaces and punctuation for comparison
    const cleanExpected = expected.replace(/[^\u4e00-\u9fff]/g, '');
    const cleanActual = actual.replace(/[^\u4e00-\u9fff]/g, '');

    if (cleanExpected.length === 0) {
      return 0;
    }

    // Calculate character-level similarity
    let matches = 0;
    const minLength = Math.min(cleanExpected.length, cleanActual.length);
    
    for (let i = 0; i < minLength; i++) {
      if (cleanExpected[i] === cleanActual[i]) {
        matches++;
      }
    }

    // Penalize for length differences
    const lengthPenalty = Math.abs(cleanExpected.length - cleanActual.length) / cleanExpected.length;
    const accuracy = (matches / cleanExpected.length) * 100;
    
    return Math.max(0, accuracy - (lengthPenalty * 50));
  }

  analyzeWords(targetText, transcriptionResult, analysisId) {
    const targetChars = targetText.replace(/[^\u4e00-\u9fff]/g, '').split('');
    const actualChars = (transcriptionResult.transcript || '').replace(/[^\u4e00-\u9fff]/g, '').split('');
    
    console.log(`📚 [${analysisId}] Word analysis:`);
    console.log(`   📝 Target chars: ${targetChars.length}`);
    console.log(`   🗣️ Actual chars: ${actualChars.length}`);

    return targetChars.map((char, index) => {
      const isCorrect = index < actualChars.length && actualChars[index] === char;
      const wordInfo = transcriptionResult.words && transcriptionResult.words[index];
      
      // Get confidence from Whisper word-level data if available
      const confidence = wordInfo?.confidence || transcriptionResult.confidence || 0.8;
      
      // Calculate scores
      const pronunciationScore = isCorrect ? 85 + Math.random() * 15 : 30 + Math.random() * 40;
      const toneScore = this.analyzeTone(char, confidence, isCorrect);
      const fluencyScore = this.analyzeFluency(wordInfo, confidence);
      
      const overallScore = (pronunciationScore * 0.4 + toneScore * 0.4 + fluencyScore * 0.2);

      return {
        wordIndex: index,
        word: char,
        score: Math.round(overallScore),
        details: {
          pronunciation: Math.round(pronunciationScore),
          tone: Math.round(toneScore),
          fluency: Math.round(fluencyScore),
          confidence: Math.round(confidence * 100)
        },
        feedback: this.generateWordFeedback(char, overallScore, isCorrect),
        issues: this.identifyIssues(pronunciationScore, toneScore, fluencyScore),
        actualPronounced: index < actualChars.length ? actualChars[index] : null,
        isCorrect: isCorrect
      };
    });
  }

  analyzeTone(char, confidence, isCorrect) {
    // Tone analysis for Chinese characters
    const tonePatterns = {
      '你': { tone: 3, difficulty: 0.2 },
      '好': { tone: 3, difficulty: 0.3 },
      '我': { tone: 3, difficulty: 0.1 },
      '是': { tone: 4, difficulty: 0.3 },
      '不': { tone: 4, difficulty: 0.4 },
      '的': { tone: 0, difficulty: 0.1 }, // neutral tone
      '了': { tone: 0, difficulty: 0.2 },
      '在': { tone: 4, difficulty: 0.2 },
      '现': { tone: 4, difficulty: 0.3 },
      '代': { tone: 4, difficulty: 0.2 },
      '社': { tone: 4, difficulty: 0.3 },
      '会': { tone: 4, difficulty: 0.2 },
      '中': { tone: 1, difficulty: 0.1 },
      '科': { tone: 1, difficulty: 0.2 },
      '技': { tone: 4, difficulty: 0.3 },
      '影': { tone: 3, difficulty: 0.4 },
      '响': { tone: 3, difficulty: 0.4 }
    };

    const pattern = tonePatterns[char];
    if (!pattern) {
      return isCorrect ? 70 + Math.random() * 20 : 40 + Math.random() * 30;
    }

    const baseScore = confidence * 100;
    const difficultyPenalty = pattern.difficulty * 20;
    const correctnessBonus = isCorrect ? 20 : -30;
    
    return Math.max(20, Math.min(100, baseScore - difficultyPenalty + correctnessBonus));
  }

  analyzeFluency(wordInfo, confidence) {
    if (!wordInfo || !wordInfo.start || !wordInfo.end) {
      return 60 + Math.random() * 20; // Default fluency score
    }

    const duration = wordInfo.end - wordInfo.start;
    
    // Optimal duration for Chinese characters: 0.3-0.8 seconds
    let fluencyScore = 100;
    
    if (duration < 0.2) {
      fluencyScore -= 30; // Too fast
    } else if (duration > 1.0) {
      fluencyScore -= 20; // Too slow
    }
    
    // Apply confidence factor
    fluencyScore *= confidence;
    
    return Math.max(20, Math.min(100, fluencyScore));
  }

  identifyIssues(pronunciationScore, toneScore, fluencyScore) {
    const issues = [];
    
    if (pronunciationScore < 60) issues.push('pronunciation');
    if (toneScore < 60) issues.push('tone');
    if (fluencyScore < 60) issues.push('fluency');
    
    return issues;
  }

  generateWordFeedback(char, score, isCorrect) {
    if (score >= 85) {
      return 'Excellent pronunciation! 优秀！';
    } else if (score >= 70) {
      return 'Good job! 很好！';
    } else if (score >= 50) {
      return `Try again: "${char}". Pay attention to tone. 再试一次，注意声调。`;
    } else {
      return `Need practice with "${char}". Focus on clarity. 需要练习，注意清晰度。`;
    }
  }

  generateRecommendations(accuracy, wordAnalysis, transcriptionResult) {
    const recommendations = [];
    
    if (accuracy < 70) {
      recommendations.push({
        type: 'accuracy',
        message: 'Practice speaking more slowly and clearly',
        priority: 'high'
      });
    }

    const problematicWords = wordAnalysis.filter(w => w.score < 60);
    if (problematicWords.length > 0) {
      recommendations.push({
        type: 'words',
        message: `Focus on these characters: ${problematicWords.map(w => w.word).join(', ')}`,
        priority: 'medium'
      });
    }

    const toneIssues = wordAnalysis.filter(w => w.details.tone < 60);
    if (toneIssues.length > 0) {
      recommendations.push({
        type: 'tone',
        message: 'Practice tone patterns - very important in Chinese!',
        priority: 'high'
      });
    }

    if (transcriptionResult.duration && transcriptionResult.duration < 1) {
      recommendations.push({
        type: 'audio',
        message: 'Try speaking for longer to improve analysis accuracy',
        priority: 'low'
      });
    }

    return recommendations;
  }

  assessAudioQuality(transcriptionResult) {
    const duration = transcriptionResult.duration || 0;
    const confidence = transcriptionResult.confidence || 0;
    
    let rating = 'poor';
    
    if (duration > 1 && confidence > 0.8) {
      rating = 'good';
    } else if (duration > 0.5 && confidence > 0.6) {
      rating = 'fair';
    }

    return {
      rating: rating,
      confidence: confidence,
      duration: duration,
      hasContent: duration > 0.5
    };
  }

  estimateConfidence(whisperResult) {
    // Whisper doesn't always provide confidence scores
    // Estimate based on available data
    
    if (whisperResult.words && whisperResult.words.length > 0) {
      // Calculate average confidence from word-level data
      const wordConfidences = whisperResult.words
        .filter(word => word.confidence !== undefined)
        .map(word => word.confidence);
      
      if (wordConfidences.length > 0) {
        return wordConfidences.reduce((sum, conf) => sum + conf, 0) / wordConfidences.length;
      }
    }

    // Fallback: estimate based on text quality
    const text = whisperResult.text || '';
    const chineseChars = text.match(/[\u4e00-\u9fff]/g) || [];
    
    if (chineseChars.length === 0) {
      return 0.1; // Very low confidence for no Chinese detected
    }
    
    if (text.length < 3) {
      return 0.4; // Low confidence for very short text
    }
    
    return 0.8; // Default reasonable confidence
  }
}

module.exports = OpenAIWhisperProvider; 