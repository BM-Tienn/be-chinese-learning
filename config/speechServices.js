require('dotenv').config();

const speechServicesConfig = {
  // Primary service selection
  primaryService: process.env.SPEECH_PRIMARY_SERVICE || 'openai_whisper', // 'google', 'azure', 'openai_whisper', 'assemblyai'
  
  // Fallback services in order of preference
  fallbackServices: ['openai_whisper', 'google', 'azure'],
  
  // Google Cloud Speech-to-Text
  google: {
    enabled: process.env.GOOGLE_SPEECH_ENABLED === 'true',
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Path to service account JSON
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    config: {
      encoding: 'WEBM_OPUS', // or 'LINEAR16', 'MP3', 'FLAC'
      sampleRateHertz: 16000,
      languageCode: 'zh-CN', // Chinese (Simplified)
      alternativeLanguageCodes: ['zh-TW'], // Traditional Chinese as alternative
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true,
      enableWordConfidence: true,
      // Pronunciation assessment features
      enablePronunciationAssessment: true,
      pronunciationAssessmentConfig: {
        referenceTranscript: '', // Will be set dynamically
        gradingSystem: 'HundredMark',
        granularity: 'Word'
      }
    }
  },

  // Azure Cognitive Services Speech
  azure: {
    enabled: process.env.AZURE_SPEECH_ENABLED === 'true',
    subscriptionKey: process.env.AZURE_SPEECH_KEY,
    region: process.env.AZURE_SPEECH_REGION || 'eastus',
    config: {
      SpeechRecognitionLanguage: 'zh-CN',
      OutputFormat: 'detailed',
      // Pronunciation Assessment
      PronunciationAssessment: {
        ReferenceText: '', // Will be set dynamically
        GradingSystem: 'HundredMark',
        Granularity: 'Word',
        Dimension: 'Comprehensive', // Accuracy, Fluency, Completeness
        EnableMiscue: true
      }
    }
  },

  // OpenAI Whisper
  openai_whisper: {
    enabled: process.env.OPENAI_API_KEY ? true : false,
    apiKey: process.env.OPENAI_API_KEY,
    model: 'whisper-1',
    config: {
      language: 'zh', // Chinese
      temperature: 0.0, // For more consistent results
      response_format: 'verbose_json', // Get word-level timestamps
      timestamp_granularities: ['word']
    }
  },

  // AssemblyAI
  assemblyai: {
    enabled: process.env.ASSEMBLYAI_API_KEY ? true : false,
    apiKey: process.env.ASSEMBLYAI_API_KEY,
    config: {
      language_code: 'zh',
      punctuate: true,
      format_text: true,
      word_boost: [], // Can add domain-specific words
      boost_param: 'default',
      // Audio intelligence features
      speaker_labels: false,
      speakers_expected: 1,
      sentiment_analysis: false,
      entity_detection: false,
      // Custom vocabulary for Chinese learning
      custom_spelling: []
    }
  },

  // Common settings
  common: {
    maxRetries: 3,
    retryDelay: 1000, // ms
    timeout: 30000, // 30 seconds
    supportedFormats: ['wav', 'mp3', 'webm', 'ogg', 'flac'],
    maxFileSize: 25 * 1024 * 1024, // 25MB
    
    // Chinese-specific pronunciation features
    toneAnalysis: true,
    pinyinGeneration: true,
    traditionalSimplifiedMapping: true,
    
    // Scoring thresholds
    scoreThresholds: {
      excellent: 90,
      good: 75,
      fair: 60,
      needsImprovement: 40
    },

    // Common Chinese pronunciation challenges for foreigners
    commonIssues: {
      tones: ['tone_1', 'tone_2', 'tone_3', 'tone_4', 'neutral_tone'],
      initials: ['zh', 'ch', 'sh', 'r', 'j', 'q', 'x'],
      finals: ['ü', 'ang', 'eng', 'ong', 'uang', 'iong'],
      aspiratedPairs: [['p', 'b'], ['t', 'd'], ['k', 'g'], ['q', 'j'], ['ch', 'zh'], ['c', 'z']]
    }
  }
};

// Validation function
function validateConfig() {
  const errors = [];
  
  if (!speechServicesConfig.primaryService) {
    errors.push('Primary speech service not specified');
  }

  // Check if at least one service is configured
  const enabledServices = Object.keys(speechServicesConfig)
    .filter(key => key !== 'primaryService' && key !== 'fallbackServices' && key !== 'common')
    .filter(service => speechServicesConfig[service].enabled);

  if (enabledServices.length === 0) {
    errors.push('No speech services are enabled. Please configure at least one service.');
  }

  // Service-specific validation
  if (speechServicesConfig.google.enabled && !speechServicesConfig.google.keyFile) {
    errors.push('Google Speech service enabled but GOOGLE_APPLICATION_CREDENTIALS not set');
  }

  if (speechServicesConfig.azure.enabled && !speechServicesConfig.azure.subscriptionKey) {
    errors.push('Azure Speech service enabled but AZURE_SPEECH_KEY not set');
  }

  if (speechServicesConfig.openai_whisper.enabled && !speechServicesConfig.openai_whisper.apiKey) {
    errors.push('OpenAI Whisper service enabled but OPENAI_API_KEY not set');
  }

  if (speechServicesConfig.assemblyai.enabled && !speechServicesConfig.assemblyai.apiKey) {
    errors.push('AssemblyAI service enabled but ASSEMBLYAI_API_KEY not set');
  }

  return errors;
}

// Get active service configuration
function getActiveServiceConfig(serviceName = null) {
  const targetService = serviceName || speechServicesConfig.primaryService;
  
  if (!speechServicesConfig[targetService] || !speechServicesConfig[targetService].enabled) {
    // Try fallback services
    for (const fallbackService of speechServicesConfig.fallbackServices) {
      if (speechServicesConfig[fallbackService] && speechServicesConfig[fallbackService].enabled) {
        console.log(`⚠️ Primary service '${targetService}' not available, using fallback: ${fallbackService}`);
        return {
          serviceName: fallbackService,
          config: speechServicesConfig[fallbackService]
        };
      }
    }
    throw new Error(`No available speech services configured`);
  }

  return {
    serviceName: targetService,
    config: speechServicesConfig[targetService]
  };
}

module.exports = {
  speechServicesConfig,
  validateConfig,
  getActiveServiceConfig
}; 