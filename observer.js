class YouTubeObserver {
    constructor() {
        this.filter = window.YouTubeVideoFilter;
        this.config = window.YouTubeFilterConfig.CONFIG;
        this.isProcessing = false;
        this.observer = null;
    }

    checkVideos() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.filter.filterVideos();
        this.isProcessing = false;
    }

    startObserving() {
        // DOM değişikliklerini izle
        this.observer = new MutationObserver(() => {
            setTimeout(() => this.checkVideos(), this.config.checkDelay);
        });

        this.observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });

        // Scroll olayını dinle
        window.addEventListener('scroll', () => {
            setTimeout(() => this.checkVideos(), this.config.scrollDelay);
        });

        // İlk kontrol
        setTimeout(() => this.checkVideos(), this.config.initialCheckDelay);

        console.log('👀 YouTube Observer started');
    }

    stopObserving() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        window.removeEventListener('scroll', this.checkVideos);
        console.log('⏹️ YouTube Observer stopped');
    }
}

window.YouTubeObserver = new YouTubeObserver();