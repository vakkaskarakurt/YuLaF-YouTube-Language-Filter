window.LanguageDetector = {
  name: 'Universal Language Detector',
  
  // Character set validators for different languages
  characterValidators: {
    // East Asian
    'ja': /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/, // Hiragana, Katakana, Kanji
    'ko': /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/, // Hangul
    'zh': /[\u4E00-\u9FAF]/, // Chinese characters
    'zh-cn': /[\u4E00-\u9FAF]/,
    'zh-tw': /[\u4E00-\u9FAF]/,
    
    // Cyrillic
    'ru': /[\u0400-\u04FF]/, // Russian Cyrillic
    'uk': /[\u0400-\u04FF]/, // Ukrainian Cyrillic
    'bg': /[\u0400-\u04FF]/, // Bulgarian Cyrillic
    'sr': /[\u0400-\u04FF]/, // Serbian Cyrillic
    'mk': /[\u0400-\u04FF]/, // Macedonian Cyrillic
    'be': /[\u0400-\u04FF]/, // Belarusian Cyrillic
    
    // Arabic script
    'ar': /[\u0600-\u06FF\u0750-\u077F]/, // Arabic
    'fa': /[\u0600-\u06FF\u0750-\u077F]/, // Persian/Farsi
    'ur': /[\u0600-\u06FF\u0750-\u077F]/, // Urdu
    
    // Greek
    'el': /[\u0370-\u03FF]/, // Greek
    
    // Hebrew
    'he': /[\u0590-\u05FF]/, // Hebrew
    
    // Thai
    'th': /[\u0E00-\u0E7F]/, // Thai
    
    // Devanagari (Hindi and related)
    'hi': /[\u0900-\u097F]/, // Hindi
    'ne': /[\u0900-\u097F]/, // Nepali
    'mr': /[\u0900-\u097F]/, // Marathi
    
    // Tamil
    'ta': /[\u0B80-\u0BFF]/, // Tamil
    
    // Telugu
    'te': /[\u0C00-\u0C7F]/, // Telugu
    
    // Kannada
    'kn': /[\u0C80-\u0CFF]/, // Kannada
    
    // Malayalam
    'ml': /[\u0D00-\u0D7F]/, // Malayalam
    
    // Gujarati
    'gu': /[\u0A80-\u0AFF]/, // Gujarati
    
    // Bengali
    'bn': /[\u0980-\u09FF]/, // Bengali
    
    // Armenian
    'hy': /[\u0530-\u058F]/, // Armenian
    
    // Georgian
    'ka': /[\u10A0-\u10FF]/, // Georgian
    
    // Amharic
    'am': /[\u1200-\u137F]/, // Ethiopic
  },
  
  // Helper function to check if text contains characters for a specific language
  hasLanguageCharacters: function(text, languageCode) {
    const validator = this.characterValidators[languageCode];
    if (!validator) {
      // If no specific validator, assume Latin-based language (no validation needed)
      return true;
    }
    return validator.test(text);
  },
  
  // Pre-check if text could possibly match any target language based on characters
  couldMatchTargetLanguages: function(text, targetLanguages) {
    return targetLanguages.some(targetLang => {
      // If language has no specific character validator, it could match (Latin-based)
      if (!this.characterValidators[targetLang]) {
        return true;
      }
      // Check if text contains required characters for this language
      return this.hasLanguageCharacters(text, targetLang);
    });
  },
  
  detect: async function(text, targetLanguages, strictMode = true) {
    if (!text || text.length < 3) return false;
    
    // İlk karakter kontrolü - API çağrısından önce
    if (!this.couldMatchTargetLanguages(text, targetLanguages)) {
      return false;
    }
    
    try {
      if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.detectLanguage) {
        const result = await new Promise((resolve) => {
          chrome.i18n.detectLanguage(text, (result) => {
            resolve(result);
          });
        });
        
        if (result && result.languages && result.languages.length > 0) {
          const topLanguage = result.languages[0];
          
          // Strict Mode kontrolü
          if (strictMode && !result.isReliable) {
            return false;
          }
          
          // Dil eşleşmesi
          return targetLanguages.some(targetLang => {
            const isMatch = topLanguage.language === targetLang || 
                           topLanguage.language.startsWith(targetLang + '-') ||
                           (topLanguage.language.includes('-') && 
                            topLanguage.language.split('-')[0] === targetLang);
            
            // Detected language character validation
            if (isMatch) {
              console.log(text)
              const detectedLang = topLanguage.language;
              const baseLang = detectedLang.includes('-') ? detectedLang.split('-')[0] : detectedLang;
              
              // Check if detected language has specific character requirements
              if (!this.hasLanguageCharacters(text, detectedLang) && 
                  !this.hasLanguageCharacters(text, baseLang)) {
                return false;
              }
            }
            
            return isMatch;
          });
        }
      }
    } catch (error) {
      console.log('Chrome detectLanguage API error:', error);
    }
    
    return false;
  }
};