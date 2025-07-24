class YouTubeEnglishFilter {
 constructor() {
   this.enabled = true;
   this.settings = { 
     strictMode: true, 
     hideComments: true, 
     hideVideos: true, 
     hideChannels: true,
     useOriginalTitles: true
   };
   this.observer = null;
   this.urlObserver = null;
   this.popstateHandler = null;
   this.originalPushState = null;
   this.originalReplaceState = null;
   this.init();
 }

 async init() {
   const stored = await chrome.storage.sync.get([
     'enabled', 'strictMode', 'hideComments', 'hideVideos', 'hideChannels', 'useOriginalTitles'
   ]);
   
   this.enabled = stored.enabled !== false;
   this.settings.strictMode = stored.strictMode !== false;
   this.settings.hideComments = stored.hideComments !== false;
   this.settings.hideVideos = stored.hideVideos !== false;
   this.settings.hideChannels = stored.hideChannels !== false;
   this.settings.useOriginalTitles = stored.useOriginalTitles !== false;
   
   // Storage değişikliklerini dinle
   chrome.storage.onChanged.addListener((changes, area) => {
     if (area === 'sync' && changes.enabled) {
       this.enabled = changes.enabled.newValue;
       if (this.enabled) {
         this.startFiltering();
       } else {
         this.stopFiltering();
       }
     }
   });
   
   if (this.enabled) {
     this.startFiltering();
   }
 }

 // YouTube'un çeviri özelliğini devre dışı bırak ve orijinal başlıkları geri yükle
 restoreOriginalTitles() {
   if (!this.settings.useOriginalTitles) return;

   try {
     // Ana video sayfasındaysa
     if (window.location.href.includes('/watch?')) {
       this.restoreCurrentVideoTitle();
     }
     
     // Tüm video elementlerini güncelle
     this.restoreVideoListTitles();
   } catch (error) {
     console.warn('Error restoring original titles:', error);
   }
 }

 restoreCurrentVideoTitle() {
   try {
     if (window.ytInitialData && window.ytInitialPlayerResponse) {
       const originalTitle = window.ytInitialPlayerResponse.videoDetails?.title;
       const originalDescription = window.ytInitialPlayerResponse.videoDetails?.shortDescription;
       
       if (originalTitle && window.ytInitialData.contents?.twoColumnWatchNextResults?.results?.results?.contents) {
         const contents = window.ytInitialData.contents.twoColumnWatchNextResults.results.results.contents;
         
         // Başlığı geri yükle
         if (contents[0]?.videoPrimaryInfoRenderer?.title) {
           contents[0].videoPrimaryInfoRenderer.title.simpleText = originalTitle;
         }
         
         // Açıklamayı geri yükle
         if (originalDescription && contents[1]?.videoSecondaryInfoRenderer?.description) {
           contents[1].videoSecondaryInfoRenderer.description.simpleText = originalDescription;
         }
       }
     }
   } catch (error) {
     console.warn('Error restoring current video title:', error);
   }
 }

 restoreVideoListTitles() {
   // Video listelerindeki çevrilmiş başlıkları tespit et ve geri yükle
   document.querySelectorAll('ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer').forEach(videoElement => {
     this.restoreVideoElementTitle(videoElement);
   });
 }

 restoreVideoElementTitle(videoElement) {
   try {
     const titleElement = videoElement.querySelector('#video-title, h3 a, .ytd-video-meta-block #video-title');
     if (!titleElement) return;

     // Video ID'sini al
     const linkElement = videoElement.querySelector('a[href*="/watch?v="]');
     if (!linkElement) return;

     const href = linkElement.getAttribute('href');
     const videoId = new URLSearchParams(href.split('?')[1])?.get('v');
     
     if (videoId && titleElement.hasAttribute('title')) {
       // Eğer title attribute'u varsa, bu genellikle orijinal başlıktır
       const originalTitle = titleElement.getAttribute('title');
       if (originalTitle && originalTitle !== titleElement.textContent.trim()) {
         titleElement.textContent = originalTitle;
       }
     }
   } catch (error) {
     console.warn('Error restoring video element title:', error);
   }
 }

 startFiltering() {
   if (!this.enabled) return;
   
   // Önce mevcut observer'ları temizle
   this.stopFiltering();
   
   this.restoreOriginalTitles();
   this.filterContent();
   
   // ANINDA İŞLEME - Debounce yok
   this.observer = new MutationObserver(mutations => {
     if (!this.enabled) return;
     
     // Yeni eklenen elementleri anında işle
     mutations.forEach(mutation => {
       if (mutation.addedNodes.length > 0) {
         mutation.addedNodes.forEach(node => {
           if (node.nodeType === Node.ELEMENT_NODE) {
             this.processNewNode(node);
           }
         });
       }
     });
   });
   
   this.observer.observe(document.body, { 
     childList: true, 
     subtree: true,
     attributes: false
   });

   // URL değişiklik takibi
   let lastUrl = location.href;
   
   this.urlObserver = new MutationObserver(() => {
     const currentUrl = location.href;
     if (currentUrl !== lastUrl) {
       console.log('��� URL changed:', lastUrl, '->', currentUrl);
       lastUrl = currentUrl;
       
       // URL değişiminde kısa bir gecikme - sayfa yüklenmesi için
       setTimeout(() => {
         if (this.enabled && location.href === currentUrl) {
           console.log('��� Processing after URL change');
           this.restoreOriginalTitles();
           this.filterContent();
         }
       }, 300); // 300ms - daha kısa
     }
   });
   
   this.urlObserver.observe(document, { 
     subtree: true, 
     childList: true 
   });
   
   // History API değişikliklerini yakala
   this.originalPushState = history.pushState;
   this.originalReplaceState = history.replaceState;
   
   history.pushState = (...args) => {
     this.originalPushState.apply(history, args);
     // Direkt işle
     setTimeout(() => {
       if (this.enabled) {
         this.restoreOriginalTitles();
         this.filterContent();
       }
     }, 200);
   };
   
   history.replaceState = (...args) => {
     this.originalReplaceState.apply(history, args);
     // Direkt işle
     setTimeout(() => {
       if (this.enabled) {
         this.restoreOriginalTitles();
         this.filterContent();
       }
     }, 200);
   };
   
   // Popstate eventi (geri/ileri butonları)
   this.popstateHandler = () => {
     setTimeout(() => {
       if (this.enabled) {
         this.restoreOriginalTitles();
         this.filterContent();
       }
     }, 200);
   };
   window.addEventListener('popstate', this.popstateHandler);
 }

 // Yeni fonksiyon - Node'u anında işle
 processNewNode(node) {
   // Video selectors
   const videoSelectors = [
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
   ];
   
   const commentSelectors = ['ytd-comment-thread-renderer', 'ytd-comment-renderer'];
   const channelSelectors = ['ytd-channel-renderer'];
   
   // Ad kontrolü
   const isAd = node.matches && (
     node.matches('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer') ||
     node.closest('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer')
   );
   
   if (isAd) return;
   
   // Video elementiyse anında gizle ve işle
   if (this.settings.hideVideos && videoSelectors.some(selector => node.matches && node.matches(selector))) {
     this.checkElement(node, 'video');
   }
   
   // Comment elementiyse anında gizle ve işle
   if (this.settings.hideComments && commentSelectors.some(selector => node.matches && node.matches(selector))) {
     this.checkElement(node, 'comment');
   }
   
   // Channel elementiyse anında gizle ve işle
   if (this.settings.hideChannels && channelSelectors.some(selector => node.matches && node.matches(selector))) {
     this.checkElement(node, 'channel');
   }
   
   // İçindeki elementleri de kontrol et
   if (node.querySelectorAll) {
     if (this.settings.hideVideos) {
       const innerVideos = node.querySelectorAll(videoSelectors.join(','));
       innerVideos.forEach(video => {
         if (!video.matches('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer') && 
             !video.closest('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer')) {
           this.checkElement(video, 'video');
         }
       });
     }
     
     if (this.settings.hideComments) {
       const innerComments = node.querySelectorAll(commentSelectors.join(','));
       innerComments.forEach(comment => this.checkElement(comment, 'comment'));
     }
     
     if (this.settings.hideChannels) {
       const innerChannels = node.querySelectorAll(channelSelectors.join(','));
       innerChannels.forEach(channel => this.checkElement(channel, 'channel'));
     }
   }
 }

 stopFiltering() {
   // Observer'ları durdur
   if (this.observer) {
     this.observer.disconnect();
     this.observer = null;
   }
   
   if (this.urlObserver) {
     this.urlObserver.disconnect();
     this.urlObserver = null;
   }
   
   // History API'yi geri yükle
   if (this.originalPushState) {
     history.pushState = this.originalPushState;
   }
   
   if (this.originalReplaceState) {
     history.replaceState = this.originalReplaceState;
   }
   
   // Popstate listener'ı kaldır
   if (this.popstateHandler) {
     window.removeEventListener('popstate', this.popstateHandler);
   }
   
   // Gizlenmiş içerikleri göster
   this.showHiddenContent();
 }

 filterContent() {
   if (!this.enabled) return;

   // Gelişmiş selector sistemi - tek kombine selector ile daha performanslı
   const combinedVideoSelector = [
     'ytd-video-renderer',
     'ytd-compact-video-renderer', 
     'ytd-grid-video-renderer',
     'ytd-rich-item-renderer',
     'ytd-reel-item-renderer',
     'ytd-shorts-lockup-view-model',
     'ytm-shorts-lockup-view-model-v2',
     // Ek selectors:
     'ytd-movie-renderer',
     'ytd-playlist-renderer',
     'ytd-radio-renderer',
     'ytd-rich-grid-media',
     'yt-lockup-view-model',
     'ytd-rich-section-renderer'
   ].join(',');

   const commentSelector = [
     'ytd-comment-thread-renderer',
     'ytd-comment-renderer'
   ].join(',');

   const channelSelector = [
     'ytd-channel-renderer'
   ].join(',');

   // Ad filtreleme fonksiyonu
   const isStrictAdElement = (element) => {
     // Element kendisi ad mı? (en hızlı kontrol)
     if (element.matches('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer')) {
       return true;
     }
     // Ad container içinde mi? (daha yavaş, ikinci kontrol)
     return element.closest('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer') !== null;
   };

   if (this.settings.hideVideos) {
     // Tek query ile tüm video elementlerini al ve ad filtresi uygula
     const allVideoElements = Array.from(document.querySelectorAll(combinedVideoSelector));
     const filteredVideoElements = allVideoElements.filter(element => !isStrictAdElement(element));
     const uniqueVideoElements = [...new Set(filteredVideoElements)]; // Duplikat temizliği
     
     uniqueVideoElements.forEach(el => this.checkElement(el, 'video'));
   }
   
   if (this.settings.hideComments) {
     const allCommentElements = Array.from(document.querySelectorAll(commentSelector));
     const filteredCommentElements = allCommentElements.filter(element => !isStrictAdElement(element));
     
     filteredCommentElements.forEach(el => this.checkElement(el, 'comment'));
   }
   
   if (this.settings.hideChannels) {
     const allChannelElements = Array.from(document.querySelectorAll(channelSelector));
     const filteredChannelElements = allChannelElements.filter(element => !isStrictAdElement(element));
     
     filteredChannelElements.forEach(el => this.checkElement(el, 'channel'));
   }
 }

 async checkElement(element, type) {
   if (element.hasAttribute('data-english-filter-checked')) return;
   element.setAttribute('data-english-filter-checked', 'true');

   // Element'i anında gizle
   this.hideElement(element, type);

   // Önce orijinal içeriği geri yükle
   if (this.settings.useOriginalTitles && type === 'video') {
     this.restoreVideoElementTitle(element);
   }

   // Gelişmiş text selectors
   const textSelectors = {
     video: [
       // Öncelikli selectors (en yaygın olanlar önce)
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
     ],
     comment: [
       '#content-text', 
       '.comment-text',
       '#content'
     ],
     channel: [
       '#text',                    
       'ytd-channel-name a',
       '#channel-title',
       'yt-formatted-string',
       'a[href*="/channel/"]',
       'a[href*="/@"]',
       '.ytd-channel-name'
     ]
   };

   let text = '';
   for (const selector of textSelectors[type]) {
     const el = element.querySelector(selector);
     if (el) {
       let content = '';
       if (this.settings.useOriginalTitles && el.hasAttribute('title')) {
         content = el.title.trim();
       }
       if (!content) {
         content = el.textContent?.trim() || '';
       }
       
       if (content) {
         text += content + ' ';
       }
     }
   }

   if (text.trim()) {
     const isEnglish = await this.isEnglishText(text.trim());
     if (isEnglish) {
       // Sadece İngilizce olanları göster
       this.showElement(element);
     } else {
       // İngilizce olmayan için istatistik güncelle
       this.updateStats(type);
     }
   } else {
     // Text bulunamazsa güvenli tarafta kal ve göster
     this.showElement(element);
   }
 }

 isEnglishText(text) {
   if (!text || text.length < 3) return Promise.resolve(true);
   
   // Hızlı İngilizce Kontrolü
   if (/[^\x00-\x7F]/.test(text)) {
      return Promise.resolve(false);
   }
   
   // Chrome dil tespiti
   return new Promise(resolve => {
     try {
       chrome.i18n.detectLanguage(text, result => {
         if (!result?.languages?.length) {
           resolve(true);
           return;
         }
         
         const topLang = result.languages[0];
         const isEnglish = topLang.language.startsWith('en');
         
         if (!result.isReliable && topLang.percentage < 70) {
           resolve(true);
         } else {
           resolve(isEnglish);
         }
       });
     } catch (error) {
       console.warn('Language detection failed:', error);
       resolve(true);
     }
   });
 }

 hideElement(element, type) {
   element.style.display = 'none';
   element.setAttribute('data-english-filter-hidden', type);
 }

 showElement(element) {
   element.style.visibility = '';
   element.style.opacity = '';
   element.style.display = '';
   element.removeAttribute('data-english-filter-hidden');
 }

 updateStats(type) {
   chrome.storage.local.get(['filterStats'], result => {
     const stats = result.filterStats || { videos: 0, comments: 0, channels: 0 };
     stats[type + 's'] = (stats[type + 's'] || 0) + 1;
     chrome.storage.local.set({ filterStats: stats });
   });
 }

 showHiddenContent() {
   document.querySelectorAll('[data-english-filter-hidden]').forEach(el => {
     this.showElement(el);
     // Kontrol flag'ini de temizle
     el.removeAttribute('data-english-filter-checked');
   });
 }

 toggle() {
   this.enabled = !this.enabled;
   chrome.storage.sync.set({ enabled: this.enabled });
   
   if (this.enabled) {
     this.startFiltering();
   } else {
     this.stopFiltering();
   }
   return this.enabled;
 }

 updateSettings(newSettings) {
   Object.assign(this.settings, newSettings);
   chrome.storage.sync.set(newSettings);
   
   if (this.enabled) {
     this.showHiddenContent();
     setTimeout(() => {
       this.restoreOriginalTitles();
       this.filterContent();
     }, 100);
   }
 }
}

// Initialize
const filter = new YouTubeEnglishFilter();

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
 switch (request.action) {
   case 'toggle':
     sendResponse({ enabled: filter.toggle() });
     break;
   case 'updateSettings':
     filter.updateSettings(request.settings);
     sendResponse({ success: true });
     break;
   case 'getStatus':
     sendResponse({ 
       enabled: filter.enabled,
       settings: filter.settings
     });
     break;
 }
});
