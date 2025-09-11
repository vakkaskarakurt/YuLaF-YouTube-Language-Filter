window.DOMService = {
  extractText(element, type) {
    const selectors = window.YT_FILTER_CONFIG.selectors[type === 'video' ? 'title' : type];
    const foundTexts = new Set();

    for (const selector of selectors) {
      const el = element.querySelector(selector);
      if (!el) continue;

      let content = el.getAttribute('title')?.trim() || el.textContent?.trim() || '';
      if (content) foundTexts.add(content);
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
    // Gizlenen tüm içerikleri göster
    document.querySelectorAll('[data-language-filter-hidden]')
      .forEach(el => this.showElement(el));

    // Tüm "checked" attribute’larını temizle
    document.querySelectorAll('[data-language-filter-checked]')
      .forEach(el => el.removeAttribute('data-language-filter-checked'));
  },

  getAllElements(type) {
    const selectors = window.YT_FILTER_CONFIG.selectors[type];
    const elements = document.querySelectorAll(selectors.join(','));

    return Array.from(elements).filter(el =>
      !el.matches('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer') &&
      !el.closest('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer')
    );
  }
};
