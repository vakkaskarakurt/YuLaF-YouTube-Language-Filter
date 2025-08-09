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

  createLanguageElement(langCode, lang) {
    const option = document.createElement('label');
    option.className = 'language-option';
    option.innerHTML = `
      <input type="checkbox" name="language" value="${langCode}" 
             ${this.currentState.selectedLanguages.includes(langCode) ? 'checked' : ''}>
      <span class="language-label">
        <span class="flag">${lang.icon}</span>
        <span class="language-text">
          <span class="language-name">${lang.name}</span>
          <span class="language-native">${lang.nativeName}</span>
        </span>
      </span>
    `;
    
    const checkbox = option.querySelector('input');
    checkbox.addEventListener('change', (e) => this.handleLanguageChange(e));
    
    return option;
  }

  renderLanguages(searchTerm = '') {
    const languageOptions = document.getElementById('languageOptions');
    if (!languageOptions) return;

    languageOptions.innerHTML = '';
    
    if (Object.keys(this.languages).length > 0) {
      languageOptions.classList.add('expanded');
    }
    
    const filteredLanguages = Object.entries(this.languages).filter(([code, lang]) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return lang.name.toLowerCase().includes(term) || 
             lang.nativeName.toLowerCase().includes(term) ||
             code.toLowerCase().includes(term);
    });

    const popularityOrder = [
      'en', 'es', 'zh', 'hi', 'ar', 'pt', 'bn', 'ru', 'ja', 'fr',
      'de', 'ko', 'it', 'tr', 'vi', 'th', 'pl', 'nl', 'sv', 'da',
      'no', 'fi', 'cs', 'hu', 'ro', 'bg', 'hr', 'sk', 'sl', 'et',
      'lv', 'lt', 'el', 'id', 'ms', 'tl', 'he', 'fa', 'ur', 'ta',
      'te', 'ml', 'kn', 'gu', 'pa', 'sw', 'af', 'am', 'ca', 'eu',
      'gl', 'cy', 'ga', 'mt', 'is', 'mk', 'sq', 'sr', 'bs', 'uk', 'be'
    ];

    filteredLanguages.sort(([codeA, langA], [codeB, langB]) => {
      const aSelected = this.currentState.selectedLanguages.includes(codeA);
      const bSelected = this.currentState.selectedLanguages.includes(codeB);
      
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      
      if (this.currentSortBy === 'name') {
        return langA.name.localeCompare(langB.name);
      } else {
        const aIndex = popularityOrder.indexOf(codeA);
        const bIndex = popularityOrder.indexOf(codeB);
        
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        
        if (aIndex === -1 && bIndex !== -1) return 1;
        if (aIndex !== -1 && bIndex === -1) return -1;
        
        return langA.name.localeCompare(langB.name);
      }
    });

    filteredLanguages.forEach(([code, lang]) => {
      languageOptions.appendChild(this.createLanguageElement(code, lang));
    });

    this.uiManager.updateSelectedCount(this.currentState.selectedLanguages.length);
  }

  async handleLanguageChange(e) {
    const language = e.target.value;
    const isChecked = e.target.checked;
    
    let newSelectedLanguages = [...this.currentState.selectedLanguages];
    
    if (isChecked) {
      if (!newSelectedLanguages.includes(language)) {
        newSelectedLanguages.push(language);
      }
    } else {
      newSelectedLanguages = newSelectedLanguages.filter(lang => lang !== language);
    }
    
    this.currentState.selectedLanguages = newSelectedLanguages;
    this.uiManager.updateSelectedCount(newSelectedLanguages.length);
    
    try {
      await this.storageManager.saveState({ 
        selectedLanguages: newSelectedLanguages 
      }, this.tab, true);
    } catch (error) {
      console.log('Error updating languages:', error);
      chrome.tabs.reload(this.tab.id);
    }
  }

  handleSearchInput(e) {
    const languageOptions = document.getElementById('languageOptions');
    
    if (!languageOptions.classList.contains('expanded')) {
      languageOptions.classList.add('expanded');
    }
    
    this.renderLanguages(e.target.value);
    
    if (Object.keys(this.languages).length === 0) {
      setTimeout(async () => {
        const languages = await this.storageManager.loadLanguages(this.tab);
        this.setLanguages(languages);
        this.renderLanguages(e.target.value);
      }, 100);
    }
  }

  handleSearchFocus() {
    const languageOptions = document.getElementById('languageOptions');
    
    languageOptions.classList.add('expanded');
    languageOptions.classList.add('force-open');
    
    if (Object.keys(this.languages).length === 0) {
      setTimeout(async () => {
        const languages = await this.storageManager.loadLanguages(this.tab);
        this.setLanguages(languages);
        this.renderLanguages();
        languageOptions.classList.add('expanded');
      }, 50);
    }
    
    if (languageOptions.children.length === 0) {
      this.renderLanguages();
    }
  }

  async handleSortOptionClick(e) {
    const target = e.target.closest('.sort-option');
    if (!target) return;
    
    const newSortBy = target.dataset.sort;
    if (newSortBy && newSortBy !== this.currentSortBy) {
      this.currentSortBy = newSortBy;
      
      await chrome.storage.sync.set({ sortBy: this.currentSortBy });
      
      this.uiManager.updateSortUI(this.currentSortBy);
      
      const languageSearch = document.getElementById('languageSearch');
      this.renderLanguages(languageSearch ? languageSearch.value : '');
    }
    
    const sortDropdown = document.getElementById('sortDropdown');
    const sortButton = document.getElementById('sortButton');
    
    sortDropdown.classList.remove('show');
    sortButton.classList.remove('active');
  }

  setupEventListeners() {
    const languageSearch = document.getElementById('languageSearch');
    const sortButton = document.getElementById('sortButton');
    const sortDropdown = document.getElementById('sortDropdown');
    
    if (languageSearch) {
      languageSearch.addEventListener('input', (e) => this.handleSearchInput(e));
      languageSearch.addEventListener('click', () => this.handleSearchFocus());
      languageSearch.addEventListener('focus', () => this.handleSearchFocus());
    }
    
    if (sortButton) {
      sortButton.addEventListener('click', () => this.handleSortButtonClick());
    }
    
    if (sortDropdown) {
      sortDropdown.addEventListener('click', (e) => this.handleSortOptionClick(e));
    }
  }

  handleSortButtonClick() {
    const sortDropdown = document.getElementById('sortDropdown');
    const sortButton = document.getElementById('sortButton');
    
    sortDropdown.classList.toggle('show');
    sortButton.classList.toggle('active');
  }
}