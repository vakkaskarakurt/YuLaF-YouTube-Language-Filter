import { StorageManager } from '../popup/storage-manager.js';
import { UIManager } from '../popup/ui-manager.js';
import { ToggleHandler } from '../popup/toggle-handler.js';
import { LanguageHandler } from '../popup/language-handler.js';

class PopupController {
  constructor() {
    this.tab = null;
    this.storageManager = new StorageManager();
    this.uiManager = new UIManager();
    this.toggleHandler = null;
    this.languageHandler = null;
    this.listenersAdded = false;
    this.init();
  }

  async init() {
    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.tab = tab;

      // Not YouTube → show special screen
      if (!tab.url.includes('youtube.com')) {
        this.uiManager.showNonYouTubePage();
        this.uiManager.setupNonYouTubeEventListeners();
        return;
      }

      // Init handlers
      this.toggleHandler = new ToggleHandler(this.storageManager, this.uiManager, tab);
      this.languageHandler = new LanguageHandler(this.storageManager, this.uiManager, tab);

      // Load current state + languages
      const [state, languages] = await Promise.all([
        this.storageManager.loadCurrentState(tab),
        this.storageManager.loadLanguages(tab)
      ]);

      // Apply state
      this.toggleHandler.setCurrentState(state);
      this.languageHandler.setCurrentState(state);
      this.languageHandler.setLanguages(languages);

      // Setup
      this.setupEventListeners();
      this.updateUI(state);

      // Fade-in UI
      setTimeout(() => this.uiManager.showLoaded(), 100);
    } catch (err) {
      console.error('Popup init error:', err);
      setTimeout(() => this.uiManager.showLoaded(), 100);
    }
  }

  updateUI(state) {
    this.toggleHandler.updateToggles(state);
    this.uiManager.updateSortUI(state.sortBy || 'popularity');
    this.languageHandler.renderLanguages();
    this.uiManager.setupLanguageExpansion();
  }

  setupEventListeners() {
    if (this.listenersAdded) return;

    // Components
    this.toggleHandler.setupEventListeners();
    this.languageHandler.setupEventListeners();

    // Global click handler (close dropdowns etc.)
    document.addEventListener('click', (e) => {
      const langSel = document.querySelector('.language-selector');
      const sortCont = document.querySelector('.sort-container');

      if (langSel && !langSel.contains(e.target)) {
        document.getElementById('languageOptions')?.classList.remove('expanded', 'force-open');
      }
      if (sortCont && !sortCont.contains(e.target)) {
        document.getElementById('sortDropdown')?.classList.remove('show');
        document.getElementById('sortButton')?.classList.remove('active');
      }
    });

    this.setupFooterButtons();

    // Listen for storage updates
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync') this.handleStorageChanges(changes);
    });

    this.listenersAdded = true;
  }

  setupFooterButtons() {
    const openTab = (url, cb) =>
      chrome.tabs.create({ url }, cb).then(() => window.close());

    document.getElementById('coffeeBtn')?.addEventListener('click', () =>
      openTab('https://buymeacoffee.com/yulafdev')
    );

    document.getElementById('advancedBtn')?.addEventListener('click', () =>
      this.openAdvancedModal()
    );
  }

  async openAdvancedModal() {
    const modal = document.getElementById('modalOverlay');
    if (!modal) return;

    // Load current state
    const result = await chrome.storage.sync.get(['strictMode', 'selectedLanguages']);
    const strictMode = result.strictMode !== undefined ? result.strictMode : true;
    const selectedLanguages = result.selectedLanguages || [];

    // Update strict mode toggle
    const strictToggle = document.getElementById('strictModeToggle');
    if (strictToggle) {
      strictToggle.checked = strictMode;
      strictToggle.onchange = async (e) => {
        await chrome.storage.sync.set({ strictMode: e.target.checked });
        const tabs = await chrome.tabs.query({ url: '*://*.youtube.com/*' });
        tabs.forEach(tab => chrome.tabs.reload(tab.id));
      };
    }

    // Render all languages
    this.renderAdvancedLanguages(selectedLanguages);

    // Setup search
    const searchInput = document.getElementById('advancedLanguageSearch');
    if (searchInput) {
      searchInput.value = '';
      searchInput.oninput = (e) => this.renderAdvancedLanguages(selectedLanguages, e.target.value);
    }

    // Setup modal close
    const closeModal = () => modal.classList.remove('show');
    document.getElementById('modalClose')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Show modal
    modal.classList.add('show');
  }

  renderAdvancedLanguages(selectedLanguages, searchTerm = '') {
    const container = document.getElementById('advancedLanguageOptions');
    if (!container) return;

    container.innerHTML = '';

    const languages = window.YT_FILTER_CONFIG?.languages || {};
    const term = searchTerm.toLowerCase();

    const filtered = Object.entries(languages).filter(([code, lang]) =>
      !term ||
      lang.name.toLowerCase().includes(term) ||
      lang.nativeName.toLowerCase().includes(term) ||
      code.toLowerCase().includes(term)
    );

    // Sort: selected first, then alphabetically
    filtered.sort(([aCode, aLang], [bCode, bLang]) => {
      const aSel = selectedLanguages.includes(aCode);
      const bSel = selectedLanguages.includes(bCode);
      if (aSel !== bSel) return aSel ? -1 : 1;
      return aLang.name.localeCompare(bLang.name);
    });

    filtered.forEach(([code, lang]) => {
      const isChecked = selectedLanguages.includes(code);
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

      option.querySelector('input')?.addEventListener('change', async (e) => {
        const code = e.target.value;
        const result = await chrome.storage.sync.get(['selectedLanguages']);
        let selected = result.selectedLanguages || [];

        if (e.target.checked) {
          if (!selected.includes(code)) selected.push(code);
        } else {
          selected = selected.filter(lang => lang !== code);
        }

        await chrome.storage.sync.set({ selectedLanguages: selected });
        this.updateSelectedCountModal(selected.length);
        this.uiManager.updateSelectedCount(selected.length);

        // Reload YouTube tabs
        const tabs = await chrome.tabs.query({ url: '*://*.youtube.com/*' });
        tabs.forEach(tab => chrome.tabs.reload(tab.id));
      });

      container.appendChild(option);
    });

    this.updateSelectedCountModal(selectedLanguages.length);
  }

  updateSelectedCountModal(count) {
    const countEl = document.getElementById('selectedCountModal');
    if (countEl) countEl.textContent = count;
  }

  handleStorageChanges(changes) {
    const current = this.toggleHandler.currentState;
    const newState = { ...current };
    let changed = false;

    for (const key in changes) {
      if (key in current && JSON.stringify(changes[key].newValue) !== JSON.stringify(current[key])) {
        newState[key] = changes[key].newValue;
        changed = true;
      }
    }

    if (changed) {
      this.toggleHandler.setCurrentState(newState);
      this.languageHandler.setCurrentState(newState);
      this.updateUI(newState);
    }
  }
}

// Boot
document.addEventListener('DOMContentLoaded', () => new PopupController());
