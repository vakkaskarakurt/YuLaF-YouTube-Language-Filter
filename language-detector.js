class LanguageDetector {
    constructor() {
        this.isInitialized = false;
        this.targetLanguage = window.YouTubeFilterConfig.CONFIG.targetLanguage;
    }

    init() {
        if (typeof eld === 'undefined') {
            console.error('❌ ELD Library not loaded');
            return false;
        }

        console.log('✅ ELD Language Detector ready');
        console.log('📊 ELD Info:', eld.info());
        this.isInitialized = true;
        return true;
    }

    isTargetLanguage(text) {
        const { minTitleLength } = window.YouTubeFilterConfig.CONFIG;
        
        if (!text || text.length < minTitleLength) return true;
        if (!this.isInitialized) return true;
        
        try {
            const result = eld.detect(text);
            const detectedLang = result.language;
            const isReliable = result.isReliable();
            
            console.log(`🎯 "${text}" -> ${detectedLang} (reliable: ${isReliable})`);
            
            // Eğer İngilizce değilse gizle (güvenilirlik önemli değil)
            if (detectedLang !== '' && detectedLang !== this.targetLanguage) {
                return false; // İngilizce değil, gizle
            }
            
            // Boş veya belirsizse göster
            return true;
            
        } catch (error) {
            console.error('❌ ELD detection error:', error);
            return true; // Hata durumunda göster
        }
    }

    isReady() {
        return this.isInitialized;
    }
}

window.YouTubeLanguageDetector = new LanguageDetector();