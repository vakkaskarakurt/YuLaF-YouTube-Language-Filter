window.LanguageService = {
  selectedLanguages: ['en'],
  
  setLanguages(langCodes) {
    // Array'i filtrele ve sadece mevcut dedektörleri tut
    this.selectedLanguages = langCodes.filter(code => 
      window.LanguageDetectors && window.LanguageDetectors[code]
    );
    
    // Boş array da geçerli - hiçbir dil seçili değilse hiçbir içerik gösterilmez
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