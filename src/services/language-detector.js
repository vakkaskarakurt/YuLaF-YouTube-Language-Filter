// src/services/language-detector.js
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
          
          // 🔑 STRICT MODE KONTROLÜ
          if (strictMode && !result.isReliable) {
            return false; // Strict mode'da isReliable zorunlu
          }
          
          // Dil eşleşmesi kontrolü
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