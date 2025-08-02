window.LanguageService = {
  selectedLanguages: [],
  
  setLanguages(langCodes) {
    // Sadece config'de tanımlı olan dilleri kabul et
    this.selectedLanguages = langCodes.filter(code => 
      window.YT_FILTER_CONFIG.languages[code]
    );
    
    return true;
  },
  
  async detectLanguage(text) {
    if (!text || text.length < window.YT_FILTER_CONFIG.detection.minLength) {
      return false;
    }
    
    // Hiç dil seçili değilse, hiçbir içerik gösterilmez
    if (this.selectedLanguages.length === 0) {
      return false;
    }
    
    try {
      // Universal detector ile kontrol et
      return await window.LanguageDetector.detect(text, this.selectedLanguages);
    } catch (error) {
      console.error('Language detection error:', error);
      return false;
    }
  }
};