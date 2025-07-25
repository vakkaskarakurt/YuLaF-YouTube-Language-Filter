window.DOMService = {
  extractText(element, type) {
    const selectors = window.YT_FILTER_CONFIG.selectors[type === 'video' ? 'title' : type];
    
    let text = '';
    for (const selector of selectors) {
      const el = element.querySelector(selector);
      if (el) {
        let content = '';
        // Önce title attribute'u kontrol et
        if (el.hasAttribute('title')) {
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
    
    return text.trim();
  },

  hideElement(element, type) {
    element.style.display = 'none';
    element.setAttribute('data-english-filter-hidden', type);
  },

  showElement(element) {
    element.style.visibility = '';
    element.style.opacity = '';
    element.style.display = '';
    element.removeAttribute('data-english-filter-hidden');
  },

  showAllHiddenContent() {
    document.querySelectorAll('[data-english-filter-hidden]').forEach(el => {
      this.showElement(el);
      el.removeAttribute('data-english-filter-checked');
    });
  },

  getAllElements(type) {
    const selectors = window.YT_FILTER_CONFIG.selectors[type];
    const elements = Array.from(document.querySelectorAll(selectors.join(',')));
    
    // Ad elementlerini filtrele
    return elements.filter(element => {
      return !element.matches('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer') &&
             !element.closest('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer');
    });
  }
};