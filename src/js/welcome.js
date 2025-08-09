// src/js/welcome.js
import { StateManager } from '../ui/state-manager.js';
import { ProgressManager } from '../ui/progress-manager.js';
import { LanguageManager } from '../ui/language-manager.js';
import { ModalManager } from '../ui/modal-manager.js';

class WelcomeController {
  constructor() {
    this.stateManager = new StateManager();
    this.progressManager = new ProgressManager(this.stateManager);
    this.languageManager = new LanguageManager(this.stateManager);
    this.modalManager = new ModalManager();
    
    this.init();
  }

  async init() {
    // Load languages
    await this.languageManager.loadLanguages();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Setup UI
    this.languageManager.populateLanguageSelections();
    this.progressManager.updateUI();
    
    // Start auto progress
    this.progressManager.startAutoProgress();
  }

  setupEventListeners() {
    // Navigation buttons
    document.getElementById('prevBtn')?.addEventListener('click', () => this.prevStep());
    document.getElementById('nextBtn')?.addEventListener('click', () => this.nextStep());

    // Step navigation
    document.querySelectorAll('.step').forEach(step => {
      step.addEventListener('click', () => {
        const stepNum = parseInt(step.dataset.step);
        if (stepNum <= this.stateManager.currentStep || stepNum === this.stateManager.currentStep + 1) {
          this.goToStep(stepNum);
        }
      });
    });

    // Language search
    const searchInput = document.getElementById('languageSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.languageManager.filterLanguages(e.target.value));
    }

    // Final action buttons
    const goToYouTubeBtn = document.getElementById('goToYouTube');
    if (goToYouTubeBtn) {
      goToYouTubeBtn.addEventListener('click', () => this.goToYouTube());
    }

    // Rate us header button
    const rateUsHeaderBtn = document.getElementById('rateUsHeaderBtn');
    if (rateUsHeaderBtn) {
      rateUsHeaderBtn.addEventListener('click', () => this.handleRateUsClick());
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      // Close feedback modal with ESC
      if (e.key === 'Escape') {
        const modal = document.getElementById('feedbackModal');
        if (modal && modal.classList.contains('show')) {
          this.modalManager.closeModal();
          return;
        }
      }
      
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (this.stateManager.currentStep < this.stateManager.totalSteps) this.nextStep();
      } else if (e.key === 'ArrowLeft') {
        if (this.stateManager.currentStep > 1) this.prevStep();
      }
    });
  }

  nextStep() {
    // Stop auto progress on user interaction
    this.progressManager.stopAutoProgress();
    
    if (this.stateManager.nextStep()) {
      this.progressManager.updateUI();
      
      // Auto-save settings when reaching final step
      if (this.stateManager.currentStep === 4) {
        this.stateManager.finalizeSetup();
      } else {
        // Restart auto progress for new step
        this.progressManager.startAutoProgress();
      }
    }
  }

  prevStep() {
    // Stop auto progress on user interaction
    this.progressManager.stopAutoProgress();
    
    if (this.stateManager.prevStep()) {
      this.progressManager.updateUI();
      this.progressManager.startAutoProgress();
    }
  }

  goToStep(stepNum) {
    this.progressManager.stopAutoProgress();
    if (this.stateManager.goToStep(stepNum)) {
      this.progressManager.updateUI();
      this.progressManager.startAutoProgress();
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.welcomeController = new WelcomeController();
});

// Listen for messages from popup
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openFeedback') {
      let attempts = 0;
      const maxAttempts = 5;
      
      const tryOpenModal = () => {
        attempts++;
        if (window.welcomeController?.modalManager) {
          window.welcomeController.modalManager.openModal();
          sendResponse({ success: true });
          return;
        }
        
        if (attempts < maxAttempts) {
          setTimeout(tryOpenModal, 500);
        } else {
          // Fallback to DOM manipulation
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

// Add visual animations
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