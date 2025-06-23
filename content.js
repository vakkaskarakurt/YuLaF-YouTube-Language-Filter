console.log('🚀 YouTube English Filter - FINAL FAST VERSION');

let processedVideos = new Set();
let isProcessing = false;

function extractVideoId(url) {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
}

function findVideoTitle(videoLink) {
    const container = videoLink.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer');
    if (!container) return null;
    
    const titleSelectors = [
        'h3 a[href*="/watch"]',
        '#video-title',
        'yt-formatted-string#video-title',
        'a#video-title-link',
        '.ytd-video-renderer #video-title'
    ];
    
    for (const selector of titleSelectors) {
        const titleElement = container.querySelector(selector);
        if (titleElement) {
            const title = titleElement.textContent?.trim();
            if (title && title.length > 5) {
                return title;
            }
        }
    }
    return null;
}

function isEnglish(title) {
    if (!title || title.length < 3) return true;
    
    const englishPattern = /^[a-zA-Z0-9\s\.,!?'"()\-:;&@#$%\|\[\]{}\/\\*+=_~`]+$/;
    const hasNonEnglishChars = /[çğıöşü]|[àáâãäåæ]|[èéêë]|[ìíîï]|[ñ]|[òóôõö]|[ùúûü]|[ý]|[а-я]|[α-ω]|[一-龯]|[가-힣]/i.test(title);
    
    return englishPattern.test(title) && !hasNonEnglishChars;
}

function hideVideo(link) {
    const container = link.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer');
    if (container) {
        container.style.display = 'none';
        return true;
    }
    return false;
}

function checkVideos() {
    if (isProcessing) return;
    isProcessing = true;
    
    const videoLinks = document.querySelectorAll('a[href*="/watch?v="]');
    let hidden = 0;
    
    for (const link of videoLinks) {
        const videoId = extractVideoId(link.href);
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

// Hızlı ve sürekli tarama
const observer = new MutationObserver(() => {
    setTimeout(checkVideos, 100); // Çok hızlı
});

observer.observe(document.body, { 
    childList: true, 
    subtree: true 
});

// İlk çalıştırma
setTimeout(checkVideos, 1000);

// Scroll'da da çalıştır
window.addEventListener('scroll', () => {
    setTimeout(checkVideos, 200);
});

console.log('✨ Fast English Filter loaded!');