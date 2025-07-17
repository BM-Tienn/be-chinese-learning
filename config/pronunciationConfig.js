/**
 * Pronunciation Analysis Configuration
 * Centralized configuration for Chinese pronunciation analysis
 */

module.exports = {
  // Audio quality thresholds
  AUDIO_THRESHOLDS: {
    EMPTY_AUDIO_SIZE: 1000,
    SHORT_AUDIO_SIZE: 5000,
    GOOD_AUDIO_SIZE: 50000,
    ESTIMATED_BYTES_PER_SECOND: 32000, // For 16kHz, 16-bit, mono
  },

  // Hallucination detection patterns
  HALLUCINATION_PATTERNS: [
    /thank you/i,
    /please/i,
    /subscribe/i,
    /like and subscribe/i,
    /thank you for watching/i,
    /goodbye/i,
    /hello everyone/i,
    /welcome/i,
    /今天视频就拍到这里啦/i,
    /拜拜/i,
    /谢谢观看/i,
    /下次见/i,
    /关注我/i,
    /点赞/i,
    /分享/i,
    /评论/i
  ],

  // Hallucination severity thresholds
  HALLUCINATION_THRESHOLDS: {
    HIGH_SEVERITY_OVERLAP: 0.2,
    HIGH_SEVERITY_LENGTH_RATIO: 10,
    MEDIUM_SEVERITY_OVERLAP: 0.3,
    MEDIUM_SEVERITY_LENGTH_RATIO: 3,
    SHORT_TEXT_OVERLAP: 0.5,
    SHORT_TEXT_RATIO: 0.3
  },

  // Chinese tone data with pinyin and difficulty
  CHINESE_TONES: {
    '你': { tone: 3, difficulty: 0.2, pinyin: 'nǐ', hsk: 1 },
    '好': { tone: 3, difficulty: 0.3, pinyin: 'hǎo', hsk: 1 },
    '我': { tone: 3, difficulty: 0.1, pinyin: 'wǒ', hsk: 1 },
    '是': { tone: 4, difficulty: 0.3, pinyin: 'shì', hsk: 1 },
    '不': { tone: 4, difficulty: 0.4, pinyin: 'bù', hsk: 1 },
    '的': { tone: 0, difficulty: 0.1, pinyin: 'de', hsk: 1 }, // neutral tone
    '了': { tone: 0, difficulty: 0.2, pinyin: 'le', hsk: 1 },
    '在': { tone: 4, difficulty: 0.2, pinyin: 'zài', hsk: 1 },
    '有': { tone: 3, difficulty: 0.2, pinyin: 'yǒu', hsk: 1 },
    '他': { tone: 1, difficulty: 0.1, pinyin: 'tā', hsk: 1 },
    '她': { tone: 1, difficulty: 0.1, pinyin: 'tā', hsk: 1 },
    '现': { tone: 4, difficulty: 0.3, pinyin: 'xiàn', hsk: 3 },
    '代': { tone: 4, difficulty: 0.2, pinyin: 'dài', hsk: 3 },
    '社': { tone: 4, difficulty: 0.3, pinyin: 'shè', hsk: 3 },
    '会': { tone: 4, difficulty: 0.2, pinyin: 'huì', hsk: 2 },
    '中': { tone: 1, difficulty: 0.1, pinyin: 'zhōng', hsk: 1 },
    '科': { tone: 1, difficulty: 0.2, pinyin: 'kē', hsk: 4 },
    '技': { tone: 4, difficulty: 0.3, pinyin: 'jì', hsk: 4 },
    '影': { tone: 3, difficulty: 0.4, pinyin: 'yǐng', hsk: 5 },
    '响': { tone: 3, difficulty: 0.4, pinyin: 'xiǎng', hsk: 4 },
    '学': { tone: 2, difficulty: 0.2, pinyin: 'xué', hsk: 1 },
    '习': { tone: 2, difficulty: 0.3, pinyin: 'xí', hsk: 1 },
    '工': { tone: 1, difficulty: 0.1, pinyin: 'gōng', hsk: 2 },
    '作': { tone: 4, difficulty: 0.2, pinyin: 'zuò', hsk: 2 },
    '时': { tone: 2, difficulty: 0.2, pinyin: 'shí', hsk: 1 },
    '间': { tone: 1, difficulty: 0.2, pinyin: 'jiān', hsk: 2 },
    '地': { tone: 4, difficulty: 0.2, pinyin: 'dì', hsk: 2 },
    '方': { tone: 1, difficulty: 0.1, pinyin: 'fāng', hsk: 2 }
  },

  // HSK level word groups
  HSK_LEVELS: {
    1: ['你', '好', '我', '是', '不', '的', '了', '在', '有', '他', '她', '中', '学', '时'],
    2: ['会', '工', '作', '间', '地', '方', '现', '以', '为', '上', '下', '去', '来'],
    3: ['现', '代', '社', '其', '实', '理', '解', '问', '题', '什', '么', '样'],
    4: ['科', '技', '响', '经', '济', '发', '展', '环', '境', '保', '护'],
    5: ['影', '响', '深', '刻', '复', '杂', '系', '统', '战', '略', '创', '新'],
    6: ['综', '合', '评', '估', '战', '略', '部', '署', '协', '调', '统', '筹']
  },

  // Common Chinese word compounds
  COMMON_COMPOUNDS: [
    '你好', '谢谢', '再见', '世界', '学习', '中文', '老师', '学生',
    '今天', '明天', '昨天', '天气', '时间', '地方', '朋友', '家人',
    '工作', '学校', '医院', '餐厅', '公司', '银行', '商店', '超市',
    '现代', '社会', '科技', '影响', '经济', '发展', '环境', '保护'
  ],

  // Common pronunciation mistakes for Chinese learners
  COMMON_MISTAKES: {
    '你': ['li', 'ni'], // l/n confusion
    '他': ['da', 'ta'], // d/t confusion  
    '是': ['si', 'shi'], // s/sh confusion
    '中': ['zhong', 'chong'], // zh/ch confusion
    '学': ['xie', 'xue'], // ie/ue confusion
    '说': ['suo', 'shuo'], // uo confusion
    '有': ['yo', 'you'], // missing final u
    '会': ['hui', 'wei'] // h/w confusion
  },

  // Stroke complexity levels
  STROKE_COMPLEXITY: {
    HIGH: {
      chars: ['響', '影', '現', '會', '過', '還', '開', '關', '學', '說'],
      strokes: '15+',
      difficulty: 0.8
    },
    MEDIUM: {
      chars: ['社', '科', '技', '代', '你', '好', '時', '間', '地', '方'],
      strokes: '5-15', 
      difficulty: 0.4
    },
    LOW: {
      chars: ['我', '是', '不', '的', '了', '在', '有', '他', '她', '中'],
      strokes: '1-5',
      difficulty: 0.2
    }
  },

  // Scoring weights and thresholds
  SCORING: {
    TONE_WEIGHT: 0.4,
    PRONUNCIATION_WEIGHT: 0.4,
    FLUENCY_WEIGHT: 0.2,
    EXCELLENT_THRESHOLD: 85,
    GOOD_THRESHOLD: 70,
    FAIR_THRESHOLD: 50,
    OPTIMAL_CHAR_DURATION: { min: 0.3, max: 0.8 }, // seconds
    TONE_DIFFICULTY_PENALTY: 20,
    AUDIO_QUALITY_PENALTIES: {
      poor: 0.5,
      fair: 0.7,
      good: 1.0,
      excellent: 1.0
    }
  },

  // Recommendation messages
  RECOMMENDATIONS: {
    ACCURACY: {
      high: 'Practice basic pronunciation with slower speech',
      medium: 'Focus on individual character pronunciation',
      low: 'Start with basic HSK 1 vocabulary'
    },
    TONE: {
      high: 'Use tone pair exercises to improve tone distinction',
      medium: 'Practice with tone drills and audio examples',
      low: 'Learn basic tone patterns first'
    },
    AUDIO_QUALITY: {
      poor: 'Try recording in a quieter environment or with a better microphone',
      fair: 'Consider improving audio quality for better results',
      good: 'Audio quality is good for analysis'
    },
    DIFFICULTY: {
      hsk1: 'Great! Continue with HSK 1 vocabulary',
      hsk2: 'Consider practicing HSK 1 first for better foundation',
      hsk3: 'This is intermediate level - ensure HSK 2 mastery first',
      hsk4: 'Advanced vocabulary - practice lower levels first',
      hsk5: 'Very advanced - ensure strong foundation in HSK 1-3',
      hsk6: 'Expert level - requires extensive practice'
    }
  },

  // Tone-specific guidance
  TONE_GUIDANCE: {
    0: { name: 'neutral', description: 'Light and quick tone', difficulty: 0.2 },
    1: { name: 'first', description: 'High and flat tone', difficulty: 0.3 },
    2: { name: 'second', description: 'Rising tone', difficulty: 0.4 },
    3: { name: 'third', description: 'Falling then rising tone', difficulty: 0.6 },
    4: { name: 'fourth', description: 'Sharp falling tone', difficulty: 0.4 }
  },

  // Context bonus patterns (tone sandhi, etc.)
  CONTEXTUAL_BONUSES: {
    TONE_SANDHI: {
      '不去': 5, // bù qù -> bú qù
      '不能': 5, // bù néng -> bú néng  
      '不做': 5, // bù zuò -> bú zuò
      '一个': 3, // yī gè -> yí gè (depending on following tone)
      '一天': 3, // yī tiān -> yì tiān
    },
    COMMON_PHRASES: {
      '你好': 5,
      '谢谢': 5,
      '再见': 5,
      '没问题': 5,
      '没关系': 5
    }
  },

  // Quality rating mappings
  QUALITY_RATINGS: {
    EXCELLENT: { min: 90, label: 'excellent' },
    GOOD: { min: 70, label: 'good' },  
    FAIR: { min: 50, label: 'fair' },
    POOR: { min: 0, label: 'poor' }
  }
}; 