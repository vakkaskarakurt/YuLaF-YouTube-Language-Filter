window.LanguageDetectors = window.LanguageDetectors || {};

window.LanguageDetectors.en = {
  name: 'English',
  code: 'en',
  
  detect: async function(text) {
    if (!text || text.length < 3) return false;
    
    // Hızlı ASCII kontrolü
    const hasNonAscii = /[^\x00-\x7F]/.test(text);
    if (hasNonAscii) {
      // ASCII olmayan karakterler var, daha detaylı kontrol yap
      const allowedNonAscii = /[àáäâèéëêìíïîòóöôùúüûñç]/i;
      const cleanedText = text.replace(allowedNonAscii, '');
      
      // Temizlenmiş metinde hala ASCII olmayan karakter varsa
      if (/[^\x00-\x7F]/.test(cleanedText)) {
        return false;
      }
    }
    
    // Chrome API kontrolü
    try {
      if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.detectLanguage) {
        const result = await new Promise((resolve) => {
          chrome.i18n.detectLanguage(text, (result) => {
            resolve(result);
          });
        });
        
        if (result && result.languages && result.languages.length > 0) {
          const topLang = result.languages[0];
          return topLang.language.startsWith('en') && 
                 (result.isReliable || topLang.percentage > 70);
        }
      }
    } catch (error) {
      console.log('Chrome API error, using fallback');
    }
    
    // Fallback: Basit İngilizce kelime kontrolü
    const commonEnglishWords = /\b(the|be|to|of|and|a|in|that|have|I|it|for|not|on|with|he|as|you|do|at|this|but|his|by|from|they|we|say|her|she|or|an|will|my|one|all|would|there|their|what|so|up|out|if|about|who|get|which|go|me|when|make|can|like|time|no|just|him|know|take|people|into|year|your|good|some|could|them|see|other|than|then|now|look|only|come|its|over|think|also|back|after|use|two|how|our|work|first|well|way|even|new|want|because|any|these|give|day|most|us)\b/i;
    
    const matches = text.match(commonEnglishWords);
    return matches && matches.length >= 2;
  }
};