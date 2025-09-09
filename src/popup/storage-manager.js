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

    this.defaultLanguages = {
      en: { code: 'en', name: 'English', nativeName: 'English', icon: '🇬🇧' },
      es: { code: 'es', name: 'Spanish', nativeName: 'Español', icon: '🇪🇸' },
      zh: { code: 'zh', name: 'Chinese', nativeName: '中文', icon: '🇨🇳' },
      hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', icon: '🇮🇳' },
      ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', icon: '🇸🇦' },
      pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', icon: '🇵🇹' },
      bn: { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', icon: '🇧🇩' },
      ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', icon: '🇷🇺' },
      ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', icon: '🇯🇵' },
      fr: { code: 'fr', name: 'French', nativeName: 'Français', icon: '🇫🇷' },
      de: { code: 'de', name: 'German', nativeName: 'Deutsch', icon: '🇩🇪' },
      ko: { code: 'ko', name: 'Korean', nativeName: '한국어', icon: '🇰🇷' },
      it: { code: 'it', name: 'Italian', nativeName: 'Italiano', icon: '🇮🇹' },
      tr: { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', icon: '🇹🇷' },
      vi: { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', icon: '🇻🇳' },
      th: { code: 'th', name: 'Thai', nativeName: 'ไทย', icon: '🇹🇭' },
      pl: { code: 'pl', name: 'Polish', nativeName: 'Polski', icon: '🇵🇱' },
      nl: { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', icon: '🇳🇱' },
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
      id: { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', icon: '🇮🇩' },
      ms: { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', icon: '🇲🇾' },
      tl: { code: 'tl', name: 'Filipino', nativeName: 'Filipino', icon: '🇵🇭' },
      he: { code: 'he', name: 'Hebrew', nativeName: 'עברית', icon: '🇮🇱' },
      fa: { code: 'fa', name: 'Persian', nativeName: 'فارسی', icon: '🇮🇷' },
      ur: { code: 'ur', name: 'Urdu', nativeName: 'اردو', icon: '🇵🇰' },
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

  async loadCurrentState(tab) {
    try {
      const stored = await chrome.storage.sync.get(Object.keys(this.defaultState));

      let currentState = {
        enabled: stored.enabled !== false,
        strictMode: stored.strictMode !== false,
        hideVideos: stored.hideVideos !== false,
        hideChannels: stored.hideChannels !== false,
        selectedLanguages: stored.selectedLanguages || ['en'],
        sortBy: stored.sortBy || 'popularity'
      };

      // Content script üzerinden güncel state çek
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'getStatus' });
        if (response?.enabled !== undefined) {
          currentState.enabled = response.enabled;
          if (response.settings) Object.assign(currentState, response.settings);
        }
      } catch {
        console.log('Content script not ready, fallback to storage');
      }

      return currentState;
    } catch (err) {
      console.error('Error loading state:', err);
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
          forceReload
        });
        if (response?.error) console.warn('Content script response error:', response.error);
      } catch (err) {
        console.log('Content script not available:', err.message);
        if (forceReload && err.message.includes('Could not establish connection')) {
          chrome.tabs.reload(tab.id);
        }
      }

      return true;
    } catch (err) {
      console.error('Error saving state:', err);
      return false;
    }
  }

  async loadLanguages(tab) {
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getLanguages' });
      if (response?.languages) return response.languages;
    } catch (err) {
      console.log('Could not load languages from content script:', err);
    }
    return this.defaultLanguages;
  }
}
