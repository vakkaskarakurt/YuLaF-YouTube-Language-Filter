(function() {
    'use strict';

    const MIN_TEXT_LENGTH = 20;
    const VIDEO_SELECTORS = [
        'ytd-video-renderer',
        'ytd-grid-video-renderer',
        'ytd-compact-video-renderer',
        'ytd-rich-item-renderer'
    ];

    let processedVideos = new Set();
    let preferredLang = 'eng';

    // Load preferred language from Chrome storage (default: eng)
    if (chrome?.storage?.local) {
        chrome.storage.local.get(['preferredLang'], (result) => {
            if (result.preferredLang) {
                preferredLang = result.preferredLang;
            }
        });
    }

    function init() {
        console.log('YouTube Language Filter: Loaded');
        processAllVideos();
        observePageChanges();
        observeUrlChanges();
    }

    function processAllVideos() {
        VIDEO_SELECTORS.forEach(selector => {
            document.querySelectorAll(selector).forEach(video => processVideo(video));
        });
    }

    function processVideo(videoElement) {
        try {
            const videoId = getVideoId(videoElement);
            if (!videoId || processedVideos.has(videoId)) return;

            const textContent = extractVideoText(videoElement);
            if (!textContent || textContent.length < MIN_TEXT_LENGTH) return;

            const detectedLanguage = detectLanguage(textContent);

            if (!isPreferredLanguage(detectedLanguage)) {
                hideVideo(videoElement, detectedLanguage);
            } else {
                showVideo(videoElement);
            }

            processedVideos.add(videoId);
        } catch (error) {
            console.error('YouTube Language Filter: Error processing video:', error);
        }
    }

    function getVideoId(videoElement) {
        const link = videoElement.querySelector('a[href*="/watch?v="]');
        if (link) {
            const match = link.href.match(/[?&]v=([^&]+)/);
            return match ? match[1] : null;
        }
        return videoElement.getBoundingClientRect().top + '_' + videoElement.getBoundingClientRect().left;
    }

    function extractVideoText(videoElement) {
        const texts = [];

        const title = videoElement.querySelector('#video-title, h3 a');
        if (title) texts.push(title.textContent.trim());

        const desc = videoElement.querySelector('#description-text');
        if (desc) texts.push(desc.textContent.trim());

        const channel = videoElement.querySelector('#channel-name, #text a');
        if (channel) texts.push(channel.textContent.trim());

        const metas = videoElement.querySelectorAll('.ytd-video-meta-block span, #metadata-line span');
        metas.forEach(meta => {
            const text = meta.textContent.trim();
            if (text.length > 3) texts.push(text);
        });

        return texts.join(' ');
    }

    function detectLanguage(text) {
        try {
            if (typeof franc === 'undefined') return 'unknown';
            const clean = text.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
            if (clean.length < MIN_TEXT_LENGTH) return 'unknown';
            const lang = franc(clean);
            console.log('Detected:', lang, 'for:', clean.slice(0, 100));
            return lang;
        } catch (e) {
            console.error('Detection error:', e);
            return 'unknown';
        }
    }

    function isPreferredLanguage(lang) {
        if (!lang || lang === 'und' || lang === 'unknown') return true;
        return lang.toLowerCase() === preferredLang;
    }

    function hideVideo(el, lang) {
        el.style.display = 'none';
        el.setAttribute('data-yef-hidden', 'true');
        el.setAttribute('data-yef-language', lang);
        console.log('Hidden video with language:', lang);
    }

    function showVideo(el) {
        el.style.display = '';
        el.removeAttribute('data-yef-hidden');
        el.removeAttribute('data-yef-language');
    }

    function observePageChanges() {
        const observer = new MutationObserver(() => {
            processAllVideos();
        });

        const target = document.querySelector('ytd-app, #content') || document.body;
        observer.observe(target, { childList: true, subtree: true });

        console.log('Observer running...');
    }

    function observeUrlChanges() {
        let currentUrl = location.href;
        const origPush = history.pushState;
        const origReplace = history.replaceState;

        history.pushState = function() {
            origPush.apply(history, arguments);
            onUrlChange();
        };
        history.replaceState = function() {
            origReplace.apply(history, arguments);
            onUrlChange();
        };
        window.addEventListener('popstate', onUrlChange);

        function onUrlChange() {
            if (location.href !== currentUrl) {
                currentUrl = location.href;
                console.log('URL changed, reprocessing...');
                processedVideos.clear();
                setTimeout(processAllVideos, 1000);
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
