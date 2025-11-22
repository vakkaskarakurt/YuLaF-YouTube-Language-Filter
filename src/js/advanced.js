// Advanced Settings Page Controller

class AdvancedSettings {
  constructor() {
    this.languages = {};
    this.selectedLanguages = [];
    this.strictMode = true;
    this.init();
  }

  async init() {
    try {
      // Load all languages from config
      if (window.YT_FILTER_CONFIG && window.YT_FILTER_CONFIG.languages) {
        this.languages = { ...window.YT_FILTER_CONFIG.languages };
      }

      // Load current state from storage
      const result = await chrome.storage.sync.get(['selectedLanguages', 'strictMode']);
      this.selectedLanguages = result.selectedLanguages || [];
      this.strictMode = result.strictMode !== undefined ? result.strictMode : true;

      // Update UI
      this.updateStrictModeToggle();
      this.renderLanguages();
      this.setupEventListeners();
    } catch (err) {
      console.error('Advanced settings init error:', err);
    }
  }

  updateStrictModeToggle() {
    const toggle = document.getElementById('strictModeToggle');
    if (toggle) {
      toggle.checked = this.strictMode;
    }
  }

  renderLanguages(searchTerm = '') {
    const container = document.getElementById('languageOptions');
    if (!container) return;

    container.innerHTML = '';

    const term = searchTerm.toLowerCase();
    const filtered = Object.entries(this.languages).filter(([code, lang]) =>
      !term ||
      lang.name.toLowerCase().includes(term) ||
      lang.nativeName.toLowerCase().includes(term) ||
      code.toLowerCase().includes(term)
    );

    // Sort by selection status first, then alphabetically
    filtered.sort(([aCode, aLang], [bCode, bLang]) => {
      const aSel = this.selectedLanguages.includes(aCode);
      const bSel = this.selectedLanguages.includes(bCode);
      if (aSel !== bSel) return aSel ? -1 : 1;
      return aLang.name.localeCompare(bLang.name);
    });

    filtered.forEach(([code, lang]) => {
      const option = this.createLanguageElement(code, lang);
      container.appendChild(option);
    });

    this.updateSelectedCount();
  }

  createLanguageElement(code, lang) {
    const isChecked = this.selectedLanguages.includes(code);

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

  async handleLanguageChange(e) {
    const code = e.target.value;

    if (e.target.checked) {
      if (!this.selectedLanguages.includes(code)) {
        this.selectedLanguages.push(code);
      }
    } else {
      this.selectedLanguages = this.selectedLanguages.filter(lang => lang !== code);
    }

    this.updateSelectedCount();

    // Save to storage
    try {
      await chrome.storage.sync.set({ selectedLanguages: this.selectedLanguages });

      // Reload YouTube tabs
      const tabs = await chrome.tabs.query({ url: '*://*.youtube.com/*' });
      tabs.forEach(tab => chrome.tabs.reload(tab.id));
    } catch (err) {
      console.error('Error saving language selection:', err);
    }
  }

  async handleStrictModeChange(e) {
    this.strictMode = e.target.checked;

    try {
      await chrome.storage.sync.set({ strictMode: this.strictMode });

      // Reload YouTube tabs
      const tabs = await chrome.tabs.query({ url: '*://*.youtube.com/*' });
      tabs.forEach(tab => chrome.tabs.reload(tab.id));
    } catch (err) {
      console.error('Error saving strict mode:', err);
    }
  }

  handleSearch(e) {
    this.renderLanguages(e.target.value);
  }

  handleBackButton() {
    window.close();
  }

  updateSelectedCount() {
    const countEl = document.getElementById('selectedCount');
    if (countEl) {
      countEl.textContent = this.selectedLanguages.length;
    }
  }

  setupEventListeners() {
    // Strict mode toggle
    const strictToggle = document.getElementById('strictModeToggle');
    if (strictToggle) {
      strictToggle.addEventListener('change', (e) => this.handleStrictModeChange(e));
    }

    // Search input
    const searchInput = document.getElementById('languageSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.handleSearch(e));
    }

    // Back button
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.handleBackButton());
    }
  }
}

// Wait for config to load, then initialize
function waitForConfig() {
  if (window.YT_FILTER_CONFIG) {
    new AdvancedSettings();
  } else {
    // Load config script first
    const script = document.createElement('script');
    script.src = '../utils/config.js';
    script.onload = () => new AdvancedSettings();
    document.head.appendChild(script);
  }
}

// Boot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitForConfig);
} else {
  waitForConfig();
}
