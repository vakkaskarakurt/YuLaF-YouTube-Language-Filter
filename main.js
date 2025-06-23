class YouTubeEnglishFilter {
    constructor() {
        this.detector = window.YouTubeLanguageDetector;
        this.observer = window.YouTubeObserver;
        this.config = window.YouTubeFilterConfig.CONFIG;
    }

    async init() {
        console.log('🚀 YouTube English Filter - LOCAL AI VERSION');
        
        // ELD kütüphanesinin yüklenmesini bekle
        await this.waitForELD();
        
        if (this.detector.init()) {
            console.log('🎯 Local AI Language Detection ready');
            
            this.observer.startObserving();
            console.log('✨ Local AI Language Filter loaded!');
            
            return true;
        }
        
        console.error('❌ Failed to initialize language detector');
        return false;
    }

    waitForELD() {
        return new Promise((resolve) => {
            const checkELD = () => {
                if (typeof eld !== 'undefined') {
                    resolve();
                } else {
                    setTimeout(checkELD, 100);
                }
            };
            checkELD();
        });
    }

    destroy() {
        this.observer.stopObserving();
        console.log('🔄 YouTube English Filter destroyed');
    }
}

// Başlat
setTimeout(() => {
    const filter = new YouTubeEnglishFilter();
    filter.init();
    
    // Global erişim için
    window.YouTubeEnglishFilterApp = filter;
}, window.YouTubeFilterConfig.CONFIG.initDelay);