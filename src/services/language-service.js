window.LanguageService = {
  currentLanguage: 'en',
  
  setLanguage(langCode) {
    if (window.LanguageDetectors && window.LanguageDetectors[langCode]) {
      this.currentLanguage = langCode;
      return true;
    }
    return false;
  },
  
  async detectLanguage(text) {
    if (!text || text.length < window.YT_FILTER_CONFIG.detection.minLength) {
      return false;
    }
    
    const detector = window.LanguageDetectors[this.currentLanguage];
    if (!detector) {
      console.error(`No detector found for language: ${this.currentLanguage}`);
      return false;
    }
    
    try {
      return await detector.detect(text);
    } catch (error) {
      console.error('Language detection error:', error);
      return false;
    }
  }
};