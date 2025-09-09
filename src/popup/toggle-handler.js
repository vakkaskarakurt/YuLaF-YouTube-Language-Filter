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

    this.updateUI(newEnabled, this.currentState.strictMode);

    try {
      const success = await this.storageManager.saveState({ enabled: newEnabled }, this.tab, true);
      if (success) {
        this.currentState.enabled = newEnabled;
      } else {
        this.revertEnableChange(e, !newEnabled);
      }
    } catch (err) {
      console.error('Enable toggle error:', err);
      this.revertEnableChange(e, !newEnabled);
    }
  }

  async handleStrictModeChange(e) {
    const newStrictMode = e.target.checked;

    this.uiManager.updateStrictModeUI(this.currentState.enabled, newStrictMode);

    try {
      const success = await this.storageManager.saveState({ strictMode: newStrictMode }, this.tab, true);
      if (success) {
        this.currentState.strictMode = newStrictMode;
      } else {
        this.revertStrictModeChange(e, !newStrictMode);
      }
    } catch (err) {
      console.error('Strict mode toggle error:', err);
      this.revertStrictModeChange(e, !newStrictMode);
    }
  }

  updateToggles(state) {
    const enableFilter = document.getElementById('enableFilter');
    const strictModeToggle = document.getElementById('strictModeToggle');

    if (enableFilter) enableFilter.checked = state.enabled;
    if (strictModeToggle) strictModeToggle.checked = state.strictMode;

    this.updateUI(state.enabled, state.strictMode);
  }

  setupEventListeners() {
    document.getElementById('enableFilter')
      ?.addEventListener('change', (e) => this.handleEnableChange(e));

    document.getElementById('strictModeToggle')
      ?.addEventListener('change', (e) => this.handleStrictModeChange(e));
  }

  // --- Helpers ---
  updateUI(enabled, strictMode) {
    this.uiManager.updateStatusText(enabled);
    this.uiManager.updateStrictModeUI(enabled, strictMode);
    this.uiManager.updateLanguageSelectorVisibility(enabled);
  }

  revertEnableChange(e, fallbackEnabled) {
    e.target.checked = fallbackEnabled;
    this.updateUI(fallbackEnabled, this.currentState.strictMode);
    alert('⚠️ Settings could not be saved. Please try again.');
  }

  revertStrictModeChange(e, fallbackStrict) {
    e.target.checked = fallbackStrict;
    this.uiManager.updateStrictModeUI(this.currentState.enabled, fallbackStrict);
    alert('⚠️ Settings could not be saved. Please try again.');
  }
}
