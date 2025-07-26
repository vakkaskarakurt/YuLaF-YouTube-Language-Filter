window.LanguageService = {
  selectedLanguages: ['en'],
  
  setLanguages(langCodes) {
    // Array'i filtrele ve sadece mevcut dedektörleri tut
    this.selectedLanguages = langCodes.filter(code => 
      window.LanguageDetectors && window.LanguageDetectors[code]
    );
    
    // En az bir dil olmalı
    if (this.selectedLanguages.length === 0) {
      this.selectedLanguages = ['en'];
    }
    
    return this.selectedLanguages.length > 0;
  },
  
  async detectLanguage(text) {
    if (!text || text.length < window.YT_FILTER_CONFIG.detection.minLength) {
      return false;
    }
    
    // Seçili dillerden herhangi biri ile eşleşme var mı kontrol et
    for (const langCode of this.selectedLanguages) {
      const detector = window.LanguageDetectors[langCode];
      if (detector) {
        try {
          const isMatch = await detector.detect(text);
          if (isMatch) {
            return true; // Herhangi bir dil eşleşirse true döndür
          }
        } catch (error) {
          console.error(`Language detection error for ${langCode}:`, error);
        }
      }
    }
    
    return false; // Hiçbir dil eşleşmezse false
  }
};