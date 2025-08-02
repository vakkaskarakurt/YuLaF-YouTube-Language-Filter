window.LanguageDetectors = window.LanguageDetectors || {};

window.LanguageDetectors.tr = {
  name: 'Türkçe',
  code: 'tr',
  
  detect: async function(text) {
    if (!text || text.length < 3) return false;
    
    // Türkçe karakterler kontrolü
    const turkishChars = /[çğıöşüÇĞİÖŞÜ]/;
    const hasTurkishChars = turkishChars.test(text);
    
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
          const isTurkish = topLang.language === 'tr';
          
          // API güvenilir ve Türkçe diyorsa
          if (isTurkish && (result.isReliable || topLang.percentage > 70)) {
            return true;
          }
        }
      }
    } catch (error) {
      console.log('Chrome API error, using fallback');
    }
    
    // ⭐ KATILIAŞTIRILMIŞ FALLBACK KONTROL
    const commonTurkishWords = /\b(ve|bir|bu|da|ne|için|ile|var|mı|mi|mu|mü|çok|daha|gibi|kadar|olan|ama|şey|ben|sen|biz|siz|onlar|değil|ki|ya|ise|hem|sonra|şu|her|bazı|hiç|böyle|şöyle|nasıl|neden|niçin|kim|kimin|nerede|hangi|bütün|tüm|başka|yeni|eski|büyük|küçük|uzun|kısa|iyi|kötü|güzel|çirkin|olan|oldu|olur|olsun|olan|yapıyor|yapmak|gelmek|gidiyor|aldım|verdi|getir)\b/ig;
    
    const turkishSuffixes = /(lar|ler|dan|den|tan|ten|ın|in|un|ün|nın|nin|nun|nün|ım|im|um|üm|sın|sin|sun|sün|ız|iz|uz|üz|sınız|siniz|sunuz|sünüz|yor|iyor|uyor|üyor|ecek|acak|mış|miş|muş|müş|dı|di|du|dü|tı|ti|tu|tü)(\s|$)/ig;
    
    // Kelime sayıları
    const wordMatches = text.match(commonTurkishWords) || [];
    const suffixMatches = text.match(turkishSuffixes) || [];
    const totalWords = text.split(/\s+/).length;
    
    // ⭐ SIKI KURALLAR
    if (hasTurkishChars) {
      // Türkçe karakter var ama yeteri kadar Türkçe kelime/ek var mı?
      const turkishWordRatio = (wordMatches.length + suffixMatches.length) / totalWords;
      
      // En az %40'ı Türkçe olmalı VE en az 2 Türkçe kelime/ek olmalı
      return turkishWordRatio >= 0.4 && (wordMatches.length + suffixMatches.length) >= 2;
    }
    
    // Türkçe karakter yoksa, çok güçlü Türkçe kelime varlığı gerekli
    return wordMatches.length >= 3 && suffixMatches.length >= 1;
  }
};