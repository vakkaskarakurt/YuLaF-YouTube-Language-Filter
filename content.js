console.log('🚀 YouTube English Filter - FINAL FAST VERSION');

let processedVideos = new Set();
let isProcessing = false;

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
        'h3 span[role="text"]',  // İzlenmiş videolar için
        'h3 yt-formatted-string',  // Alternatif format
        '.ytd-rich-item-renderer h3 a',  // Rich item renderer
        '#video-title-link yt-formatted-string',  // İç yt-formatted-string
        'a[aria-label]'  // Aria-label'dan başlık çekme
    ];
    
    for (const selector of titleSelectors) {
        const titleElement = container.querySelector(selector);
        if (titleElement) {
            let title = titleElement.textContent?.trim();
            
            // Eğer başlık bulunamadıysa aria-label'ı dene
            if (!title || title.length <= 5) {
                title = titleElement.getAttribute('aria-label')?.trim();
            }
            
            if (title && title.length > 5) {
                return title;
            }
        }
    }
    
    // Son çare: Link'in kendisindeki aria-label
    const linkTitle = videoLink.getAttribute('aria-label');
    if (linkTitle && linkTitle.length > 5) {
        return linkTitle.trim();
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
    const container = link.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-reel-item-renderer, ytd-shorts, ytd-compact-video-renderer');
    if (container) {
        container.style.display = 'none';
        return true;
    }
    return false;
}

function checkVideos() {
    if (isProcessing) return;
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
            console.log(`🔍 Video: "${title}" - English: ${title ? isEnglish(title) : 'No title'}`);
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