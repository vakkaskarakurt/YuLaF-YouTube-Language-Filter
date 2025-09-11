export class ProgressManager {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.autoProgressTimer = null;
  }

  /** 🔹 Otomatik ilerlemeyi başlat */
  startAutoProgress() {
    const stepDurations = {
      1: 10000, // Welcome
      2: 10000, // How it works
      3: 0,     // Language selection
      4: 0      // Final step
    };

    const duration = stepDurations[this.stateManager.currentStep] || 0;

    if (duration > 0) {
      this.autoProgressTimer = setTimeout(() => this.autoAdvance(), duration);
    }
  }

  /** 🔹 Otomatik ilerlemeyi durdur */
  stopAutoProgress() {
    if (this.autoProgressTimer) {
      clearTimeout(this.autoProgressTimer);
      this.autoProgressTimer = null;
    }
    this.hideAutoProgressIndicator();
  }

  /** 🔹 Timer tetiklendiğinde adım ilerlet */
  autoAdvance() {
    const { currentStep } = this.stateManager;
    if (currentStep === 1 || currentStep === 2) {
      this.stateManager.nextStep();
    }
  }

  /** 🔹 Progress indicator’ı gizle */
  hideAutoProgressIndicator() {
    const indicator = document.getElementById('autoProgressIndicator');
    const fill = document.getElementById('autoProgressFill');

    if (indicator) indicator.classList.remove('visible');
    if (fill) {
      fill.style.width = '0%';
      fill.style.transition = 'none';
    }
  }

  /** 🔹 Progress bar genişliğini güncelle */
  updateProgressBar() {
    const progressSteps = document.querySelector('.progress-steps');
    if (!progressSteps) return;

    const percentage = ((this.stateManager.currentStep - 1) / (this.stateManager.totalSteps - 1)) * 100;
    progressSteps.style.setProperty('--progress-width', `${percentage}%`);
  }

  /** 🔹 Step numaralarını güncelle */
  updateSteps() {
    document.querySelectorAll('.step').forEach((step, index) => {
      const stepNum = index + 1;
      step.classList.remove('active', 'completed');

      if (stepNum === this.stateManager.currentStep) {
        step.classList.add('active');
      } else if (stepNum < this.stateManager.currentStep) {
        step.classList.add('completed');
      }
    });
  }

  /** 🔹 Navigasyon butonlarını güncelle */
  updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn) {
      prevBtn.disabled = this.stateManager.currentStep <= 1;
    }

    if (nextBtn) {
      const atLastStep = this.stateManager.currentStep >= this.stateManager.totalSteps;
      nextBtn.style.display = atLastStep ? 'none' : 'block';
      if (!atLastStep) nextBtn.textContent = 'Next →';
    }
  }

  /** 🔹 İçerik bölümlerini güncelle */
  updateContentSections() {
    document.querySelectorAll('.section').forEach((section, index) => {
      section.classList.toggle('active', index + 1 === this.stateManager.currentStep);
    });
  }

  /** 🔹 Tüm UI öğelerini güncelle */
  updateUI() {
    this.updateSteps();
    this.updateProgressBar();
    this.updateContentSections();
    this.updateNavigationButtons();

    // Yukarıya smooth scroll
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
