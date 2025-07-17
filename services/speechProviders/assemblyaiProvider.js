const BaseSpeechProvider = require('./baseSpeechProvider');

class AssemblyAIProvider extends BaseSpeechProvider {
  constructor(config) {
    super(config);
  }

  validateConfig() {
    super.validateConfig();
    if (!this.config.apiKey) {
      throw new Error('AssemblyAI API key not configured');
    }
  }

  async analyzeAudio(audioBuffer, targetText, options = {}) {
    const analysisId = options.analysisId || `assemblyai_${Date.now()}`;
    
    console.log(`🟡 [${analysisId}] AssemblyAI provider - Not yet implemented`);
    
    // For now, return a placeholder result
    // In future implementation, integrate with AssemblyAI API
    throw new Error('AssemblyAI provider not yet implemented. Please use OpenAI Whisper or Google Speech.');
  }
}

module.exports = AssemblyAIProvider; 