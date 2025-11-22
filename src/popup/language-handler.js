export class LanguageHandler {
  constructor(storageManager, uiManager, tab) {
    this.storageManager = storageManager;
    this.uiManager = uiManager;
    this.tab = tab;
    this.languages = {};
    this.currentState = {};
    this.currentSortBy = 'popularity';
  }

  setLanguages(languages) {
    this.languages = languages;
  }

  setCurrentState(state) {
    this.currentState = state;
    this.currentSortBy = state.sortBy || 'popularity';
  }

  createLanguageElement(code, lang) {
    const isChecked = this.currentState.selectedLanguages.includes(code);

    const option = document.createElement('label');
    option.className = 'language-option';
    option.innerHTML = `
      <input type="checkbox" name="language" value="${code}" ${isChecked ? 'checked' : ''}>
      <span class="language-label">
        <span class="flag">${lang.icon}</span>
        <span class="language-text">
          <span class="language-name">${lang.name}</span>
          <span class="language-native">${lang.nativeName}</span>
        </span>
      </span>
    `;

    option.querySelector('input')?.addEventListener('change', (e) => this.handleLanguageChange(e));
    return option;
  }

  renderLanguages(searchTerm = '') {
    const container = document.getElementById('languageOptions');
    if (!container) return;
    container.innerHTML = '';

    if (Object.keys(this.languages).length > 0) container.classList.add('expanded');

    // Top 14 most popular languages: English, Turkish, then 12 others
    const top14Languages = [
      'en', 'tr', 'es', 'zh', 'hi', 'ar', 'pt', 'ru', 'ja', 'fr',
      'de', 'ko', 'it', 'id'
    ];

    const term = searchTerm.toLowerCase();

    // Filter languages to show only top 14
    const filtered = Object.entries(this.languages)
      .filter(([code, lang]) => {
        // Only show top 14 languages
        if (!top14Languages.includes(code)) return false;

        // Apply search filter if exists
        return !term ||
          lang.name.toLowerCase().includes(term) ||
          lang.nativeName.toLowerCase().includes(term) ||
          code.toLowerCase().includes(term);
      });

    // Sort by popularity order (selected items first, then by top14Languages order)
    filtered.sort(([aCode, aLang], [bCode, bLang]) => {
      const aSel = this.currentState.selectedLanguages.includes(aCode);
      const bSel = this.currentState.selectedLanguages.includes(bCode);
      if (aSel !== bSel) return aSel ? -1 : 1;

      const aIdx = top14Languages.indexOf(aCode);
      const bIdx = top14Languages.indexOf(bCode);
      return aIdx - bIdx;
    });

    filtered.forEach(([code, lang]) => container.appendChild(this.createLanguageElement(code, lang)));
    this.uiManager.updateSelectedCount(this.currentState.selectedLanguages.length);
  }

  async handleLanguageChange(e) {
    const code = e.target.value;
    const selected = [...this.currentState.selectedLanguages];

    this.currentState.selectedLanguages = e.target.checked
      ? [...new Set([...selected, code])]
      : selected.filter(lang => lang !== code);

    this.uiManager.updateSelectedCount(this.currentState.selectedLanguages.length);

    // ✨ Seçim yaptıktan sonra arama kutusunu temizle ve listeyi yenile
    this.clearSearchAndRefresh();

    try {
      await this.storageManager.saveState(
        { selectedLanguages: this.currentState.selectedLanguages },
        this.tab,
        true
      );
    } catch (err) {
      console.error('Error updating languages:', err);
      chrome.tabs.reload(this.tab.id);
    }
  }

  // 🆕 Arama kutusunu temizle ve listeyi yenile
  clearSearchAndRefresh() {
    const searchInput = document.getElementById('languageSearch');
    if (searchInput) {
      searchInput.value = ''; // Arama kutusunu temizle
    }
    
    // Tüm dilleri tekrar göster (arama filtresi olmadan)
    this.renderLanguages('');
  }

  async ensureLanguagesLoaded() {
    if (Object.keys(this.languages).length === 0) {
      const langs = await this.storageManager.loadLanguages(this.tab);
      this.setLanguages(langs);
      this.renderLanguages();
    }
  }

  handleSearchInput(e) {
    const container = document.getElementById('languageOptions');
    if (!container.classList.contains('expanded')) {
      container.classList.add('expanded', 'force-open');
      document.body.classList.add('language-expanded');
    }
    this.renderLanguages(e.target.value);
    this.ensureLanguagesLoaded();
  }

  handleSearchFocus() {
    const container = document.getElementById('languageOptions');
    container.classList.add('expanded', 'force-open');
    document.body.classList.add('language-expanded');
    this.ensureLanguagesLoaded();
    if (container.children.length === 0) this.renderLanguages();
  }

  setupEventListeners() {
    const search = document.getElementById('languageSearch');
    if (search) {
      search.addEventListener('input', (e) => this.handleSearchInput(e));
      search.addEventListener('click', () => this.handleSearchFocus());
      search.addEventListener('focus', () => this.handleSearchFocus());
    }
  }
}