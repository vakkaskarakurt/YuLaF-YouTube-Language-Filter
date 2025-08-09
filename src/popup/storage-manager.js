export class StorageManager {
  constructor() {
    this.defaultState = {
      enabled: true,
      strictMode: true,
      hideVideos: true,
      hideChannels: true,
      selectedLanguages: ['en'],
      sortBy: 'popularity'
    };
  }

  async loadCurrentState(tab) {
    try {
      const stored = await chrome.storage.sync.get([
        'enabled', 'strictMode', 'hideVideos', 'hideChannels', 
        'selectedLanguages', 'sortBy'
      ]);
      
      let currentState = {
        enabled: stored.enabled !== false,
        strictMode: stored.strictMode !== false,
        hideVideos: stored.hideVideos !== false,
        hideChannels: stored.hideChannels !== false,
        selectedLanguages: stored.selectedLanguages || ['en'],
        sortBy: stored.sortBy || 'popularity'
      };

      // Get state from content script if available
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'getStatus' });
        if (response && typeof response.enabled === 'boolean') {
          currentState.enabled = response.enabled;
          if (response.settings) {
            Object.assign(currentState, response.settings);
          }
        }
      } catch (error) {
        console.log('Content script not ready, using storage values');
      }

      return currentState;
    } catch (error) {
      console.error('Error loading state:', error);
      return this.defaultState;
    }
  }

  async saveState(updates, tab, forceReload = false) {
    try {
      await chrome.storage.sync.set(updates);
      
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { 
          action: 'updateState', 
          state: updates,
          forceReload: forceReload
        });
        
        if (!response || response.error) {
          console.warn('Content script response error:', response?.error);
        }
        return true;
      } catch (error) {
        console.log('Content script not available:', error.message);
        if (forceReload && error.message.includes('Could not establish connection')) {
          chrome.tabs.reload(tab.id);
        }
        return true;
      }
    } catch (error) {
      console.error('Error saving state:', error);
      return false;
    }
  }

  async loadLanguages(tab) {
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getLanguages' });
      if (response && response.languages) {
        return response.languages;
      }
    } catch (error) {
      console.log('Could not load languages from content script:', error);
    }

    // Fallback language list
    return {
      en: { code: 'en', name: 'English', nativeName: 'English', icon: '🇬🇧', enabled: false },
      es: { code: 'es', name: 'Spanish', nativeName: 'Español', icon: '🇪🇸', enabled: false },
      zh: { code: 'zh', name: 'Chinese', nativeName: '中文', icon: '🇨🇳', enabled: false },
      hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', icon: '🇮🇳', enabled: false },
      ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', icon: '🇸🇦', enabled: false },
      pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', icon: '🇵🇹', enabled: false },
      bn: { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', icon: '🇧🇩', enabled: false },
      ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', icon: '🇷🇺', enabled: false },
      ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', icon: '🇯🇵', enabled: false },
      fr: { code: 'fr', name: 'French', nativeName: 'Français', icon: '🇫🇷', enabled: false },
      de: { code: 'de', name: 'German', nativeName: 'Deutsch', icon: '🇩🇪', enabled: false },
      ko: { code: 'ko', name: 'Korean', nativeName: '한국어', icon: '🇰🇷', enabled: false },
      it: { code: 'it', name: 'Italian', nativeName: 'Italiano', icon: '🇮🇹', enabled: false },
      tr: { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', icon: '🇹🇷', enabled: false },
      vi: { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', icon: '🇻🇳', enabled: false },
      th: { code: 'th', name: 'Thai', nativeName: 'ไทย', icon: '🇹🇭', enabled: false },
      pl: { code: 'pl', name: 'Polish', nativeName: 'Polski', icon: '🇵🇱', enabled: false },
      nl: { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', icon: '🇳🇱', enabled: false },
      sv: { code: 'sv', name: 'Swedish', nativeName: 'Svenska', icon: '🇸🇪', enabled: false },
      da: { code: 'da', name: 'Danish', nativeName: 'Dansk', icon: '🇩🇰', enabled: false },
      no: { code: 'no', name: 'Norwegian', nativeName: 'Norsk', icon: '🇳🇴', enabled: false },
      fi: { code: 'fi', name: 'Finnish', nativeName: 'Suomi', icon: '🇫🇮', enabled: false },
      cs: { code: 'cs', name: 'Czech', nativeName: 'Čeština', icon: '🇨🇿', enabled: false },
      hu: { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', icon: '🇭🇺', enabled: false },
      ro: { code: 'ro', name: 'Romanian', nativeName: 'Română', icon: '🇷🇴', enabled: false },
      bg: { code: 'bg', name: 'Bulgarian', nativeName: 'Български', icon: '🇧🇬', enabled: false },
      hr: { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', icon: '🇭🇷', enabled: false },
      sk: { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', icon: '🇸🇰', enabled: false },
      sl: { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', icon: '🇸🇮', enabled: false },
      et: { code: 'et', name: 'Estonian', nativeName: 'Eesti', icon: '🇪🇪', enabled: false },
      lv: { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', icon: '🇱🇻', enabled: false },
      lt: { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', icon: '🇱🇹', enabled: false },
      el: { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', icon: '🇬🇷', enabled: false },
      id: { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', icon: '🇮🇩', enabled: false },
      ms: { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', icon: '🇲🇾', enabled: false },
      tl: { code: 'tl', name: 'Filipino', nativeName: 'Filipino', icon: '🇵🇭', enabled: false },
      he: { code: 'he', name: 'Hebrew', nativeName: 'עברית', icon: '🇮🇱', enabled: false },
      fa: { code: 'fa', name: 'Persian', nativeName: 'فارسی', icon: '🇮🇷', enabled: false },
      ur: { code: 'ur', name: 'Urdu', nativeName: 'اردو', icon: '🇵🇰', enabled: false },
      ta: { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', icon: '🇱🇰', enabled: false },
      te: { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', icon: '🇮🇳', enabled: false },
      ml: { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', icon: '🇮🇳', enabled: false },
      kn: { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', icon: '🇮🇳', enabled: false },
      gu: { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', icon: '🇮🇳', enabled: false },
      pa: { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', icon: '🇮🇳', enabled: false },
      sw: { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', icon: '🇰🇪', enabled: false },
      af: { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', icon: '🇿🇦', enabled: false },
      am: { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', icon: '🇪🇹', enabled: false },
      ca: { code: 'ca', name: 'Catalan', nativeName: 'Català', icon: '🏳️', enabled: false },
      eu: { code: 'eu', name: 'Basque', nativeName: 'Euskera', icon: '🏳️', enabled: false },
      gl: { code: 'gl', name: 'Galician', nativeName: 'Galego', icon: '🏳️', enabled: false },
      cy: { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', icon: '🏴', enabled: false },
      ga: { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', icon: '🇮🇪', enabled: false },
      mt: { code: 'mt', name: 'Maltese', nativeName: 'Malti', icon: '🇲🇹', enabled: false },
      is: { code: 'is', name: 'Icelandic', nativeName: 'Íslenska', icon: '🇮🇸', enabled: false },
      mk: { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', icon: '🇲🇰', enabled: false },
      sq: { code: 'sq', name: 'Albanian', nativeName: 'Shqip', icon: '🇦🇱', enabled: false },
      sr: { code: 'sr', name: 'Serbian', nativeName: 'Српски', icon: '🇷🇸', enabled: false },
      bs: { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', icon: '🇧🇦', enabled: false },
      uk: { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', icon: '🇺🇦', enabled: false },
      be: { code: 'be', name: 'Belarusian', nativeName: 'Беларуская', icon: '🇧🇾', enabled: false }
    };
  }
}