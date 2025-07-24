window.LanguageService = {
  async detectLanguage(text) {
    if (!text || text.length < window.YT_FILTER_CONFIG.detection.minLength) {
      return Promise.resolve(true);
    }
    
    // Hızlı İngilizce Kontrolü - ASCII olmayan karakterler varsa false
    if (/[^\x00-\x7F]/.test(text)) {
      return Promise.resolve(false);
    }
    
    // Chrome dil tespiti
    return new Promise(resolve => {
      try {
        chrome.i18n.detectLanguage(text, result => {
          if (!result?.languages?.length) {
            resolve(true);
            return;
          }
          
          const topLang = result.languages[0];
          const isEnglish = topLang.language.startsWith('en');
          
          if (!result.isReliable && topLang.percentage < window.YT_FILTER_CONFIG.detection.threshold * 100) {
            resolve(true);
          } else {
            resolve(isEnglish);
          }
        });
      } catch (error) {
        console.warn('Language detection failed:', error);
        resolve(true);
      }
    });
  }
};
