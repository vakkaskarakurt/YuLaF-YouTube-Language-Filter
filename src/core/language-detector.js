class LanguageDetector {
  constructor() {
    this.cache = new Map();
    this.eldLoaded = false;
  }

  async loadELD() {
    return new Promise((resolve, reject) => {
      if (typeof eld !== 'undefined') {
        this.eldLoaded = true;
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('libs/eld.XS60.min.js');
      script.onload = () => {
        console.log('✅ ELD loaded');
        this.eldLoaded = true;
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async detectLanguage(text) {
    if (this.cache.has(text)) {
      return this.cache.get(text);
    }
    
    try {
      if (!this.eldLoaded || typeof eld === 'undefined') {
        console.warn('⚠️ ELD not available');
        this.cache.set(text, 'non-en');
        return 'non-en';
      }
      
      const result = eld.detect(text);
      const language = result.language || 'en';
      const scores = result.getScores();
    
      console.log('Scores:', scores);
      const englishScore = scores['en'] || 0;

      // English minimum score threshold (0.30)
      if (language === 'en' && englishScore < 0.30 ) {
        console.log(`❌ English score too low (${englishScore.toFixed(2)}) for "${text.substring(0, 30)}..."`);
        this.cache.set(text, 'non-en');
        return 'non-en';
      }
      
      console.log(`🌐 ELD detected: ${language} (en_score: ${englishScore.toFixed(2)})`);
      
      this.cache.set(text, language);
      return language;
    } catch (error) {
      console.error('❌ ELD error:', error);
      this.cache.set(text, 'non-en');
      return 'non-en';
    }
  }

  clearCache() {
    this.cache.clear();
  }
}
