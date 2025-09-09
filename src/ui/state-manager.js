export class StateManager {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 4;
    this.selectedLanguages = ['en'];
  }

  /** 🔹 Sonraki adıma geç */
  nextStep() {
    if (this.currentStep >= this.totalSteps) return false;

    // Step 3 → Dil seçimi kontrolü
    if (this.currentStep === 3 && this.selectedLanguages.length === 0) {
      alert('Please select at least one language.');
      return false;
    }

    this.currentStep++;
    return true;
  }

  /** 🔹 Önceki adıma dön */
  prevStep() {
    if (this.currentStep <= 1) return false;

    this.currentStep--;
    return true;
  }

  /** 🔹 Belirli bir adıma git */
  goToStep(stepNum) {
    if (stepNum < 1 || stepNum > this.totalSteps) return false;

    this.currentStep = stepNum;
    return true;
  }

  /** 🔹 Dil seçimini aç/kapat */
  toggleLanguage(code) {
    const exists = this.selectedLanguages.includes(code);

    if (exists) {
      this.selectedLanguages = this.selectedLanguages.filter(lang => lang !== code);
    } else {
      this.selectedLanguages.push(code);
    }
  }

  /** 🔹 Kurulumu tamamla ve ayarları kaydet */
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
      console.error('Could not finalize setup:', error);
    }
  }
}
