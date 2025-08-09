export class StateManager {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 4;
    this.selectedLanguages = ['en'];
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      // Validation for step 3 (language selection)
      if (this.currentStep === 3 && this.selectedLanguages.length === 0) {
        alert('Please select at least one language.');
        return false;
      }
      
      this.currentStep++;
      return true;
    }
    return false;
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      return true;
    }
    return false;
  }

  goToStep(stepNum) {
    if (stepNum >= 1 && stepNum <= this.totalSteps) {
      this.currentStep = stepNum;
      return true;
    }
    return false;
  }

  toggleLanguage(code) {
    const index = this.selectedLanguages.indexOf(code);
    
    if (index === -1) {
      this.selectedLanguages.push(code);
    } else {
      this.selectedLanguages.splice(index, 1);
    }
  }

  async finalizeSetup() {
    try {
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
}