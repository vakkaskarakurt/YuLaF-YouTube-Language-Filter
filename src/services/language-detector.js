window.LanguageDetector = {
  name: 'Universal Language Detector',
  
  detect: async function(text, targetLanguages) {
    if (!text || text.length < 3) return false;
    
    try {
      if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.detectLanguage) {
        const result = await new Promise((resolve) => {
          chrome.i18n.detectLanguage(text, (result) => {
            resolve(result);
          });
        });
        
        if (result && result.languages && result.languages.length > 0 && result.isReliable) {
          // En yüksek güvenilirlik oranına sahip dili kontrol et
          const topLanguage = result.languages[0];
          
          // Seçili diller arasında eşleşme var mı kontrol et
          return targetLanguages.some(targetLang => {
            // Exact match veya prefix match (örn: en-US -> en)
            return topLanguage.language === targetLang || 
                   topLanguage.language.startsWith(targetLang + '-') ||
                   (topLanguage.language.includes('-') && topLanguage.language.split('-')[0] === targetLang);
          });
        }
      }
    } catch (error) {
      console.log('Chrome detectLanguage API error:', error);
    }
    
    return false;
  }
};