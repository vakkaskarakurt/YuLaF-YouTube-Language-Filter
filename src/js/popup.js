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
      // Get current tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      this.tab = tabs[0];

      // Check if we're on YouTube
      if (!this.tab.url.includes('youtube.com')) {
        this.uiManager.showNonYouTubePage();
        this.uiManager.setupNonYouTubeEventListeners();
        return;
      }

      // Initialize handlers
      this.toggleHandler = new ToggleHandler(this.storageManager, this.uiManager, this.tab);
      this.languageHandler = new LanguageHandler(this.storageManager, this.uiManager, this.tab);

      // Load data
      const [currentState, languages] = await Promise.all([
        this.storageManager.loadCurrentState(this.tab),
        this.storageManager.loadLanguages(this.tab)
      ]);

      // Set state
      this.toggleHandler.setCurrentState(currentState);
      this.languageHandler.setCurrentState(currentState);
      this.languageHandler.setLanguages(languages);

      // Setup UI
      this.setupEventListeners();
      this.updateUI(currentState);
      
      // Show loaded UI
      setTimeout(() => {
        this.uiManager.showLoaded();
      }, 100);

    } catch (error) {
      console.error('Error during initialization:', error);
      setTimeout(() => {
        this.uiManager.showLoaded();
      }, 100);
    }
  }

  updateUI(state) {
    this.toggleHandler.updateToggles(state);
    this.uiManager.updateSortUI(state.sortBy || 'popularity');
    this.languageHandler.renderLanguages();
  }

  setupEventListeners() {
    if (this.listenersAdded) return;

    // Setup component event listeners
    this.toggleHandler.setupEventListeners();
    this.languageHandler.setupEventListeners();

    // Global event listeners
    document.addEventListener('click', (e) => {
      const languageSelector = document.querySelector('.language-selector');
      const sortContainer = document.querySelector('.sort-container');
      
      if (languageSelector && !languageSelector.contains(e.target)) {
        const languageOptions = document.getElementById('languageOptions');
        languageOptions?.classList.remove('expanded');
        languageOptions?.classList.remove('force-open');
      }
      
      if (sortContainer && !sortContainer.contains(e.target)) {
        const sortDropdown = document.getElementById('sortDropdown');
        const sortButton = document.getElementById('sortButton');
        sortDropdown?.classList.remove('show');
        sortButton?.classList.remove('active');
      }
    });

    // Footer buttons
    this.setupFooterButtons();
    
    // Storage change listener
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync') {
        this.handleStorageChanges(changes);
      }
    });

    this.listenersAdded = true;
  }

  setupFooterButtons() {
    const guideBtn = document.getElementById('guideBtn');
    const feedbackBtn = document.getElementById('feedbackBtn');
    const rateUsBtn = document.getElementById('rateUsBtn');

    if (guideBtn) {
      guideBtn.addEventListener('click', () => {
        chrome.tabs.create({
          url: chrome.runtime.getURL('src/html/welcome.html')
        });
        window.close();
      });
    }

    if (feedbackBtn) {
      feedbackBtn.addEventListener('click', () => {
        chrome.tabs.create({
          url: chrome.runtime.getURL('src/html/welcome.html')
        }, (tab) => {
          setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, { action: 'openFeedback' }).catch(() => {});
          }, 2000);
        });
        window.close();
      });
    }

    if (rateUsBtn) {
      rateUsBtn.addEventListener('click', () => {
        chrome.tabs.create({
          url: 'https://chromewebstore.google.com/detail/yulaf-youtube-language-fi/ejfoldoabjeidjdddhomeaojicaemdpm'
        });
        window.close();
      });
    }
  }

  handleStorageChanges(changes) {
    let stateChanged = false;
    const currentState = this.toggleHandler.currentState;
    const newState = { ...currentState };
    
    for (const key in changes) {
      if (key in currentState && JSON.stringify(changes[key].newValue) !== JSON.stringify(currentState[key])) {
        newState[key] = changes[key].newValue;
        stateChanged = true;
      }
    }
    
    if (stateChanged) {
      this.toggleHandler.setCurrentState(newState);
      this.languageHandler.setCurrentState(newState);
      this.updateUI(newState);
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});