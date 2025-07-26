window.YT_FILTER_CONFIG = {
  selectors: {
    video: [
      'ytd-video-renderer',
      'ytd-compact-video-renderer', 
      'ytd-grid-video-renderer',
      'ytd-rich-item-renderer',
      'ytd-reel-item-renderer',
      'ytd-shorts-lockup-view-model',
      'ytm-shorts-lockup-view-model-v2',
      'ytd-movie-renderer',
      'ytd-playlist-renderer',
      'ytd-radio-renderer',
      'ytd-rich-grid-media',
      'yt-lockup-view-model',
      'ytd-rich-section-renderer'
    ],
    channel: [
      'ytd-channel-renderer',
      'ytd-channel-name'
    ],
    title: [
      '#video-title',
      'a#video-title',
      'yt-formatted-string[id="video-title"]',
      '[title]',
      'h3 a[href*="/watch"]',
      'a[href*="/watch"] h3',
      'h3',
      'yt-formatted-string#video-title',
      '#video-title-link',
      'span[dir="auto"]',
      'a[href*="/shorts/"]',
      'a[href*="/playlist"] h3',
      '.ytd-video-meta-block #video-title',
      '#channel-name a',
      '.ytd-channel-name a',
      '#text.ytd-channel-name'
    ]
  },
  detection: {
    threshold: 0.7,
    minLength: 3
  },
  timing: {
    titleRestore: 50,      // 100'den 50'ye düşürüldü
    filterDelay: 100,      // 200'den 100'e düşürüldü
    urlChangeDelay: 150    // 300'den 150'ye düşürüldü
  },
  languages: {
    en: {
      code: 'en',
      name: 'English',
      icon: '🇬🇧',
      enabled: true
    },
    tr: {
      code: 'tr',
      name: 'Türkçe',
      icon: '🇹🇷',
      enabled: true
    }
  }
};