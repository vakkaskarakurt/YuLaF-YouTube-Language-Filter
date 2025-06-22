// content.js
let filterEnabled = true;
let observer = null;

// Initialize
chrome.storage.sync.get(['filterEnabled'], function(result) {
  filterEnabled = result.filterEnabled !== false;
  console.log('YouTube English Filter initialized:', filterEnabled);
  if (filterEnabled) {
    startFiltering();
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'toggleFilter') {
    filterEnabled = request.enabled;
    console.log('Filter toggled:', filterEnabled);
    if (filterEnabled) {
      startFiltering();
      filterExistingContent();
    } else {
      stopFiltering();
      showAllContent();
    }
  }
});

// Türkçe karakterleri tespit et
function containsTurkishChars(text) {
  return /[ğĞıİöÖüÜşŞçÇ]/.test(text);
}

// Daha katı İngilizce kontrolü
function isEnglishContent(element) {
  // Tüm text içeriğini al
  const allText = element.textContent || '';
  
  // Video başlığını bul
  const titleElement = element.querySelector('#video-title, #video-title-link, h3.ytd-video-renderer a, span#video-title');
  const title = titleElement ? titleElement.textContent.trim() : '';
  
  // Kanal ismini bul
  const channelElement = element.querySelector('#channel-name, #text.ytd-channel-name, .ytd-channel-name a, #text-container.ytd-channel-name');
  const channelName = channelElement ? channelElement.textContent.trim() : '';
  
  console.log('Checking video:', { title, channelName });
  
  // Türkçe karakter kontrolü
  if (containsTurkishChars(title) || containsTurkishChars(channelName)) {
    console.log('Turkish chars detected, hiding:', title);
    return false;
  }
  
  // Diğer dillerin alfabelerini kontrol et
  const nonEnglishScripts = /[\u0400-\u04FF]|[\u4E00-\u9FFF]|[\u3040-\u309F\u30A0-\u30FF]|[\u0600-\u06FF]|[\u0900-\u097F]|[\u0E00-\u0E7F]|[\u1000-\u109F]|[\u0100-\u017F]|[\u0180-\u024F]/;
  
  if (nonEnglishScripts.test(title) || nonEnglishScripts.test(channelName)) {
    console.log('Non-English script detected, hiding:', title);
    return false;
  }
  
  // Yaygın Türkçe kelimeler
  const turkishWords = /\b(ve|ile|bir|bu|da|de|için|gibi|daha|çok|var|yok|ama|veya|ki|mi|mu|mı|mü|şey|olan|olarak|kadar|sonra|önce|her|bazı|hiç|şimdi|zaman|nasıl|neden|nerede|kim)\b/i;
  
  if (turkishWords.test(title)) {
    console.log('Turkish words detected, hiding:', title);
    return false;
  }
  
  // Başlık boşsa veya çok kısaysa gizle
  if (!title || title.length < 3) {
    return false;
  }
  
  // İngilizce kelime kontrolü
  const englishWords = /\b(the|and|or|of|to|in|is|it|that|this|was|for|on|with|as|at|by|from|up|about|into|after|all|also|an|another|any|are|be|been|but|can|could|did|do|does|each|few|get|got|had|has|have|he|her|here|him|his|how|if|its|just|know|let|like|made|make|many|may|me|might|more|most|much|must|my|new|no|not|now|only|other|our|out|over|said|same|see|she|should|so|some|such|than|their|them|then|there|these|they|think|through|too|under|use|very|want|way|we|well|what|when|where|which|while|who|will|with|would|year|years|your)\b/i;
  
  const englishMatches = title.match(englishWords);
  if (!englishMatches || englishMatches.length < 2) {
    console.log('Not enough English words, hiding:', title);
    return false;
  }
  
  // Varsayılan olarak İngilizce kabul et
  return true;
}

function hideVideo(element) {
  element.style.display = 'none';
  element.setAttribute('data-english-filter-hidden', 'true');
  console.log('Video hidden');
}

function showVideo(element) {
  element.style.display = '';
  element.removeAttribute('data-english-filter-hidden');
}

function filterExistingContent() {
  console.log('Filtering existing content...');
  
  // Tüm video renderer tiplerini bul
  const videoSelectors = [
    'ytd-video-renderer',
    'ytd-rich-item-renderer',
    'ytd-grid-video-renderer', 
    'ytd-compact-video-renderer',
    'ytd-rich-grid-media',
    'ytd-media-renderer'
  ];
  
  let totalVideos = 0;
  let hiddenVideos = 0;
  
  videoSelectors.forEach(selector => {
    const videos = document.querySelectorAll(selector);
    videos.forEach(video => {
      totalVideos++;
      if (!isEnglishContent(video)) {
        hideVideo(video);
        hiddenVideos++;
      }
    });
  });
  
  console.log(`Filtered ${hiddenVideos} out of ${totalVideos} videos`);
}

function showAllContent() {
  console.log('Showing all content...');
  const hiddenVideos = document.querySelectorAll('[data-english-filter-hidden="true"]');
  hiddenVideos.forEach(video => {
    showVideo(video);
  });
}

function startFiltering() {
  console.log('Starting filter...');
  
  if (observer) {
    observer.disconnect();
  }
  
  observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) { // Element node
          const videoSelectors = [
            'ytd-video-renderer',
            'ytd-rich-item-renderer',
            'ytd-grid-video-renderer',
            'ytd-compact-video-renderer',
            'ytd-rich-grid-media',
            'ytd-media-renderer'
          ];
          
          // Direkt node kontrolü
          videoSelectors.forEach(selector => {
            if (node.matches && node.matches(selector)) {
              if (!isEnglishContent(node)) {
                hideVideo(node);
              }
            }
          });
          
          // Alt elementleri kontrol et
          if (node.querySelectorAll) {
            videoSelectors.forEach(selector => {
              const videos = node.querySelectorAll(selector);
              videos.forEach(video => {
                if (!isEnglishContent(video)) {
                  hideVideo(video);
                }
              });
            });
          }
        }
      });
    });
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Initial filter
  setTimeout(() => {
    filterExistingContent();
  }, 1000);
  
  // Re-filter periodically for dynamic content
  setInterval(() => {
    if (filterEnabled) {
      filterExistingContent();
    }
  }, 3000);
}

function stopFiltering() {
  console.log('Stopping filter...');
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

// Start immediately if enabled
if (filterEnabled) {
  console.log('Auto-starting filter...');
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startFiltering);
  } else {
    startFiltering();
  }
}