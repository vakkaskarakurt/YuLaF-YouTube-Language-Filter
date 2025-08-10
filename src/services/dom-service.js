window.DOMService = {
  extractText(element, type) {
    const selectors = window.YT_FILTER_CONFIG.selectors[type === 'video' ? 'title' : type];
    
    const foundTexts = new Set();

    for (const selector of selectors) {
      const el = element.querySelector(selector);
      if (el) {
        let content = '';
        if (el.hasAttribute('title')) {
          content = el.title.trim();
        }
        if (!content) {
          content = el.textContent?.trim() || '';
        }
        if (content) {
          foundTexts.add(content); // avoids duplicates
        }
      }
    }

    return Array.from(foundTexts).join(' ');
  },

  hideElement(element, type) {
    element.style.display = 'none';
    element.setAttribute('data-language-filter-hidden', type);
  },

  showElement(element) {
    element.style.visibility = '';
    element.style.opacity = '';
    element.style.display = '';
    element.removeAttribute('data-language-filter-hidden');
  },

  showAllHiddenContent() {
    // Gizli içeriği göster
    document.querySelectorAll('[data-language-filter-hidden]').forEach(el => {
      this.showElement(el);
    });
    
    // Tüm checked attribute'ları temizle
    document.querySelectorAll('[data-language-filter-checked]').forEach(el => {
      el.removeAttribute('data-language-filter-checked');
    });
  },

  getAllElements(type) {
    const selectors = window.YT_FILTER_CONFIG.selectors[type];
    const elements = Array.from(document.querySelectorAll(selectors.join(',')));
    
    return elements.filter(element => {
      return !element.matches('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer') &&
             !element.closest('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer');
    });
  }
};