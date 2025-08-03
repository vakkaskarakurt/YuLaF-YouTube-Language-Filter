// Welcome Page Controller
class WelcomeController {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 4;
    this.selectedLanguages = ['en']; // Default to English
    this.languages = {};
    this.init();
  }

  async init() {
    await this.loadLanguages();
    this.setupEventListeners();
    this.populateLanguageSelections();
    this.updateUI();
    this.startAutoProgress();
  }

  startAutoProgress() {
    // Her adım için otomatik ilerleme süreleri (milisaniye)
    const stepDurations = {
      1: 10000,  // Hoş Geldiniz - 10 saniye
      2: 10000,  // Nasıl Çalışır - 10 saniye  
      3: 0,      // Dil Seçimi - otomatik ilerleme yok (kullanıcı seçimi gerekli)
      4: 0       // Son adım - bitmiş
    };

    const duration = stepDurations[this.currentStep] || 0;
    
    if (duration > 0) {
      // Göstergeyi gizli tut - sadece timer çalışsın
      this.autoProgressTimer = setTimeout(() => {
        this.autoAdvance();
      }, duration);
    }
  }

  showAutoProgressIndicator(duration) {
    const indicator = document.getElementById('autoProgressIndicator');
    const fill = document.getElementById('autoProgressFill');
    
    if (!indicator || !fill) return;
    
    // Reset and show
    fill.style.width = '0%';
    fill.style.transition = 'none';
    indicator.classList.add('visible');
    
    // Animate
    setTimeout(() => {
      fill.style.transition = `width ${duration}ms linear`;
      fill.style.width = '100%';
    }, 50);
  }

  hideAutoProgressIndicator() {
    const indicator = document.getElementById('autoProgressIndicator');
    const fill = document.getElementById('autoProgressFill');
    
    if (indicator) {
      indicator.classList.remove('visible');
    }
    
    if (fill) {
      fill.style.width = '0%';
      fill.style.transition = 'none';
    }
  }

  autoAdvance() {
    // Sadece 1. ve 2. adımlarda otomatik ilerle
    if (this.currentStep === 1 || this.currentStep === 2) {
      this.nextStep();
    }
  }

  stopAutoProgress() {
    if (this.autoProgressTimer) {
      clearTimeout(this.autoProgressTimer);
      this.autoProgressTimer = null;
    }
    this.hideAutoProgressIndicator();
  }

  async loadLanguages() {
    // Load languages from config or use fallback
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
      cy: { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', icon: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
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

  setupEventListeners() {
    // Navigation buttons
    document.getElementById('prevBtn').addEventListener('click', () => this.prevStep());
    document.getElementById('nextBtn').addEventListener('click', () => this.nextStep());

    // Step navigation
    document.querySelectorAll('.step').forEach(step => {
      step.addEventListener('click', () => {
        const stepNum = parseInt(step.dataset.step);
        if (stepNum <= this.currentStep || stepNum === this.currentStep + 1) {
          this.goToStep(stepNum);
        }
      });
    });

    // Language search
    const searchInput = document.getElementById('languageSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.filterLanguages(e.target.value));
    }

    // Final action buttons
    const goToYouTubeBtn = document.getElementById('goToYouTube');

    if (goToYouTubeBtn) {
      goToYouTubeBtn.addEventListener('click', () => this.goToYouTube());
    }

    // Feedback modal buttons
    const feedbackHeaderBtn = document.getElementById('feedbackHeaderBtn');
    const feedbackModal = document.getElementById('feedbackModal');
    const modalClose = document.getElementById('modalClose');
    const cancelFeedback = document.getElementById('cancelFeedback');
    const feedbackForm = document.getElementById('feedbackForm');
    const successClose = document.getElementById('successClose');

    if (feedbackHeaderBtn) {
      feedbackHeaderBtn.addEventListener('click', () => this.openFeedbackModal());
    }

    const rateUsHeaderBtn = document.getElementById('rateUsHeaderBtn');
    if (rateUsHeaderBtn) {
      rateUsHeaderBtn.addEventListener('click', () => this.handleRateUsClick());
    }

    if (modalClose) {
      modalClose.addEventListener('click', () => this.closeFeedbackModal());
    }

    if (cancelFeedback) {
      cancelFeedback.addEventListener('click', () => this.closeFeedbackModal());
    }

    if (successClose) {
      successClose.addEventListener('click', () => this.closeFeedbackModal());
    }

    if (feedbackForm) {
      feedbackForm.addEventListener('submit', (e) => this.handleFeedbackSubmit(e));
    }

    // Close modal when clicking outside
    if (feedbackModal) {
      feedbackModal.addEventListener('click', (e) => {
        if (e.target === feedbackModal) {
          this.closeFeedbackModal();
        }
      });
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      // Close feedback modal with ESC
      if (e.key === 'Escape') {
        const modal = document.getElementById('feedbackModal');
        if (modal && modal.classList.contains('show')) {
          this.closeFeedbackModal();
          return;
        }
      }
      
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (this.currentStep < this.totalSteps) this.nextStep();
      } else if (e.key === 'ArrowLeft') {
        if (this.currentStep > 1) this.prevStep();
      }
    });
  }

  populateLanguageSelections() {
    this.populatePopularLanguages();
    this.populateAllLanguages();
    this.updateSelectionSummary();
  }

  populatePopularLanguages() {
    const container = document.getElementById('popularLanguages');
    if (!container) return;

    // Popular languages (most commonly used)
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
    element.className = `language-item ${this.selectedLanguages.includes(code) ? 'selected' : ''}`;
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
    
    // Filter languages based on search term
    const filtered = languageEntries.filter(([code, lang]) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return lang.name.toLowerCase().includes(term) || 
             lang.nativeName.toLowerCase().includes(term) ||
             code.toLowerCase().includes(term);
    });

    // Sort: selected first, then alphabetical
    filtered.sort(([codeA, langA], [codeB, langB]) => {
      const aSelected = this.selectedLanguages.includes(codeA);
      const bSelected = this.selectedLanguages.includes(codeB);
      
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
    const index = this.selectedLanguages.indexOf(code);
    
    if (index === -1) {
      this.selectedLanguages.push(code);
    } else {
      this.selectedLanguages.splice(index, 1);
    }
    
    // Update UI
    this.updateLanguageSelections();
    this.updateSelectionSummary();
    
    // Save to storage
    this.saveLanguageSelection();
  }

  updateLanguageSelections() {
    document.querySelectorAll('.language-item').forEach(item => {
      const code = item.dataset.code;
      if (this.selectedLanguages.includes(code)) {
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
      countElement.textContent = this.selectedLanguages.length;
    }
    
    if (tagsElement) {
      tagsElement.innerHTML = '';
      this.selectedLanguages.forEach(code => {
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
          selectedLanguages: this.selectedLanguages
        });
      }
    } catch (error) {
      console.log('Could not save to chrome storage:', error);
    }
  }

  nextStep() {
    // Kullanıcı etkileşimi olduğunda otomatik ilerlemeyi durdur
    this.stopAutoProgress();
    
    if (this.currentStep < this.totalSteps) {
      // Validation for step 3 (language selection)
      if (this.currentStep === 3 && this.selectedLanguages.length === 0) {
        alert('Please select at least one language.');
        this.startAutoProgress(); // Restart timer
        return;
      }
      
      this.currentStep++;
      this.updateUI();
      
      // Auto-save settings when reaching final step
      if (this.currentStep === 4) {
        this.finalizeSetup();
      } else {
        // Yeni adımda otomatik ilerlemeyi yeniden başlat
        this.startAutoProgress();
      }
    }
  }

  prevStep() {
    // Kullanıcı etkileşimi olduğunda otomatik ilerlemeyi durdur
    this.stopAutoProgress();
    
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateUI();
      this.startAutoProgress(); // Yeni adımda timer'ı başlat
    }
  }

  goToStep(stepNum) {
    this.stopAutoProgress();
    this.currentStep = stepNum;
    this.updateUI();
    this.startAutoProgress();
  }

  updateUI() {
    // Update progress steps and bar
    const progressSteps = document.querySelector('.progress-steps');
    document.querySelectorAll('.step').forEach((step, index) => {
      const stepNum = index + 1;
      
      step.classList.remove('active', 'completed');
      
      if (stepNum === this.currentStep) {
        step.classList.add('active');
      } else if (stepNum < this.currentStep) {
        step.classList.add('completed');
      }
    });

    // Update progress bar width
    const progressWidth = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
    if (progressSteps) {
      progressSteps.style.setProperty('--progress-width', `${progressWidth}%`);
    }

    // Update content sections
    document.querySelectorAll('.section').forEach((section, index) => {
      const sectionNum = index + 1;
      if (sectionNum === this.currentStep) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    // Update navigation buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn) {
      prevBtn.disabled = this.currentStep <= 1;
    }

    if (nextBtn) {
      if (this.currentStep >= this.totalSteps) {
        nextBtn.style.display = 'none';
      } else {
        nextBtn.style.display = 'block';
        nextBtn.textContent = 'Next →';
      }
    }

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async finalizeSetup() {
    try {
      // Save all settings
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.sync.set({
          enabled: true,
          strictMode: true,
          hideVideos: true,
          hideChannels: true,
          selectedLanguages: this.selectedLanguages,
          welcomeShown: true
        });
      }
    } catch (error) {
      console.log('Could not finalize setup:', error);
    }
  }

  goToYouTube() {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: 'https://www.youtube.com' });
      window.close();
    } else {
      window.open('https://www.youtube.com', '_blank');
    }
  }

  handleRateUsClick() {
    window.open('https://chromewebstore.google.com/detail/yulaf-youtube-language-fi/ejfoldoabjeidjdddhomeaojicaemdpm', '_blank');
  }


  openFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    const form = document.getElementById('feedbackForm');
    const success = document.getElementById('feedbackSuccess');
    
    if (modal) {
      // Reset form and show form, hide success
      if (form) form.style.display = 'block';
      if (success) success.style.display = 'none';
      
      // Reset form fields
      this.resetFeedbackForm();
      
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
      
      // Focus first input
      setTimeout(() => {
        const firstInput = modal.querySelector('select, input, textarea');
        if (firstInput) firstInput.focus();
      }, 300);
    }
  }

  closeFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  }

  resetFeedbackForm() {
    const form = document.getElementById('feedbackForm');
    if (form) {
      form.reset();
    }
  }

  async handleFeedbackSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const feedbackData = {
      type: document.getElementById('feedbackType').value,
      subject: document.getElementById('feedbackSubject').value,
      message: document.getElementById('feedbackMessage').value,
      email: document.getElementById('feedbackEmail').value,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      extensionVersion: '1.0.3'
    };

    try {
      // Show loading state
      const submitBtn = document.querySelector('.btn-submit');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = '📤 Sending...';
      submitBtn.disabled = true;

      // Simulate sending feedback (in real implementation, you would send to your server)
      await this.sendFeedback(feedbackData);
      
      // Show success message
      this.showFeedbackSuccess();
      
    } catch (error) {
      console.error('Feedback send error:', error);
      alert('An error occurred while sending feedback. Please try again later.');
      
      // Restore button
      const submitBtn = document.querySelector('.btn-submit');
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }

  async sendFeedback(feedbackData) {
    // Formspree ile e-posta gönderimi
    try {
      // Formspree endpoint URL
      const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xdkdllvl';
      
      // Form data hazırlama
      const formData = new FormData();
      formData.append('feedback_type', this.getFeedbackTypeText(feedbackData.type));
      formData.append('subject', feedbackData.subject);
      formData.append('message', feedbackData.message);
      formData.append('user_email', feedbackData.email || 'Not specified');
      formData.append('timestamp', new Date(feedbackData.timestamp).toLocaleString('tr-TR'));
      formData.append('extension_version', feedbackData.extensionVersion);
      formData.append('user_agent', feedbackData.userAgent);
      
      // Specially formatted message for Formspree
      const formattedMessage = `
${this.getFeedbackTypeEmoji(feedbackData.type)} Feedback Type: ${this.getFeedbackTypeText(feedbackData.type)}
📝 Subject: ${feedbackData.subject}

💬 Message:
${feedbackData.message}

---
📧 User Email: ${feedbackData.email || 'Not specified'}
📅 Date: ${new Date(feedbackData.timestamp).toLocaleString('en-US')}
🔧 Extension Version: ${feedbackData.extensionVersion}
🌐 Browser: ${feedbackData.userAgent}
      `.trim();
      
      formData.append('formatted_message', formattedMessage);

      // Formspree'ye POST request
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        console.log('Feedback sent successfully via Formspree');
        
        // Save to localStorage after successful sending
        const existingFeedback = JSON.parse(localStorage.getItem('yulaf_feedback') || '[]');
        existingFeedback.push({ ...feedbackData, emailSent: true, method: 'formspree' });
        localStorage.setItem('yulaf_feedback', JSON.stringify(existingFeedback));
        
        return { success: true, method: 'formspree' };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Formspree submission failed');
      }
    } catch (error) {
      console.error('Formspree error:', error);
      
      // Save to localStorage if email cannot be sent
      const existingFeedback = JSON.parse(localStorage.getItem('yulaf_feedback') || '[]');
      existingFeedback.push({ ...feedbackData, emailSent: false, emailError: error.message });
      localStorage.setItem('yulaf_feedback', JSON.stringify(existingFeedback));
      
      throw new Error('Error occurred while sending email: ' + error.message);
    }
  }

  getFeedbackTypeText(type) {
    const types = {
      'bug': 'Bug Report',
      'feature': 'Feature Request',
      'improvement': 'Improvement',
      'general': 'General Opinion',
      'compliment': 'Compliment'
    };
    return types[type] || type;
  }

  getFeedbackTypeEmoji(type) {
    const emojis = {
      'bug': '🐛',
      'feature': '💡',
      'improvement': '🚀',
      'general': '💬',
      'compliment': '👍'
    };
    return emojis[type] || '📝';
  }

  showFeedbackSuccess() {
    const form = document.getElementById('feedbackForm');
    const success = document.getElementById('feedbackSuccess');
    
    if (form && success) {
      form.style.display = 'none';
      success.style.display = 'block';
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.welcomeController = new WelcomeController();
});

