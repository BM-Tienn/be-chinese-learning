const config = require('../config/pronunciationConfig');

/**
 * Chinese Text Processing Utilities
 * Contains methods for Chinese text segmentation, analysis, and processing
 */

class ChineseTextUtils {
  
  /**
   * Clean Chinese text - remove non-Chinese characters
   * @param {string} text - Input text
   * @returns {string} - Text with only Chinese characters
   */
  static cleanChineseText(text) {
    return text.replace(/[^\u4e00-\u9fff]/g, '');
  }

  /**
   * Segment Chinese text into words/phrases
   * Uses compound detection for better accuracy until jieba is available
   * @param {string} text - Chinese text to segment
   * @returns {Array<string>} - Array of segmented words/characters
   */
  static segmentChineseText(text) {
    const cleanText = this.cleanChineseText(text);
    if (!cleanText) return [];

    const segments = [];
    let i = 0;

    while (i < cleanText.length) {
      let matched = false;

      // Check for compounds (longest match first)
      for (const compound of config.COMMON_COMPOUNDS.sort((a, b) => b.length - a.length)) {
        if (cleanText.substring(i, i + compound.length) === compound) {
          segments.push(compound);
          i += compound.length;
          matched = true;
          break;
        }
      }

      // If no compound found, add single character
      if (!matched) {
        segments.push(cleanText[i]);
        i++;
      }
    }

    return segments;
  }

  /**
   * Enhanced segmentation that considers word context and frequency
   * @param {string} text - Chinese text to segment
   * @returns {Array<Object>} - Array with word info (text, isCompound, hskLevel)
   */
  static segmentWithMetadata(text) {
    const segments = this.segmentChineseText(text);
    
    return segments.map(segment => {
      const isCompound = segment.length > 1;
      const hskLevel = this.getHSKLevel(segment);
      const difficulty = this.calculateSegmentDifficulty(segment);
      
      return {
        text: segment,
        isCompound,
        hskLevel,
        difficulty,
        length: segment.length
      };
    });
  }

  /**
   * Get HSK level for a character or word
   * @param {string} segment - Chinese character or word
   * @returns {number} - HSK level (1-6) or 0 if unknown
   */
  static getHSKLevel(segment) {
    // For compounds, check if all characters are in same HSK level
    if (segment.length > 1) {
      const charLevels = segment.split('').map(char => this.getCharacterHSKLevel(char));
      return Math.max(...charLevels.filter(level => level > 0)) || 0;
    }
    
    return this.getCharacterHSKLevel(segment);
  }

  /**
   * Get HSK level for individual character
   * @param {string} char - Single Chinese character
   * @returns {number} - HSK level or 0 if unknown
   */
  static getCharacterHSKLevel(char) {
    for (const [level, chars] of Object.entries(config.HSK_LEVELS)) {
      if (chars.includes(char)) {
        return parseInt(level);
      }
    }
    return 0; // Unknown character
  }

  /**
   * Calculate difficulty score for a text segment
   * @param {string} segment - Chinese text segment
   * @returns {number} - Difficulty score 0-1 (higher = more difficult)
   */
  static calculateSegmentDifficulty(segment) {
    if (!segment) return 0;

    let totalDifficulty = 0;
    let charCount = 0;

    for (const char of segment) {
      const toneData = config.CHINESE_TONES[char];
      if (toneData) {
        totalDifficulty += toneData.difficulty;
        charCount++;
      } else {
        // Unknown character - assume medium difficulty
        totalDifficulty += 0.5;
        charCount++;
      }
    }

    // Add complexity bonus for longer words
    const lengthMultiplier = Math.min(1.2, 1 + (segment.length - 1) * 0.1);
    
    return charCount > 0 ? (totalDifficulty / charCount) * lengthMultiplier : 0.5;
  }

  /**
   * Get tone information for a character
   * @param {string} char - Single Chinese character
   * @returns {Object|null} - Tone data or null if not found
   */
  static getToneInfo(char) {
    return config.CHINESE_TONES[char] || null;
  }

  /**
   * Check if text contains common compounds that should be analyzed together
   * @param {string} text - Chinese text
   * @returns {Array<string>} - Found compounds
   */
  static findCompounds(text) {
    const found = [];
    
    for (const compound of config.COMMON_COMPOUNDS.sort((a, b) => b.length - a.length)) {
      if (text.includes(compound)) {
        found.push(compound);
      }
    }
    
    return found;
  }

