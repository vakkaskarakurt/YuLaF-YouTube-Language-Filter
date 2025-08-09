export class ToggleHandler {
  constructor(storageManager, uiManager, tab) {
    this.storageManager = storageManager;
    this.uiManager = uiManager;
    this.tab = tab;
    this.currentState = {};
  }

  setCurrentState(state) {
    this.currentState = state;
  }

  async handleEnableChange(e) {
    const newEnabled = e.target.checked;
    this.uiManager.updateStatusText(newEnabled);
    this.uiManager.updateStrictModeUI(newEnabled, this.currentState.strictMode);
    this.uiManager.updateLanguageSelectorVisibility(newEnabled);
    
    const success = await this.storageManager.saveState({ enabled: newEnabled }, this.tab, true);
    
    if (success) {
      this.currentState.enabled = newEnabled;
    } else {
      // Revert UI on failure
      e.target.checked = !newEnabled;
      this.uiManager.updateStatusText(!newEnabled);
      this.uiManager.updateStrictModeUI(!newEnabled, this.currentState.strictMode);
      this.uiManager.updateLanguageSelectorVisibility(!newEnabled);
      alert('Settings could not be saved. Please try again.');
    }
  }

  async handleStrictModeChange(e) {
    const newStrictMode = e.target.checked;
    this.uiManager.updateStrictModeUI(this.currentState.enabled, newStrictMode);
    
    const success = await this.storageManager.saveState({ strictMode: newStrictMode }, this.tab, true);
    
    if (success) {
      this.currentState.strictMode = newStrictMode;
    } else {
      // Revert UI on failure
      e.target.checked = !newStrictMode;
      this.uiManager.updateStrictModeUI(this.currentState.enabled, !newStrictMode);
      alert('Settings could not be saved. Please try again.');
    }
  }

  updateToggles(state) {
    const enableFilter = document.getElementById('enableFilter');
    const strictModeToggle = document.getElementById('strictModeToggle');
    
    if (enableFilter) enableFilter.checked = state.enabled;
    if (strictModeToggle) strictModeToggle.checked = state.strictMode;
    
    this.uiManager.updateStatusText(state.enabled);
    this.uiManager.updateStrictModeUI(state.enabled, state.strictMode);
    this.uiManager.updateLanguageSelectorVisibility(state.enabled);
  }

  setupEventListeners() {
    const enableFilter = document.getElementById('enableFilter');
    const strictModeToggle = document.getElementById('strictModeToggle');
    
    if (enableFilter) {
      enableFilter.addEventListener('change', (e) => this.handleEnableChange(e));
    }
    
    if (strictModeToggle) {
      strictModeToggle.addEventListener('change', (e) => this.handleStrictModeChange(e));
    }
  }
}