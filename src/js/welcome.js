// src/js/welcome.js
import { StateManager } from '../ui/state-manager.js';
import { ProgressManager } from '../ui/progress-manager.js';
import { LanguageManager } from '../ui/language-manager.js';

class WelcomeController {
  constructor() {
    this.stateManager = new StateManager();
    this.progressManager = new ProgressManager(this.stateManager);
    this.languageManager = new LanguageManager(this.stateManager);
    this.init();
  }

  async init() {
    await this.languageManager.loadLanguages();
    this.setupEventListeners();
    this.languageManager.populateLanguageSelections();
    this.progressManager.updateUI();
    this.progressManager.startAutoProgress();
  }

  setupEventListeners() {
    // Navigation
    document.getElementById('prevBtn')?.addEventListener('click', () => this.prevStep());
    document.getElementById('nextBtn')?.addEventListener('click', () => this.nextStep());

    document.querySelectorAll('.step').forEach(step => {
      step.addEventListener('click', () => {
        const stepNum = parseInt(step.dataset.step, 10);
        if (stepNum <= this.stateManager.currentStep + 1) this.goToStep(stepNum);
      });
    });

    // Search
    document.getElementById('languageSearch')?.addEventListener('input', (e) =>
      this.languageManager.filterLanguages(e.target.value)
    );

    // Final actions
    document.getElementById('goToYouTube')?.addEventListener('click', () => this.goToYouTube());
    document.getElementById('rateUsHeaderBtn')?.addEventListener('click', () => this.handleRateUsClick());

    // Keyboard
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  handleKeyboard(e) {
    if (e.key === 'ArrowRight' || e.key === 'Enter') {
      if (this.stateManager.currentStep < this.stateManager.totalSteps) this.nextStep();
    }
    if (e.key === 'ArrowLeft' && this.stateManager.currentStep > 1) this.prevStep();
  }

  nextStep() {
    this.progressManager.stopAutoProgress();
    if (this.stateManager.nextStep()) {
      this.progressManager.updateUI();
      this.stateManager.currentStep === 4
        ? this.stateManager.finalizeSetup()
        : this.progressManager.startAutoProgress();
    }
  }

  prevStep() {
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
    if (chrome?.tabs) {
      chrome.tabs.create({ url: 'https://www.youtube.com' });
      window.close();
    } else {
      window.open('https://www.youtube.com', '_blank');
    }
  }

  handleRateUsClick() {
    window.open(
      'https://chromewebstore.google.com/detail/yulaf-youtube-language-fi/ejfoldoabjeidjdddhomeaojicaemdpm',
      '_blank'
    );
  }
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  window.welcomeController = new WelcomeController();

  // Feature card animations
  const observer = new IntersectionObserver(
    (entries) => entries.forEach(e => e.isIntersecting && Object.assign(e.target.style, {
      opacity: '1', transform: 'translateY(0)'
    })),
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  document.querySelectorAll('.feature-card').forEach(card => {
    Object.assign(card.style, {
      opacity: '0',
      transform: 'translateY(20px)',
      transition: 'opacity 0.6s ease, transform 0.6s ease'
    });
    observer.observe(card);
  });

  // Typing effect
  const heroText = document.querySelector('.hero-text');
  if (heroText) {
    const text = heroText.textContent;
    heroText.textContent = '';
    let i = 0;
    const typeEffect = setInterval(() => {
      heroText.textContent += text.charAt(i++);
      if (i > text.length) clearInterval(typeEffect);
    }, 30);
  }
});
