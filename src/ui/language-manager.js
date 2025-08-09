export class LanguageManager {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.languages = {};
  }

  async loadLanguages() {
    this.languages = {
      // Popular languages for quick selection
      en: { code: 'en', name: 'English', nativeName: 'English', icon: '🇬🇧' },
      tr: { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', icon: '🇹🇷' },
      es: { code: 'es', name: 'Spanish', nativeName: 'Español', icon: '🇪🇸' },
      fr: { code: 'fr', name: 'French', nativeName: 'Français', icon: '🇫🇷' },
      de: { code: 'de', name: 'German', nativeName: 'Deutsch', icon: '🇩🇪' },
      it: { code: 'it', name: 'Italian', nativeName: 'Italiano', icon: '🇮🇹' },
      pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', icon: '🇵🇹' },
      ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', icon: '🇷🇺' },
      zh: { code: 'zh', name: 'Chinese', nativeName: '中文', icon: '🇨🇳' },
      ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', icon: '🇯🇵' },
      ko: { code: 'ko', name: 'Korean', nativeName: '한국어', icon: '🇰🇷' },
      ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', icon: '🇸🇦' },
      hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', icon: '🇮🇳' },
      nl: { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', icon: '🇳🇱' },
      pl: { code: 'pl', name: 'Polish', nativeName: 'Polski', icon: '🇵🇱' },
      sv: { code: 'sv', name: 'Swedish', nativeName: 'Svenska', icon: '🇸🇪' },
      da: { code: 'da', name: 'Danish', nativeName: 'Dansk', icon: '🇩🇰' },
      no: { code: 'no', name: 'Norwegian', nativeName: 'Norsk', icon: '🇳🇴' },
      fi: { code: 'fi', name: 'Finnish', nativeName: 'Suomi', icon: '🇫🇮' },
      cs: { code: 'cs', name: 'Czech', nativeName: 'Čeština', icon: '🇨🇿' },
      hu: { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', icon: '🇭🇺' },
      ro: { code: 'ro', name: 'Romanian', nativeName: 'Română', icon: '🇷🇴' },
      bg: { code: 'bg', name: 'Bulgarian', nativeName: 'Български', icon: '🇧🇬' },
      hr: { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', icon: '🇭🇷' },
      sk: { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', icon: '🇸🇰' },
      sl: { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', icon: '🇸🇮' },
      et: { code: 'et', name: 'Estonian', nativeName: 'Eesti', icon: '🇪🇪' },
      lv: { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', icon: '🇱🇻' },
      lt: { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', icon: '🇱🇹' },
      el: { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', icon: '🇬🇷' },
      th: { code: 'th', name: 'Thai', nativeName: 'ไทย', icon: '🇹🇭' },
      vi: { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', icon: '🇻🇳' },
      id: { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', icon: '🇮🇩' },
      ms: { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', icon: '🇲🇾' },
      tl: { code: 'tl', name: 'Filipino', nativeName: 'Filipino', icon: '🇵🇭' },
      he: { code: 'he', name: 'Hebrew', nativeName: 'עברית', icon: '🇮🇱' },
      fa: { code: 'fa', name: 'Persian', nativeName: 'فارسی', icon: '🇮🇷' },
      ur: { code: 'ur', name: 'Urdu', nativeName: 'اردو', icon: '🇵🇰' },
      bn: { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', icon: '🇧🇩' },
      ta: { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', icon: '🇱🇰' },
      te: { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', icon: '🇮🇳' },
      ml: { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', icon: '🇮🇳' },
      kn: { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', icon: '🇮🇳' },
      gu: { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', icon: '🇮🇳' },
      pa: { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', icon: '🇮🇳' },
      sw: { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', icon: '🇰🇪' },
      af: { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', icon: '🇿🇦' },
      am: { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', icon: '🇪🇹' },
      ca: { code: 'ca', name: 'Catalan', nativeName: 'Català', icon: '🏳️' },
      eu: { code: 'eu', name: 'Basque', nativeName: 'Euskera', icon: '🏳️' },
      gl: { code: 'gl', name: 'Galician', nativeName: 'Galego', icon: '🏳️' },
      cy: { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', icon: '🏴' },
      ga: { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', icon: '🇮🇪' },
      mt: { code: 'mt', name: 'Maltese', nativeName: 'Malti', icon: '🇲🇹' },
      is: { code: 'is', name: 'Icelandic', nativeName: 'Íslenska', icon: '🇮🇸' },
      mk: { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', icon: '🇲🇰' },
      sq: { code: 'sq', name: 'Albanian', nativeName: 'Shqip', icon: '🇦🇱' },
      sr: { code: 'sr', name: 'Serbian', nativeName: 'Српски', icon: '🇷🇸' },
      bs: { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', icon: '🇧🇦' },
      uk: { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', icon: '🇺🇦' },
      be: { code: 'be', name: 'Belarusian', nativeName: 'Беларуская', icon: '🇧🇾' }
    };
  }

  populateLanguageSelections() {
    this.populatePopularLanguages();
    this.populateAllLanguages();
    this.updateSelectionSummary();
  }

  populatePopularLanguages() {
    const container = document.getElementById('popularLanguages');
    if (!container) return;

    const popularCodes = ['en', 'tr', 'es', 'fr', 'de', 'it', 'ru', 'zh', 'ja', 'ar', 'hi', 'pt'];
    
    container.innerHTML = '';
    popularCodes.forEach(code => {
      if (this.languages[code]) {
        const element = this.createLanguageElement(code, this.languages[code]);
        container.appendChild(element);
      }
    });
  }

  populateAllLanguages() {
    const container = document.getElementById('allLanguages');
    if (!container) return;

    this.renderLanguageList(container, Object.entries(this.languages));
  }

  createLanguageElement(code, language) {
    const element = document.createElement('div');
    element.className = `language-item ${this.stateManager.selectedLanguages.includes(code) ? 'selected' : ''}`;
    element.dataset.code = code;
    
    element.innerHTML = `
      <span class="flag">${language.icon}</span>
      <span class="name">${language.name}</span>
    `;
    
    element.addEventListener('click', () => this.toggleLanguage(code));
    
    return element;
  }

  renderLanguageList(container, languageEntries, searchTerm = '') {
    container.innerHTML = '';
    
    const filtered = languageEntries.filter(([code, lang]) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return lang.name.toLowerCase().includes(term) || 
             lang.nativeName.toLowerCase().includes(term) ||
             code.toLowerCase().includes(term);
    });

    filtered.sort(([codeA, langA], [codeB, langB]) => {
      const aSelected = this.stateManager.selectedLanguages.includes(codeA);
      const bSelected = this.stateManager.selectedLanguages.includes(codeB);
      
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      
      return langA.name.localeCompare(langB.name);
    });

    filtered.forEach(([code, language]) => {
      const element = this.createLanguageElement(code, language);
      container.appendChild(element);
    });
  }

  toggleLanguage(code) {
    this.stateManager.toggleLanguage(code);
    this.updateLanguageSelections();
    this.updateSelectionSummary();
    this.saveLanguageSelection();
  }

  updateLanguageSelections() {
    document.querySelectorAll('.language-item').forEach(item => {
      const code = item.dataset.code;
      if (this.stateManager.selectedLanguages.includes(code)) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  }

  updateSelectionSummary() {
    const countElement = document.getElementById('selectedCount');
    const tagsElement = document.getElementById('selectedLanguages');
    
    if (countElement) {
      countElement.textContent = this.stateManager.selectedLanguages.length;
    }
    
    if (tagsElement) {
      tagsElement.innerHTML = '';
      this.stateManager.selectedLanguages.forEach(code => {
        if (this.languages[code]) {
          const tag = document.createElement('span');
          tag.className = 'selected-tag';
          tag.innerHTML = `
            <span class="flag">${this.languages[code].icon}</span>
            <span>${this.languages[code].name}</span>
            <span class="remove" data-code="${code}">×</span>
          `;
          
          tag.querySelector('.remove').addEventListener('click', () => {
            this.toggleLanguage(code);
          });
          
          tagsElement.appendChild(tag);
        }
      });
    }
  }

  filterLanguages(searchTerm) {
    const container = document.getElementById('allLanguages');
    if (!container) return;
    
    this.renderLanguageList(container, Object.entries(this.languages), searchTerm);
  }

  async saveLanguageSelection() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.sync.set({
          selectedLanguages: this.stateManager.selectedLanguages
        });
      }
    } catch (error) {
      console.log('Could not save to chrome storage:', error);
    }
  }
}