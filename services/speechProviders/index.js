const { getActiveServiceConfig } = require('../../config/speechServices');
const OpenAIWhisperProvider = require('./openaiWhisperProvider');
const GoogleSpeechProvider = require('./googleSpeechProvider');
const AzureSpeechProvider = require('./azureSpeechProvider');
const AssemblyAIProvider = require('./assemblyaiProvider');

class SpeechProviderFactory {
  static createProvider(serviceName = null) {
    const { serviceName: activeService, config } = getActiveServiceConfig(serviceName);
    
    switch (activeService) {
      case 'openai_whisper':
        return new OpenAIWhisperProvider(config);
      case 'google':
        return new GoogleSpeechProvider(config);
      case 'azure':
        return new AzureSpeechProvider(config);
      case 'assemblyai':
        return new AssemblyAIProvider(config);
      default:
        throw new Error(`Unsupported speech service: ${activeService}`);
    }
  }

  static async analyzeAudio(audioBuffer, targetText, options = {}) {
    const provider = this.createProvider(options.preferredService);
    
    try {
      console.log(`🎙️ Using speech provider: ${provider.constructor.name}`);
      return await provider.analyzeAudio(audioBuffer, targetText, options);
    } catch (error) {
      console.error(`❌ ${provider.constructor.name} failed:`, error.message);
      
      // Try fallback providers if primary fails
      if (!options.preferredService) {
        const fallbackServices = ['openai_whisper', 'google', 'azure', 'assemblyai'];
        
        for (const fallbackService of fallbackServices) {
          if (fallbackService === provider.constructor.name.toLowerCase().replace('provider', '')) {
            continue; // Skip the failed service
          }
          
          try {
            console.log(`🔄 Trying fallback service: ${fallbackService}`);
            const fallbackProvider = this.createProvider(fallbackService);
            return await fallbackProvider.analyzeAudio(audioBuffer, targetText, options);
          } catch (fallbackError) {
            console.warn(`⚠️ Fallback ${fallbackService} also failed:`, fallbackError.message);
            continue;
          }
        }
      }
      
      throw error;
    }
  }

  static getAvailableProviders() {
    const providers = [];
    
    try {
      const openai = this.createProvider('openai_whisper');
      providers.push('openai_whisper');
    } catch (e) {}
    
    try {
      const google = this.createProvider('google');
      providers.push('google');
    } catch (e) {}
    
    try {
      const azure = this.createProvider('azure');
      providers.push('azure');
    } catch (e) {}
    
    try {
      const assemblyai = this.createProvider('assemblyai');
      providers.push('assemblyai');
    } catch (e) {}
    
    return providers;
  }
}

module.exports = SpeechProviderFactory; 