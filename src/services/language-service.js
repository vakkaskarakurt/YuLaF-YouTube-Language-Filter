window.LanguageService = {
  selectedLanguages: [],
  strictMode: true,
  
  setLanguages(langCodes) {
    this.selectedLanguages = langCodes.filter(code => 
      window.YT_FILTER_CONFIG.languages[code]
    );
    return true;
  },
  
  setStrictMode(enabled) {
    this.strictMode = enabled;
  },
  
  async detectLanguage(text) {
    if (!text || text.length < window.YT_FILTER_CONFIG.detection.minLength) {
      return false;
    }
    
    if (this.selectedLanguages.length === 0) {
      return false;
    }
    
    try {
      return await window.LanguageDetector.detect(text, this.selectedLanguages, this.strictMode);
    } catch (error) {
      console.error('Language detection error:', error);
      return false;
    }
  },

  // Seçili diller ve strictMode'a dayalı deterministik bir imza üretir
  getSelectionSignature() {
    try {
      const sortedLanguages = Array.isArray(this.selectedLanguages)
        ? [...this.selectedLanguages].sort()
        : [];
      const strict = Boolean(this.strictMode);
      return JSON.stringify({ languages: sortedLanguages, strict });
    } catch (error) {
      // Beklenmeyen durumda da stabil bir string döndür
      const fallbackLangs = (this.selectedLanguages || []).join(',');
      return `${this.strictMode ? '1' : '0'}|${fallbackLangs}`;
    }
  }
};