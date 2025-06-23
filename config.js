// Eklenti ayarları ve sabitler
const CONFIG = {
    targetLanguage: 'en',
    initDelay: 500,
    checkDelay: 100,
    scrollDelay: 200,
    initialCheckDelay: 1000,
    minTitleLength: 3,
    minValidTitleLength: 5
};

const SELECTORS = {
    videoLinks: 'a[href*="/watch?v="], a[href*="/shorts/"]',
    containers: [
        'ytd-rich-item-renderer',
        'ytd-video-renderer', 
        'ytd-grid-video-renderer',
        'ytd-reel-item-renderer',
        'ytd-shorts',
        'ytd-compact-video-renderer'
    ],
    titles: [
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
    ]
};

window.YouTubeFilterConfig = { CONFIG, SELECTORS };