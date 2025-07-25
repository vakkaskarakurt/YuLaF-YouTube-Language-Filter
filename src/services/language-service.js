window.LanguageService = {
  async detectLanguage(text) {
    if (!text || text.length < window.YT_FILTER_CONFIG.detection.minLength) {
      return Promise.resolve(false); // Çok kısa metinleri İngilizce kabul etme
    }
    
    // ASCII olmayan karakterler varsa false
    if (/[^\x00-\x7F]/.test(text)) {
      return Promise.resolve(false);
    }
    
    // Chrome API kullanmaya çalış, hata olursa fallback
    try {
      // Chrome objesi bile yoksa
      if (typeof chrome === 'undefined' || !chrome.i18n) {
        return Promise.resolve(false); // API yoksa güvenli tarafta kal
      }
      
      return await new Promise((resolve, reject) => {
        // 1 saniye timeout
        const timeoutId = setTimeout(() => {
          reject(new Error('Timeout'));
        }, 1000);
        
        chrome.i18n.detectLanguage(text, result => {
          clearTimeout(timeoutId);

          // console.log(text);
          // console.log('Language detection result:', result);
          
          // SONUÇ YOKSA İNGİLİZCE KABUL ETME
          if (!result?.languages?.length) {
            resolve(false); // false = İngilizce değil, gizle
            return;
          }
          
          const topLang = result.languages[0];
          const isEnglish = topLang.language.startsWith('en');
          
          if (!result.isReliable && topLang.percentage < window.YT_FILTER_CONFIG.detection.threshold * 100) {
            resolve(false); // Güvenilmez sonuçları da gizle
          } else {
            resolve(isEnglish);
          }
        });
      });
    } catch (error) {
      // Herhangi bir hata olursa güvenli tarafta kal (gizle)
      return Promise.resolve(false);
    }
  }
};