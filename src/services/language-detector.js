window.LanguageDetector = {
  name: 'Universal Language Detector',

  // Dil -> karakter kümesi regex haritaları
  characterValidators: {
    // Doğu Asya
    ja: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/, // Hiragana, Katakana, Kanji
    ko: /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/, // Hangul
    zh: /[\u4E00-\u9FAF]/, // Chinese (genel)
    'zh-cn': /[\u4E00-\u9FAF]/,
    'zh-tw': /[\u4E00-\u9FAF]/,

    // Kiril
    ru: /[\u0400-\u04FF]/,
    uk: /[\u0400-\u04FF]/,
    bg: /[\u0400-\u04FF]/,
    sr: /[\u0400-\u04FF]/,
    mk: /[\u0400-\u04FF]/,
    be: /[\u0400-\u04FF]/,

    // Arap alfabeleri
    ar: /[\u0600-\u06FF\u0750-\u077F]/,
    fa: /[\u0600-\u06FF\u0750-\u077F]/,
    ur: /[\u0600-\u06FF\u0750-\u077F]/,

    // Yunan
    el: /[\u0370-\u03FF]/,

    // İbranice
    he: /[\u0590-\u05FF]/,

    // Tayca
    th: /[\u0E00-\u0E7F]/,

    // Devanagari (Hintçe vb.)
    hi: /[\u0900-\u097F]/,
    ne: /[\u0900-\u097F]/,
    mr: /[\u0900-\u097F]/,

    // Dravid dilleri
    ta: /[\u0B80-\u0BFF]/, // Tamil
    te: /[\u0C00-\u0C7F]/, // Telugu
    kn: /[\u0C80-\u0CFF]/, // Kannada
    ml: /[\u0D00-\u0D7F]/, // Malayalam

    // Hint dilleri
    gu: /[\u0A80-\u0AFF]/, // Gujarati
    bn: /[\u0980-\u09FF]/, // Bengali

    // Diğer alfabeler
    hy: /[\u0530-\u058F]/, // Ermenice
    ka: /[\u10A0-\u10FF]/, // Gürcüce
    am: /[\u1200-\u137F]/, // Amharca (Etiyopya)
  },

  // Text belirli bir dilin karakterlerini içeriyor mu?
  hasLanguageCharacters(text, langCode) {
    const validator = this.characterValidators[langCode];
    if (!validator) {
      // Validator yoksa (Latin alfabe vb.), doğrudan doğru kabul et
      return true;
    }
    return validator.test(text);
  },

  // Text hedef dillerden herhangi birine uyabilir mi?
  couldMatchTargetLanguages(text, targetLanguages) {
    return targetLanguages.some(lang => {
      return !this.characterValidators[lang] || this.hasLanguageCharacters(text, lang);
    });
  },

  // Dil tespiti
  async detect(text, targetLanguages, strictMode = true) {
    if (!text || text.length < 3) return false;

    // Ön-eleme (gereksiz API çağrılarını azaltmak için)
    if (!this.couldMatchTargetLanguages(text, targetLanguages)) {
      return false;
    }

    try {
      if (chrome?.i18n?.detectLanguage) {
        const result = await new Promise(resolve => {
          chrome.i18n.detectLanguage(text, resolve);
        });

        if (result?.languages?.length > 0) {
          const top = result.languages[0];

          // Strict mode: güvenilir değilse reddet
          if (strictMode && !result.isReliable) {
            return false;
          }

          // Hedef dillerle eşleşme kontrolü
          return targetLanguages.some(targetLang => {
            const isMatch =
              top.language === targetLang ||
              top.language.startsWith(targetLang + '-') ||
              (top.language.includes('-') && top.language.split('-')[0] === targetLang);

            if (isMatch) {
              // Ek karakter kontrolü (örn. yanlış pozitifleri elemek için)
              const detected = top.language;
              const base = detected.includes('-') ? detected.split('-')[0] : detected;

              if (
                !this.hasLanguageCharacters(text, detected) &&
                !this.hasLanguageCharacters(text, base)
              ) {
                return false;
              }
            }

            return isMatch;
          });
        }
      }
    } catch (err) {
      console.log('Chrome detectLanguage API error:', err);
    }

    return false;
  }
};
