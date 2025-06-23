class VideoExtractor {
    constructor() {
        this.selectors = window.YouTubeFilterConfig.SELECTORS;
    }

    extractVideoId(url) {
        const match = url.match(/[?&]v=([^&]+)/);
        return match ? match[1] : null;
    }

    extractShortsId(url) {
        const match = url.match(/\/shorts\/([^?&\n]+)/);
        return match ? match[1] : null;
    }

    getVideoId(link) {
        if (link.href.includes('/watch?v=')) {
            return this.extractVideoId(link.href);
        } else if (link.href.includes('/shorts/')) {
            return this.extractShortsId(link.href);
        }
        return null;
    }

    findVideoTitle(videoLink) {
        const container = videoLink.closest(this.selectors.containers.join(', '));
        if (!container) return null;
        
        // Başlık selektörlerini dene
        for (const selector of this.selectors.titles) {
            const titleElement = container.querySelector(selector);
            if (titleElement) {
                let title = titleElement.textContent?.trim();
                
                if (!title || title.length <= window.YouTubeFilterConfig.CONFIG.minValidTitleLength) {
                    title = titleElement.getAttribute('aria-label')?.trim();
                }
                
                if (title && title.length > window.YouTubeFilterConfig.CONFIG.minValidTitleLength) {
                    return title;
                }
            }
        }
        
        // Link'in aria-label'ını kontrol et
        const linkTitle = videoLink.getAttribute('aria-label');
        if (linkTitle && linkTitle.length > window.YouTubeFilterConfig.CONFIG.minValidTitleLength) {
            return linkTitle.trim();
        }
        
        return null;
    }

    getVideoData(link) {
        const videoId = this.getVideoId(link);
        const title = this.findVideoTitle(link);
        
        return { videoId, title, link };
    }
}

window.YouTubeVideoExtractor = new VideoExtractor();