// Listen for messages from popup
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openFeedback') {
      // Modal'ı açmak için birkaç kez dene
      let attempts = 0;
      const maxAttempts = 5;
      
      const tryOpenModal = () => {
        attempts++;
        if (window.welcomeController) {
          window.welcomeController.openFeedbackModal();
          sendResponse({ success: true });
          return;
        }
        
        if (attempts < maxAttempts) {
          setTimeout(tryOpenModal, 500);
        } else {
          // Son çare olarak DOM'dan modal'ı bul ve aç
          setTimeout(() => {
            const modal = document.getElementById('feedbackModal');
            if (modal) {
              modal.classList.add('show');
              document.body.style.overflow = 'hidden';
            }
          }, 1000);
          sendResponse({ success: true, fallback: true });
        }
      };
      
      tryOpenModal();
    }
    return true;
  });
}

// Add some visual animations
document.addEventListener('DOMContentLoaded', () => {
  // Animate feature cards on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observe feature cards
  document.querySelectorAll('.feature-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
  });

  // Add typing effect to hero text
  const heroText = document.querySelector('.hero-text');
  if (heroText) {
    const text = heroText.textContent;
    heroText.textContent = '';
    let i = 0;
    
    const typeEffect = setInterval(() => {
      heroText.textContent += text.charAt(i);
      i++;
      if (i > text.length) {
        clearInterval(typeEffect);
      }
    }, 30);
  }
});