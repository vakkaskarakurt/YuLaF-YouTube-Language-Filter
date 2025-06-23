console.log('🚀 YouTube English Filter - LOCAL AI VERSION');

let processedVideos = new Set();
let isProcessing = false;

// ELD library yüklendikten sonra başlat
function initLanguageDetector() {
    if (typeof eld !== 'undefined') {
        console.log('✅ ELD Language Detector ready');
        console.log('📊 ELD Info:', eld.info());
        
        // Sadece İngilizce ve Türkçe odaklı subset (opsiyonel)
        // eld.dynamicLangSubset(['en', 'tr', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh']);
        
        return true;
    } else {
        console.error('❌ ELD Library not loaded');
        return false;
    }
}

function extractVideoId(url) {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
}

function findVideoTitle(videoLink) {
    const container = videoLink.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-reel-item-renderer, ytd-shorts, ytd-compact-video-renderer');
    if (!container) return null;
    
    const titleSelectors = [
        'h3 a[href*="/watch"]',
        'h3 a[href*="/shorts"]',
        '#video-title',
        'yt-formatted-string#video-title',
        'a#video-title-link',
        '.ytd-video-renderer #video-title',
        'span#video-title',
        'h3 span[role="text"]',
        'h3 yt-formatted-string',
        '.ytd-rich-item-renderer h3 a',
        '#video-title-link yt-formatted-string',
        'a[aria-label]'
    ];
    
    for (const selector of titleSelectors) {
        const titleElement = container.querySelector(selector);
        if (titleElement) {
            let title = titleElement.textContent?.trim();
            
            if (!title || title.length <= 5) {
                title = titleElement.getAttribute('aria-label')?.trim();
            }
            
            if (title && title.length > 5) {
                return title;
            }
        }
    }
    
    const linkTitle = videoLink.getAttribute('aria-label');
    if (linkTitle && linkTitle.length > 5) {
        return linkTitle.trim();
    }
    
    return null;
}

// ELD ile dil tespiti
function isEnglish(title) {
    if (!title || title.length < 3) return true;
    if (typeof eld === 'undefined') return true;
    
    try {
        const result = eld.detect(title);
        const detectedLang = result.language;
        const isReliable = result.isReliable();
        
        console.log(`🎯 "${title}" -> ${detectedLang} (reliable: ${isReliable})`);
        
        // Sadece İngilizce olanları göster
        return detectedLang === 'en' || detectedLang === '' || !isReliable;
        
    } catch (error) {
        console.error('❌ ELD detection error:', error);
        return true; // Hata durumunda göster
    }
}

function hideVideo(link) {
    const container = link.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-reel-item-renderer, ytd-shorts, ytd-compact-video-renderer');
    if (container) {
        container.style.display = 'none';
        return true;
    }
    return false;
}

function checkVideos() {
    if (isProcessing || typeof eld === 'undefined') return;
    isProcessing = true;
    
    const videoLinks = document.querySelectorAll('a[href*="/watch?v="], a[href*="/shorts/"]');
    let hidden = 0;
    
    for (const link of videoLinks) {
        let videoId;
        
        if (link.href.includes('/watch?v=')) {
            videoId = extractVideoId(link.href);
        }
        else if (link.href.includes('/shorts/')) {
            const match = link.href.match(/\/shorts\/([^?&\n]+)/);
            videoId = match ? match[1] : null;
        }
        
        if (videoId && !processedVideos.has(videoId)) {
            processedVideos.add(videoId);
            
            const title = findVideoTitle(link);
            if (title && !isEnglish(title)) {
                if (hideVideo(link)) hidden++;
            }
        }
    }
    
    if (hidden > 0) {
        console.log(`🚫 Hidden ${hidden} non-English videos`);
    }
    
    isProcessing = false;
}

// Başlatma - ELD yüklendikten sonra
setTimeout(() => {
    if (initLanguageDetector()) {
        console.log('🎯 Local AI Language Detection ready');
        
        // Observer
        const observer = new MutationObserver(() => {
            setTimeout(checkVideos, 100);
        });

        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });

        // İlk çalıştırma
        setTimeout(checkVideos, 1000);

        // Scroll eventi
        window.addEventListener('scroll', () => {
            setTimeout(checkVideos, 200);
        });

        console.log('✨ Local AI Language Filter loaded!');
    }
}, 500); // ELD'nin yüklenmesi için kısa bekleme