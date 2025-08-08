window.LanguageDetector = {
  name: 'Universal Language Detector',
  
  detect: async function(text, targetLanguages, strictMode = true) {
    if (!text || text.length < 3) return false;
    
    try {
      if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.detectLanguage) {
        const result = await new Promise((resolve) => {
          chrome.i18n.detectLanguage(text, (result) => {
            resolve(result);
          });
        });
        
        if (result && result.languages && result.languages.length > 0) {
          const topLanguage = result.languages[0];
          
          // Strict Mode kontrolü - isReliable kontrolü
          if (strictMode && !result.isReliable) {
            return false;
          }
          
          // Threshold kontrolü - confidence değeri varsa eşik kontrolü yap
          const threshold = window.YT_FILTER_CONFIG?.detection?.threshold || 0.7;
          if (topLanguage.confidence !== undefined && topLanguage.confidence < threshold) {
            return false;
          }
          
          // Dil eşleşmesi
          return targetLanguages.some(targetLang => {
            return topLanguage.language === targetLang || 
                   topLanguage.language.startsWith(targetLang + '-') ||
                   (topLanguage.language.includes('-') && 
                    topLanguage.language.split('-')[0] === targetLang);
          });
        }
      }
    } catch (error) {
      console.log('Chrome detectLanguage API error:', error);
    }
    
    return false;
  }
};