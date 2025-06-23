class VideoFilter {
    constructor() {
        this.processedVideos = new Set();
        this.extractor = window.YouTubeVideoExtractor;
        this.detector = window.YouTubeLanguageDetector;
    }

    hideVideo(link) {
        const selectors = window.YouTubeFilterConfig.SELECTORS;
        const container = link.closest(selectors.containers.join(', '));
        
        if (container) {
            container.style.display = 'none';
            return true;
        }
        return false;
    }

    shouldHideVideo(videoData) {
        const { videoId, title } = videoData;
        
        if (!videoId || this.processedVideos.has(videoId)) {
            return false;
        }
        
        this.processedVideos.add(videoId);
        
        if (!title) return false;
        
        return !this.detector.isTargetLanguage(title);
    }

    processVideo(link) {
        const videoData = this.extractor.getVideoData(link);
        
        if (this.shouldHideVideo(videoData)) {
            return this.hideVideo(link);
        }
        
        return false;
    }

    filterVideos() {
        if (!this.detector.isReady()) return 0;
        
        const videoLinks = document.querySelectorAll(
            window.YouTubeFilterConfig.SELECTORS.videoLinks
        );
        
        let hiddenCount = 0;
        
        for (const link of videoLinks) {
            if (this.processVideo(link)) {
                hiddenCount++;
            }
        }
        
        if (hiddenCount > 0) {
            console.log(`🚫 Hidden ${hiddenCount} non-English videos`);
        }
        
        return hiddenCount;
    }
}

window.YouTubeVideoFilter = new VideoFilter();