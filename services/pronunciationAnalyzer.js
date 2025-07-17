const fs = require('fs').promises;
const path = require('path');
const SpeechProviderFactory = require('./speechProviders');
const config = require('../config/pronunciationConfig');
const ChineseTextUtils = require('../utils/chineseTextUtils');

/**
 * Improved version with configuration management and better performance
 */
class PronunciationAnalyzer {
  
  /**
   * Main analysis method - optimized to avoid unnecessary file I/O
   * @param {Buffer} audioBuffer - Audio data buffer
   * @param {string} targetText - Expected Chinese text
   * @returns {Object} - Detailed analysis result
   */
  static async analyzeAudio(audioBuffer, targetText) {
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      if (!audioBuffer || audioBuffer.length === 0) {
        console.error(`❌ [${analysisId}] Empty or missing audio buffer`);
        throw new Error('Empty audio buffer received');
      }

      if (audioBuffer.length < config.AUDIO_THRESHOLDS.EMPTY_AUDIO_SIZE) {
        console.warn(`⚠️ [${analysisId}] Very small audio buffer (${audioBuffer.length} bytes) - might be empty audio`);
      }

      // Enhanced audio validation without file I/O
      const audioValidation = this.validateAudioBuffer(audioBuffer, analysisId);
      
      // Save debug file only if needed (keep for debugging but don't block analysis)
      const debugPath = await this.saveDebugAudio(audioBuffer, targetText, analysisId);
      
      // Perform analysis with direct buffer (no file reading)
      const analysis = await this.performDetailedAnalysis(audioBuffer, debugPath, targetText, analysisId, audioValidation);

      return analysis;
    } catch (error) {
      console.error(`💥 [${analysisId}] Pronunciation analysis error:`, error);
      throw error;
    }
  }

  /**
   * Validate audio buffer directly without file operations
   * @param {Buffer} audioBuffer - Audio buffer to validate
   * @param {string} analysisId - Analysis ID for logging
   * @returns {Object} - Validation result
   */
  static validateAudioBuffer(audioBuffer, analysisId) {
    try {
      const fileSize = audioBuffer.length;
      const header = audioBuffer.slice(0, 12);
      
      const isWav = header.slice(0, 4).toString() === 'RIFF' && header.slice(8, 12).toString() === 'WAVE';
      
      const validation = {
        fileSize: fileSize,
        isValidFormat: isWav,
        isEmpty: fileSize < config.AUDIO_THRESHOLDS.EMPTY_AUDIO_SIZE,
        isTooShort: fileSize < config.AUDIO_THRESHOLDS.SHORT_AUDIO_SIZE,
        quality: this.assessAudioQuality(audioBuffer, fileSize)
      };

      if (validation.isEmpty || validation.isTooShort) {
        console.warn(`⚠️ [${analysisId}] Audio validation warning: ${validation.isEmpty ? 'Empty audio' : 'Too short audio'}`);
      }
      
      return validation;
    } catch (error) {
      console.error(`❌ [${analysisId}] Audio validation failed:`, error);
      return {
        fileSize: 0,
        isValidFormat: false,
        isEmpty: true,
        isTooShort: true,
        quality: { rating: 'poor', confidence: 0 }
      };
    }
  }

  /**
   * Enhanced audio quality assessment using buffer analysis
   * @param {Buffer} audioBuffer - Audio buffer
   * @param {number} fileSize - File size in bytes
   * @returns {Object} - Quality assessment
   */
  static assessAudioQuality(audioBuffer, fileSize) {
    const quality = {
      rating: 'poor',
      confidence: 0,
      estimatedDuration: 0,
      hasContent: false,
      analysis: {}
    };

    if (fileSize < config.AUDIO_THRESHOLDS.EMPTY_AUDIO_SIZE) {
      quality.rating = 'poor';
      quality.confidence = 0;
      return quality;
    }

    // Estimate duration using config values
    quality.estimatedDuration = fileSize / config.AUDIO_THRESHOLDS.ESTIMATED_BYTES_PER_SECOND;
    
    if (fileSize > config.AUDIO_THRESHOLDS.SHORT_AUDIO_SIZE) {
      quality.hasContent = true;
      
      // Enhanced quality rating using config thresholds
      if (fileSize > config.AUDIO_THRESHOLDS.GOOD_AUDIO_SIZE) { // > ~1.5 seconds
        quality.rating = config.QUALITY_RATINGS.GOOD.label;
        quality.confidence = 0.8;
      } else if (fileSize > 20000) { // > ~0.6 seconds
        quality.rating = config.QUALITY_RATINGS.FAIR.label;
        quality.confidence = 0.6;
      } else {
        quality.rating = config.QUALITY_RATINGS.POOR.label;
        quality.confidence = 0.3;
      }

      // Simple amplitude analysis for additional quality metrics
      quality.analysis = this.analyzeAudioAmplitude(audioBuffer);
    }

    return quality;
  }

  /**
   * Basic amplitude analysis for audio quality
   * @param {Buffer} audioBuffer - Audio buffer
   * @returns {Object} - Amplitude analysis
   */
  static analyzeAudioAmplitude(audioBuffer) {
    try {
      // Skip WAV header (44 bytes) and analyze amplitude
      const audioData = audioBuffer.slice(44);
      const samples = audioData.length / 2; // 16-bit samples
      
      let sum = 0;
      let max = 0;
      let zeros = 0;
      
      for (let i = 0; i < audioData.length - 1; i += 2) {
        const sample = Math.abs(audioData.readInt16LE(i));
        sum += sample;
        max = Math.max(max, sample);
        if (sample === 0) zeros++;
      }
      
      const avgAmplitude = sum / samples;
      const silenceRatio = zeros / samples;
      
      return {
        avgAmplitude,
        maxAmplitude: max,
        silenceRatio,
        estimatedVolume: Math.min(1, avgAmplitude / 16384), // Normalize to 0-1
        hasSignal: silenceRatio < 0.8
      };
    } catch (error) {
      return {
        avgAmplitude: 0,
        maxAmplitude: 0,
        silenceRatio: 1,
        estimatedVolume: 0,
        hasSignal: false,
        error: error.message
      };
    }
  }

  /**
   * Save debug audio file asynchronously (non-blocking)
   * @param {Buffer} audioBuffer - Audio buffer
   * @param {string} targetText - Target text for filename
   * @param {string} analysisId - Analysis ID
   * @returns {Promise<string>} - Debug file path
   */
  static async saveDebugAudio(audioBuffer, targetText, analysisId) {
    try {
      const debugDir = path.join(__dirname, '../uploads/debug_audio');
      await fs.mkdir(debugDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const sanitizedText = ChineseTextUtils.cleanChineseText(targetText).substring(0, 10);
      const audioFileName = `${timestamp}_${analysisId}_${sanitizedText}.wav`;
      const tempAudioPath = path.join(debugDir, audioFileName);
      
      // Save asynchronously without awaiting (for performance)
      fs.writeFile(tempAudioPath, audioBuffer).catch(err => {
        console.warn(`⚠️ [${analysisId}] Debug file save failed:`, err.message);
      });
      
      return tempAudioPath;
    } catch (error) {
      console.warn(`⚠️ [${analysisId}] Debug setup failed:`, error.message);
      return null;
    }
  }

  /**
   * Perform detailed analysis with optimized flow
   * @param {Buffer} audioBuffer - Audio buffer (direct use, no file reading)
   * @param {string} debugPath - Debug file path (for reference only)
   * @param {string} targetText - Target Chinese text
   * @param {string} analysisId - Analysis ID
   * @param {Object} audioValidation - Audio validation result
   * @returns {Object} - Enhanced analysis result
   */
  static async performDetailedAnalysis(audioBuffer, debugPath, targetText, analysisId, audioValidation) {
    try {
      // Use buffer directly instead of reading file again
      const aiAnalysis = await SpeechProviderFactory.analyzeAudio(audioBuffer, targetText, { analysisId });
      
      const enhancedAnalysis = await this.enhanceAIAnalysis(aiAnalysis, targetText, audioValidation, analysisId);
      return enhancedAnalysis;
      
    } catch (aiError) {
      console.warn(`⚠️ [${analysisId}] AI analysis failed, falling back to mock:`, aiError.message);
      
      // Use optimized text segmentation
      const segments = ChineseTextUtils.segmentChineseText(targetText);
      const transcriptionResult = await this.mockSpeechRecognition(audioBuffer, targetText, analysisId, audioValidation);
      const hallucination = this.detectHallucination(transcriptionResult.transcript, targetText, analysisId);

      const detailedAnalysis = {
        overallAccuracy: this.calculateOverallAccuracy(targetText, transcriptionResult.transcript, audioValidation),
        transcription: transcriptionResult,
        words: segments.map((word, index) => {
          let wordAnalysis = this.analyzeWord(word, transcriptionResult, index, audioValidation, targetText);
          
          if (hallucination.detected) {
            const penalty = this.calculateHallucinationPenalty(hallucination);
            wordAnalysis = this.applyHallucinationPenalty(wordAnalysis, penalty, hallucination);
          }
          
          return wordAnalysis;
        }),
        audioQuality: {
          ...audioValidation.quality,
          hallucinationCheck: hallucination
        },
        audioValidation: audioValidation,
        recommendations: [],
        provider: 'mock_fallback',
        aiError: aiError.message,
        hallucinationCheck: hallucination,
        textAnalysis: ChineseTextUtils.analyzeTextDifficulty(targetText)
      };

      detailedAnalysis.recommendations = this.generateRecommendations(detailedAnalysis, audioValidation);

      return detailedAnalysis;
    }
  }

  /**
   * Enhanced AI analysis with configuration-based processing
   * @param {Object} aiAnalysis - Original AI analysis
   * @param {string} targetText - Target text
   * @param {Object} audioValidation - Audio validation
   * @param {string} analysisId - Analysis ID
   * @returns {Object} - Enhanced analysis
   */
  static async enhanceAIAnalysis(aiAnalysis, targetText, audioValidation, analysisId) {
    const hallucination = this.detectHallucination(aiAnalysis.transcription.transcript, targetText, analysisId);
    
    const combinedAudioQuality = {
      ...aiAnalysis.audioQuality,
      validation: audioValidation,
      combinedRating: this.combineQualityRatings(aiAnalysis.audioQuality.rating, audioValidation.quality.rating),
      hallucinationCheck: hallucination
    };

    // Enhanced word analysis with Chinese-specific features
    const enhancedWords = aiAnalysis.words.map(word => {
      let adjustedWord = {
        ...word,
        chineseSpecificAnalysis: {
          toneAccuracy: this.assessToneAccuracy(word, targetText),
          strokeComplexity: ChineseTextUtils.getStrokeComplexity(word.word),
          commonMistakes: ChineseTextUtils.identifyPronunciationMistakes(word.word, word.actualPronounced || '')
        }
      };

      if (hallucination.detected) {
        const penalty = this.calculateHallucinationPenalty(hallucination);
        adjustedWord = this.applyHallucinationPenalty(adjustedWord, penalty, hallucination);
      }

      return adjustedWord;
    });

    let enhancedRecommendations = [
      ...aiAnalysis.recommendations,
      ...this.generateChineseLearningRecommendations(aiAnalysis, targetText)
    ];

    if (hallucination.detected) {
      enhancedRecommendations.unshift({
        type: 'transcription_warning',
        message: hallucination.message,
        priority: 'high'
      });
    }

    return {
      ...aiAnalysis,
      audioQuality: combinedAudioQuality,
      words: enhancedWords,
      recommendations: enhancedRecommendations,
      enhancement: 'chinese_learning_optimized',
      originalProvider: aiAnalysis.provider,
      hallucinationCheck: hallucination,
      textAnalysis: ChineseTextUtils.analyzeTextDifficulty(targetText)
    };
  }

  /**
   * Optimized hallucination detection using configuration
   * @param {string} transcript - Transcribed text
   * @param {string} targetText - Expected text
   * @param {string} analysisId - Analysis ID
   * @returns {Object} - Hallucination detection result
   */
  static detectHallucination(transcript, targetText, analysisId) {
    const cleanTarget = ChineseTextUtils.cleanChineseText(targetText);
    const cleanTranscript = ChineseTextUtils.cleanChineseText(transcript);
    
    const targetChars = new Set(cleanTarget.split(''));
    const transcriptChars = new Set(cleanTranscript.split(''));
    const overlap = [...targetChars].filter(char => transcriptChars.has(char)).length;
    const overlapRatio = targetChars.size > 0 ? overlap / targetChars.size : 0;
    
    // Use configuration patterns instead of hardcoded ones
    const hasCommonHallucination = config.HALLUCINATION_PATTERNS.some(pattern => pattern.test(transcript));
    const lengthRatio = cleanTarget.length > 0 ? cleanTranscript.length / cleanTarget.length : 0;
    
    // Use configuration thresholds
    const thresholds = config.HALLUCINATION_THRESHOLDS;
    const suspiciousLength = lengthRatio > thresholds.HIGH_SEVERITY_LENGTH_RATIO;
    const tooShort = cleanTranscript.length < cleanTarget.length * thresholds.SHORT_TEXT_RATIO;
    
    let detected = false;
    let message = '';
    let severity = 'low';
    
    if (hasCommonHallucination) {
      detected = true;
      message = 'Detected common phrases that may be hallucinations (like video endings). Please try recording again.';
      severity = 'high';
    } else if (suspiciousLength && overlapRatio < thresholds.MEDIUM_SEVERITY_OVERLAP) {
      detected = true;
      message = 'Transcription much longer than expected with low character overlap. May contain hallucinations.';
      severity = 'medium';
    } else if (tooShort && overlapRatio < thresholds.SHORT_TEXT_OVERLAP) {
      detected = true;
      message = 'Transcription too short and doesn\'t match expected content. Please speak more clearly.';
      severity = 'medium';
    } else if (overlapRatio < thresholds.HIGH_SEVERITY_OVERLAP) {
      detected = true;
      message = 'Transcription doesn\'t match expected Chinese characters. Please try again.';
      severity = 'high';
    }
    
    return {
      detected,
      message,
      severity,
      overlapRatio,
      lengthRatio,
      hasCommonPhrases: hasCommonHallucination,
      tooShort,
      suspiciousLength
    };
  }

  /**
   * Enhanced tone accuracy assessment with configuration
   * @param {Object} word - Word analysis result
   * @param {string} targetText - Full target text for context
   * @returns {Object} - Tone accuracy assessment
   */
  static assessToneAccuracy(word, targetText) {
    const toneInfo = ChineseTextUtils.getToneInfo(word.word);
    
    if (!toneInfo) {
      return { 
        accuracy: 70, 
        confidence: 'medium', 
        recommendation: config.RECOMMENDATIONS.TONE.medium 
      };
    }

    const baseAccuracy = word.details?.tone || 70;
    const contextBonus = ChineseTextUtils.getContextualBonus(targetText, word.word, 0);
    
    return {
      accuracy: Math.min(100, baseAccuracy + contextBonus),
      tone: toneInfo.tone,
      pinyin: toneInfo.pinyin,
      difficulty: toneInfo.difficulty,
      recommendation: this.getToneRecommendation(toneInfo.tone, baseAccuracy),
      hskLevel: toneInfo.hsk
    };
  }

  /**
   * Get tone recommendation using configuration
   * @param {number} tone - Tone number (0-4)
   * @param {number} accuracy - Current accuracy score
   * @returns {string} - Recommendation message
   */
  static getToneRecommendation(tone, accuracy) {
    if (accuracy >= config.SCORING.EXCELLENT_THRESHOLD) {
      return 'Excellent tone control! 优秀！';
    }
    
    const toneGuide = config.TONE_GUIDANCE[tone] || config.TONE_GUIDANCE[0];
    return `Practice ${toneGuide.name} tone (${tone}): ${toneGuide.description}. Listen to native examples.`;
  }

  /**
   * Continue with other optimized methods...
   * Note: The rest of the methods follow similar patterns with:
   * 1. Using config constants instead of hardcoded values
   * 2. Using ChineseTextUtils for text processing
   * 3. Improved performance and error handling
   */

  // ... (Include other methods like combineQualityRatings, generateChineseLearningRecommendations, etc.)
  // For brevity, I'm showing the pattern - you would continue refactoring the remaining methods

  static combineQualityRatings(aiRating, validationRating) {
    const ratings = { poor: 1, fair: 2, good: 3, excellent: 4 };
    const aiScore = ratings[aiRating] || 1;
    const validationScore = ratings[validationRating] || 1;
    
    const averageScore = (aiScore + validationScore) / 2;
    
    if (averageScore >= 3.5) return 'excellent';
    if (averageScore >= 2.5) return 'good';
    if (averageScore >= 1.5) return 'fair';
    return 'poor';
  }

  static generateChineseLearningRecommendations(analysis, targetText) {
    const recommendations = [];
    const textAnalysis = ChineseTextUtils.analyzeTextDifficulty(targetText);
    
    // HSK level recommendation using config
    if (textAnalysis.maxHSK > 3 && analysis.overallAccuracy < config.SCORING.GOOD_THRESHOLD) {
      recommendations.push({
        type: 'difficulty',
        message: config.RECOMMENDATIONS.DIFFICULTY[`hsk${Math.max(1, textAnalysis.maxHSK - 1)}`] || config.RECOMMENDATIONS.DIFFICULTY.hsk3,
        priority: 'medium'
      });
    }

    // Tone-specific recommendations using config
    const toneIssues = analysis.words.filter(w => w.details?.tone < 60);
    if (toneIssues.length > 0) {
      recommendations.push({
        type: 'tone_practice',
        message: config.RECOMMENDATIONS.TONE.high,
        priority: 'high'
      });
    }

    return recommendations;
  }

  // Include remaining methods with similar optimizations...
  // This shows the structure - you would continue with other methods

  static async mockSpeechRecognition(audioBuffer, expectedText, analysisId, audioValidation) {
    if (audioValidation.isEmpty || !audioValidation.quality.hasContent) {
      console.warn(`⚠️ [${analysisId}] Poor audio quality detected - simulating transcription failure`);
      return {
        transcript: '',
        confidence: 0.1,
        words: []
      };
    }
    
    const variations = ChineseTextUtils.generatePronunciationVariations(expectedText);
    const selectedVariation = variations[Math.floor(Math.random() * variations.length)];
    
    const audioQualityFactor = audioValidation.quality.confidence || 0.3;
    const adjustedConfidence = Math.max(0.1, selectedVariation.confidence * audioQualityFactor);
    
    let finalTranscript = selectedVariation.text;
    
    if (audioValidation.quality.rating === 'poor') {
      if (Math.random() < 0.4) {
        finalTranscript = finalTranscript.substring(0, Math.floor(finalTranscript.length * 0.7));
      }
    }
    
    const transcriptionResult = {
      transcript: finalTranscript,
      confidence: adjustedConfidence,
      words: ChineseTextUtils.segmentChineseText(expectedText).map((segment, index) => ({
        word: segment,
        startTime: index * 0.5,
        endTime: (index + 1) * 0.5,
        confidence: Math.max(0.1, (0.7 + Math.random() * 0.3) * audioQualityFactor)
      }))
    };

    return transcriptionResult;
  }

  static analyzeWord(word, transcriptionResult, index, audioValidation, fullText) {
    const confidence = transcriptionResult.confidence || 0.8;
    const isCorrect = this.isWordCorrect(word, transcriptionResult.transcript, index);
    
    const toneScore = this.analyzeTone(word, confidence);
    const pronunciationScore = this.analyzePronunciation(word, isCorrect);
    const fluencyScore = this.analyzeFluency(transcriptionResult, index, audioValidation);
    
    const weights = config.SCORING;
    const overallScore = (toneScore * weights.TONE_WEIGHT + 
                         pronunciationScore * weights.PRONUNCIATION_WEIGHT + 
                         fluencyScore * weights.FLUENCY_WEIGHT);
    
    const contextBonus = ChineseTextUtils.getContextualBonus(fullText, word, index);
    const finalScore = Math.min(100, overallScore + contextBonus);
    
    return {
      word,
      score: Math.round(finalScore),
      details: {
        tone: Math.round(toneScore),
        pronunciation: Math.round(pronunciationScore),
        fluency: Math.round(fluencyScore),
        confidence: Math.round(confidence * 100)
      },
      issues: this.identifyIssues(toneScore, pronunciationScore, fluencyScore),
      feedback: this.generateWordFeedback(word, finalScore, {
        tone: toneScore,
        pronunciation: pronunciationScore,
        fluency: fluencyScore
      }),
      contextBonus: contextBonus,
      chineseSpecific: {
        hskLevel: ChineseTextUtils.getHSKLevel(word),
        strokeComplexity: ChineseTextUtils.getStrokeComplexity(word),
        toneInfo: ChineseTextUtils.getToneInfo(word)
      }
    };
  }

  static calculateOverallAccuracy(expected, actual, audioValidation) {
    if (!actual) return 0;
    
    const expectedSegments = ChineseTextUtils.segmentChineseText(expected);
    const actualSegments = ChineseTextUtils.segmentChineseText(actual);
    
    let matches = 0;
    const minLength = Math.min(expectedSegments.length, actualSegments.length);
    
    for (let i = 0; i < minLength; i++) {
      if (expectedSegments[i] === actualSegments[i]) matches++;
    }
    
    const segmentAccuracy = expectedSegments.length > 0 ? (matches / expectedSegments.length) * 100 : 0;
    
    const qualityPenalty = config.SCORING.AUDIO_QUALITY_PENALTIES[audioValidation.quality.rating] || 0.5;
    
    return Math.round(segmentAccuracy * qualityPenalty);
  }

  static generateRecommendations(analysis, audioValidation) {
    const recommendations = [];
    
    if (analysis.overallAccuracy < config.SCORING.GOOD_THRESHOLD) {
      const level = analysis.overallAccuracy < config.SCORING.FAIR_THRESHOLD ? 'high' : 'medium';
      recommendations.push({
        type: 'accuracy',
        message: config.RECOMMENDATIONS.ACCURACY[level],
        priority: level
      });
    }

    const problematicWords = analysis.words.filter(w => w.score < 60);
    if (problematicWords.length > 0) {
      recommendations.push({
        type: 'words',
        message: `Focus on these characters: ${problematicWords.map(w => w.word).join(', ')}`,
        priority: 'medium'
      });
    }

    const toneIssues = analysis.words.filter(w => w.details.tone < 60);
    if (toneIssues.length > 0) {
      recommendations.push({
        type: 'tone',
        message: config.RECOMMENDATIONS.TONE.high,
        priority: 'high'
      });
    }

    recommendations.push({
      type: 'audio',
      message: config.RECOMMENDATIONS.AUDIO_QUALITY[audioValidation.quality.rating],
      priority: audioValidation.quality.rating === 'poor' ? 'high' : 'medium'
    });

    return recommendations;
  }

  static calculateHallucinationPenalty(hallucination) {
    const { severity, overlapRatio, lengthRatio, detected } = hallucination;
    const thresholds = config.HALLUCINATION_THRESHOLDS;
    
    if (!detected) {
      return { multiplier: 1.0, shouldZeroOut: false };
    }

    if (severity === 'high' || overlapRatio === 0 || lengthRatio > thresholds.HIGH_SEVERITY_LENGTH_RATIO) {
      return { 
        multiplier: 0.0, 
        shouldZeroOut: true,
        reason: `Severe hallucination detected (overlap: ${(overlapRatio * 100).toFixed(1)}%, length ratio: ${lengthRatio.toFixed(1)}x)`
      };
    }
    
    if (severity === 'medium' || overlapRatio < thresholds.HIGH_SEVERITY_OVERLAP || lengthRatio > thresholds.MEDIUM_SEVERITY_LENGTH_RATIO) {
      return { 
        multiplier: 0.1, 
        shouldZeroOut: false,
        reason: `Medium hallucination detected (overlap: ${(overlapRatio * 100).toFixed(1)}%, length ratio: ${lengthRatio.toFixed(1)}x)`
      };
    }
    
    return { 
      multiplier: 0.5, 
      shouldZeroOut: false,
      reason: `Low hallucination detected (overlap: ${(overlapRatio * 100).toFixed(1)}%, length ratio: ${lengthRatio.toFixed(1)}x)`
    };
  }

  static applyHallucinationPenalty(word, penalty, hallucination) {
    if (penalty.shouldZeroOut) {
      return {
        ...word,
        score: 0,
        details: {
          ...word.details,
          tone: 0,
          pronunciation: 0,
          fluency: 0,
          confidence: Math.round(word.details.confidence * 0.1)
        },
        feedback: `❌ Audio analysis failed: ${penalty.reason}. Please try recording again with clearer speech.`,
        issues: ['hallucination', 'transcription_error'],
        hallucinationPenalty: penalty
      };
    } else {
      const adjustedScore = Math.max(0, Math.round(word.score * penalty.multiplier));
      const adjustedTone = Math.max(0, Math.round(word.details.tone * penalty.multiplier));
      const adjustedPronunciation = Math.max(0, Math.round(word.details.pronunciation * penalty.multiplier));
      const adjustedFluency = Math.max(0, Math.round(word.details.fluency * penalty.multiplier));
      
      return {
        ...word,
        score: adjustedScore,
        details: {
          ...word.details,
          tone: adjustedTone,
          pronunciation: adjustedPronunciation,
          fluency: adjustedFluency,
          confidence: Math.round(word.details.confidence * penalty.multiplier)
        },
        feedback: `⚠️ ${penalty.reason}. Scores reduced. Try speaking more clearly.`,
        issues: [...(word.issues || []), 'transcription_quality'],
        hallucinationPenalty: penalty
      };
    }
  }

  // Helper methods
  static isWordCorrect(expectedWord, transcript, index) {
    const transcriptSegments = ChineseTextUtils.segmentChineseText(transcript);
    if (!transcript || index >= transcriptSegments.length) return false;
    return transcriptSegments[index] === expectedWord;
  }

  static analyzeTone(word, confidence) {
    const toneInfo = ChineseTextUtils.getToneInfo(word);
    if (!toneInfo) {
      return 60 + Math.random() * 30;
    }

    const baseScore = confidence * 100;
    const difficultyPenalty = toneInfo.difficulty * config.SCORING.TONE_DIFFICULTY_PENALTY;
    
    return Math.max(30, Math.min(100, baseScore - difficultyPenalty + (Math.random() * 20 - 10)));
  }

  static analyzePronunciation(word, isCorrect) {
    return isCorrect ? 75 + Math.random() * 25 : 30 + Math.random() * 40;
  }

  static analyzeFluency(transcriptionResult, wordIndex, audioValidation) {
    const words = transcriptionResult.words || [];
    if (wordIndex >= words.length) return 70;

    const word = words[wordIndex];
    const duration = word.endTime - word.startTime;
    
    const optimal = config.SCORING.OPTIMAL_CHAR_DURATION;
    let fluencyScore = 100;
    
    if (duration < optimal.min) {
      fluencyScore -= 30;
    } else if (duration > optimal.max) {
      fluencyScore -= 20;
    }
    
    fluencyScore *= (word.confidence || 0.8);
    
    const qualityPenalty = config.SCORING.AUDIO_QUALITY_PENALTIES[audioValidation.quality.rating] || 0.5;
    fluencyScore *= qualityPenalty;

    return Math.max(20, Math.min(100, fluencyScore));
  }

  static identifyIssues(toneScore, pronunciationScore, fluencyScore) {
    const issues = [];
    
    if (toneScore < 60) issues.push('tone');
    if (pronunciationScore < 60) issues.push('pronunciation');
    if (fluencyScore < 60) issues.push('fluency');
    
    return issues;
  }

  static generateWordFeedback(word, overallScore, scores) {
    const scoring = config.SCORING;
    
    if (overallScore >= scoring.EXCELLENT_THRESHOLD) {
      return 'Excellent pronunciation! 优秀！';
    } else if (overallScore >= scoring.GOOD_THRESHOLD) {
      return 'Good job! 很好！';
    } else if (overallScore >= scoring.FAIR_THRESHOLD) {
      const issues = [];
      if (scores.tone < 60) issues.push('tone (声调)');
      if (scores.pronunciation < 60) issues.push('pronunciation (发音)');
      if (scores.fluency < 60) issues.push('fluency (流利度)');
      
      return `Need improvement in: ${issues.join(', ')}. 需要改进。`;
    } else {
      return 'Try again. Focus on clarity and tone. 再试一次，注意清晰度和声调。';
    }
  }
}

module.exports = PronunciationAnalyzer; 