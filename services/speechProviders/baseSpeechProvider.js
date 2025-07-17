class BaseSpeechProvider {
  constructor(config) {
    this.config = config;
    this.validateConfig();
  }

  validateConfig() {
    if (!this.config) {
      throw new Error('Provider configuration is required');
    }
    // Override in subclasses for specific validation
  }

  // Abstract method - must be implemented by subclasses
  async analyzeAudio(audioBuffer, targetText, options = {}) {
    throw new Error('analyzeAudio method must be implemented by subclass');
  }

  // Common utility methods
  cleanChineseText(text) {
    return text.replace(/[^\u4e00-\u9fff]/g, '');
  }

  calculateCharacterAccuracy(expected, actual) {
    const cleanExpected = this.cleanChineseText(expected);
    const cleanActual = this.cleanChineseText(actual);

    if (cleanExpected.length === 0) return 0;
    if (cleanActual.length === 0) return 0;

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

  getCommonChineseTones() {
    return {
      // Common characters with their tone information
      '你': { tone: 3, difficulty: 0.2, pinyin: 'nǐ' },
      '好': { tone: 3, difficulty: 0.3, pinyin: 'hǎo' },
      '我': { tone: 3, difficulty: 0.1, pinyin: 'wǒ' },
      '是': { tone: 4, difficulty: 0.3, pinyin: 'shì' },
      '不': { tone: 4, difficulty: 0.4, pinyin: 'bù' },
      '的': { tone: 0, difficulty: 0.1, pinyin: 'de' }, // neutral tone
      '了': { tone: 0, difficulty: 0.2, pinyin: 'le' },
      '在': { tone: 4, difficulty: 0.2, pinyin: 'zài' },
      '现': { tone: 4, difficulty: 0.3, pinyin: 'xiàn' },
      '代': { tone: 4, difficulty: 0.2, pinyin: 'dài' },
      '社': { tone: 4, difficulty: 0.3, pinyin: 'shè' },
      '会': { tone: 4, difficulty: 0.2, pinyin: 'huì' },
      '中': { tone: 1, difficulty: 0.1, pinyin: 'zhōng' },
      '科': { tone: 1, difficulty: 0.2, pinyin: 'kē' },
      '技': { tone: 4, difficulty: 0.3, pinyin: 'jì' },
      '影': { tone: 3, difficulty: 0.4, pinyin: 'yǐng' },
      '响': { tone: 3, difficulty: 0.4, pinyin: 'xiǎng' }
    };
  }

  analyzeToneBasic(char, confidence, isCorrect) {
    const toneInfo = this.getCommonChineseTones()[char];
    
    if (!toneInfo) {
      // Default analysis for unknown characters
      return isCorrect ? 70 + Math.random() * 20 : 40 + Math.random() * 30;
    }

    const baseScore = confidence * 100;
    const difficultyPenalty = toneInfo.difficulty * 20;
    const correctnessBonus = isCorrect ? 20 : -30;
    
    return Math.max(20, Math.min(100, baseScore - difficultyPenalty + correctnessBonus));
  }

  generateStandardRecommendations(accuracy, wordAnalysis, hasAudioIssues = false) {
    const recommendations = [];
    
    // Overall accuracy recommendations
    if (accuracy < 70) {
      recommendations.push({
        type: 'accuracy',
        message: 'Practice speaking more slowly and clearly',
        priority: 'high'
      });
    }

    // Word-specific recommendations
    const problematicWords = wordAnalysis.filter(w => w.score < 60);
    if (problematicWords.length > 0) {
      recommendations.push({
        type: 'words',
        message: `Focus on these characters: ${problematicWords.map(w => w.word).join(', ')}`,
        priority: 'medium'
      });
    }

    // Tone recommendations
    const toneIssues = wordAnalysis.filter(w => w.details && w.details.tone < 60);
    if (toneIssues.length > 0) {
      recommendations.push({
        type: 'tone',
        message: 'Practice tone patterns - very important in Chinese pronunciation!',
        priority: 'high'
      });
    }

    // Pronunciation issues
    const pronunciationIssues = wordAnalysis.filter(w => w.details && w.details.pronunciation < 60);
    if (pronunciationIssues.length > 0) {
      recommendations.push({
        type: 'pronunciation',
        message: 'Focus on clear articulation of consonants and vowels',
        priority: 'medium'
      });
    }

    // Audio quality issues
    if (hasAudioIssues) {
      recommendations.push({
        type: 'audio',
        message: 'Try recording in a quieter environment with better microphone',
        priority: 'low'
      });
    }

    return recommendations;
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

  identifyCommonIssues(pronunciationScore, toneScore, fluencyScore) {
    const issues = [];
    
    if (pronunciationScore < 60) issues.push('pronunciation');
    if (toneScore < 60) issues.push('tone');
    if (fluencyScore < 60) issues.push('fluency');
    
    return issues;
  }

  createStandardResult(accuracy, transcription, wordAnalysis, audioQuality, recommendations, providerName) {
    return {
      overallAccuracy: Math.round(accuracy),
      transcription: transcription,
      words: wordAnalysis,
      audioQuality: audioQuality,
      recommendations: recommendations,
      provider: providerName,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = BaseSpeechProvider; 