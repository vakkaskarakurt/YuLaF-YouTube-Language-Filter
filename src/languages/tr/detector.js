window.LanguageDetectors = window.LanguageDetectors || {};

window.LanguageDetectors.tr = {
  name: 'Türkçe',
  code: 'tr',
  
  detect: async function(text) {
    if (!text || text.length < 3) return false;
    
    // Sadece Chrome API kontrolü
    try {
      if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.detectLanguage) {
        const result = await new Promise((resolve) => {
          chrome.i18n.detectLanguage(text, (result) => {
            resolve(result);
          });
        });
        
        if (result && result.languages && result.languages.length > 0) {
          const topLang = result.languages[0];
          return topLang.language === 'tr' && result.isReliable;
        }
      }
    } catch (error) {
      console.log('Chrome API error:', error);
    }
    
    // API kullanılamıyorsa false döndür
    return false;
  }
};