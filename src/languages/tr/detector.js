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
          
          // Türkçe karakterler varsa ve API da Türkçe diyorsa
          if (hasTurkishChars && isTurkish) {
            return true;
          }
          
          // API güvenilir ve Türkçe diyorsa
          if (isTurkish && (result.isReliable || topLang.percentage > 70)) {
            return true;
          }
        }
      }
    } catch (error) {
      console.log('Chrome API error, using fallback');
    }
    
    // Fallback: Türkçe kelime kontrolü
    const commonTurkishWords = /\b(ve|bir|bu|da|ne|için|ile|var|mı|mi|mu|mü|çok|daha|gibi|kadar|olan|ama|şey|ben|sen|biz|siz|onlar|değil|ki|ya|ise|hem|sonra|şu|her|bazı|hiç|böyle|şöyle|nasıl|neden|niçin|kim|kimin|nerede|hangi|bütün|tüm|başka|yeni|eski|büyük|küçük|uzun|kısa|iyi|kötü|güzel|çirkin)\b/i;
    
    // Türkçe ekleri
    const turkishSuffixes = /(lar|ler|dan|den|tan|ten|ın|in|un|ün|nın|nin|nun|nün|ım|im|um|üm|sın|sin|sun|sün|ız|iz|uz|üz|sınız|siniz|sunuz|sünüz|yor|iyor|uyor|üyor|ecek|acak|mış|miş|muş|müş|dı|di|du|dü|tı|ti|tu|tü)$/i;
    
    if (hasTurkishChars) {
      return true;
    }
    
    const wordMatches = text.match(commonTurkishWords);
    const suffixMatches = text.match(turkishSuffixes);
    
    return (wordMatches && wordMatches.length >= 2) || 
           (suffixMatches && suffixMatches.length >= 1);
  }
};