const BaseSpeechProvider = require('./baseSpeechProvider');

class AzureSpeechProvider extends BaseSpeechProvider {
  constructor(config) {
    super(config);
  }

  validateConfig() {
    super.validateConfig();
    if (!this.config.subscriptionKey) {
      throw new Error('Azure Speech subscription key not configured');
    }
  }

  async analyzeAudio(audioBuffer, targetText, options = {}) {
    const analysisId = options.analysisId || `azure_${Date.now()}`;
    
    console.log(`🔵 [${analysisId}] Azure Speech provider - Not yet implemented`);
    
    // For now, return a placeholder result
    // In future implementation, integrate with Azure Cognitive Services Speech SDK
    throw new Error('Azure Speech provider not yet implemented. Please use OpenAI Whisper or Google Speech.');
  }
}

module.exports = AzureSpeechProvider; 