  /**
   * Estimate overall text difficulty
   * @param {string} text - Chinese text
   * @returns {Object} - Difficulty analysis
   */
  static analyzeTextDifficulty(text) {
    const segments = this.segmentWithMetadata(text);
    
    if (segments.length === 0) {
      return { level: 'unknown', score: 0, details: {} };
    }

    const hskLevels = segments.map(s => s.hskLevel).filter(l => l > 0);
    const avgHSK = hskLevels.length > 0 ? hskLevels.reduce((a, b) => a + b, 0) / hskLevels.length : 0;
    const maxHSK = Math.max(...hskLevels, 0);
    
    const difficulties = segments.map(s => s.difficulty);
    const avgDifficulty = difficulties.reduce((a, b) => a + b, 0) / difficulties.length;
    
    const compounds = segments.filter(s => s.isCompound);
    const unknownChars = segments.filter(s => s.hskLevel === 0);

    let level = 'HSK1';
    if (maxHSK >= 5) level = 'HSK5-6';
    else if (maxHSK >= 4) level = 'HSK4';
    else if (maxHSK >= 3) level = 'HSK3';
    else if (maxHSK >= 2) level = 'HSK2';

    return {
      level,
      score: avgDifficulty,
      avgHSK: Math.round(avgHSK * 10) / 10,
      maxHSK,
      details: {
        totalSegments: segments.length,
        compounds: compounds.length,
        unknownChars: unknownChars.length,
        avgDifficulty: Math.round(avgDifficulty * 100) / 100
      }
    };
  }

  /**
   * Check for contextual pronunciation bonuses (tone sandhi, etc.)
   * @param {string} text - Full text context
   * @param {string} segment - Current segment to check
   * @param {number} position - Position of segment in text
   * @returns {number} - Bonus points (0-10)
   */
  static getContextualBonus(text, segment, position) {
    let bonus = 0;

    // Check tone sandhi patterns
    for (const [pattern, points] of Object.entries(config.CONTEXTUAL_BONUSES.TONE_SANDHI)) {
      if (text.includes(pattern) && pattern.includes(segment)) {
        bonus += points;
      }
    }

    // Check common phrases
    for (const [phrase, points] of Object.entries(config.CONTEXTUAL_BONUSES.COMMON_PHRASES)) {
      if (text.includes(phrase) && phrase.includes(segment)) {
        bonus += points;
      }
    }

    return Math.min(bonus, 10); // Cap at 10 points
  }

  /**
   * Get stroke complexity for a character
   * @param {string} char - Single Chinese character
   * @returns {Object} - Complexity info
   */
  static getStrokeComplexity(char) {
    for (const [level, data] of Object.entries(config.STROKE_COMPLEXITY)) {
      if (data.chars.includes(char)) {
        return {
          level: level.toLowerCase(),
          strokes: data.strokes,
          difficulty: data.difficulty
        };
      }
    }
    
    // Default for unknown characters
    return {
      level: 'medium',
      strokes: '5-15',
      difficulty: 0.4
    };
  }

  /**
   * Check for common pronunciation mistakes
   * @param {string} expected - Expected character
   * @param {string} actual - Actual pronunciation (phonetic)
   * @returns {Array<string>} - List of identified mistakes
   */
  static identifyPronunciationMistakes(expected, actual) {
    const mistakes = [];
    const mistakePatterns = config.COMMON_MISTAKES[expected];
    
    if (mistakePatterns && mistakePatterns.includes(actual.toLowerCase())) {
      mistakes.push(`Common mistake: ${expected} → ${actual}. Practice distinction.`);
    }

    return mistakes;
  }

  /**
   * Generate pronunciation variations for testing
   * @param {string} text - Original Chinese text
   * @returns {Array<Object>} - Variations with confidence scores
   */
  static generatePronunciationVariations(text) {
    const variations = [
      { text: text, confidence: 0.9, type: 'correct' }
    ];

    // Generate variations for each character that has common mistakes
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (config.COMMON_MISTAKES[char]) {
        const mistakes = config.COMMON_MISTAKES[char];
        mistakes.forEach(mistake => {
          variations.push({
            text: text, // Keep original text, but note the mistake
            confidence: 0.3 + Math.random() * 0.4,
            type: 'mistake',
            mistake: { char, expected: char, actual: mistake }
          });
        });
      }
    }

    return variations;
  }

  /**
   * Future: Placeholder for jieba integration
   * @param {string} text - Chinese text
   * @returns {Array<string>} - Segmented words
   */
  static jiebaSegment(text) {
    // TODO: Implement when jieba is available
    // const jieba = require('node-jieba');
    // return jieba.cut(this.cleanChineseText(text));
    
    // Fallback to current method
    return this.segmentChineseText(text);
  }
}

module.exports = ChineseTextUtils; 