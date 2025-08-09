export class ProgressManager {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.autoProgressTimer = null;
  }

  startAutoProgress() {
    const stepDurations = {
      1: 10000,  // Welcome - 10 seconds
      2: 10000,  // How it works - 10 seconds  
      3: 0,      // Language selection - no auto progress
      4: 0       // Final step
    };

    const duration = stepDurations[this.stateManager.currentStep] || 0;
    
    if (duration > 0) {
      this.autoProgressTimer = setTimeout(() => {
        this.autoAdvance();
      }, duration);
    }
  }

  stopAutoProgress() {
    if (this.autoProgressTimer) {
      clearTimeout(this.autoProgressTimer);
      this.autoProgressTimer = null;
    }
    this.hideAutoProgressIndicator();
  }

  autoAdvance() {
    if (this.stateManager.currentStep === 1 || this.stateManager.currentStep === 2) {
      this.stateManager.nextStep();
    }
  }

  hideAutoProgressIndicator() {
    const indicator = document.getElementById('autoProgressIndicator');
    const fill = document.getElementById('autoProgressFill');
    
    if (indicator) indicator.classList.remove('visible');
    if (fill) {
      fill.style.width = '0%';
      fill.style.transition = 'none';
    }
  }

  updateProgressBar() {
    const progressSteps = document.querySelector('.progress-steps');
    const progressWidth = ((this.stateManager.currentStep - 1) / (this.stateManager.totalSteps - 1)) * 100;
    
    if (progressSteps) {
      progressSteps.style.setProperty('--progress-width', `${progressWidth}%`);
    }
  }

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

  updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn) {
      prevBtn.disabled = this.stateManager.currentStep <= 1;
    }

    if (nextBtn) {
      if (this.stateManager.currentStep >= this.stateManager.totalSteps) {
        nextBtn.style.display = 'none';
      } else {
        nextBtn.style.display = 'block';
        nextBtn.textContent = 'Next →';
      }
    }
  }

  updateContentSections() {
    document.querySelectorAll('.section').forEach((section, index) => {
      const sectionNum = index + 1;
      if (sectionNum === this.stateManager.currentStep) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });
  }

  updateUI() {
    this.updateSteps();
    this.updateProgressBar();
    this.updateContentSections();
    this.updateNavigationButtons();
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}