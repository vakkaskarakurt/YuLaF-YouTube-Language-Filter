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
      // Save state and force badge update
      const success = await this.storageManager.saveState({ enabled: newEnabled }, this.tab, true);
      
      if (success) {
        this.currentState.enabled = newEnabled;
        
        // Force badge update through runtime message
        try {
          await chrome.runtime.sendMessage({ 
            action: 'updateBadge', 
            enabled: newEnabled 
          });
        } catch (err) {
          // If background script is not responding, update directly
          await this.updateBadgeDirectly(newEnabled);
        }
      } else {
        this.revertEnableChange(e, !newEnabled);
      }
    } catch (err) {
      console.error('Enable toggle error:', err);
      this.revertEnableChange(e, !newEnabled);
    }
  }

  async updateBadgeDirectly(enabled) {
    try {
      const badgeText = enabled ? 'ON' : 'OFF';
      const badgeColor = enabled ? '#CC0000' : '#666666';  // Darker color for white text contrast
      const white = '#FFFFFF';

      // Ensure badge text color is white (global)
      if (chrome.action.setBadgeTextColor) {
        await chrome.action.setBadgeTextColor({ color: white });
      }

      // Update badge for current tab (global calls)
      await chrome.action.setBadgeText({ text: badgeText });
      await chrome.action.setBadgeBackgroundColor({ color: badgeColor });

      // Also update for current tab specifically (if tab context exists)
      if (this.tab && this.tab.id) {
        // Ensure tab-specific badge text color is white (if API supports tabId)
        if (chrome.action.setBadgeTextColor) {
          try {
            await chrome.action.setBadgeTextColor({ color: white, tabId: this.tab.id });
          } catch (err) {
            // Some environments may not accept tabId for setBadgeTextColor; ignore and continue
          }
        }

        await chrome.action.setBadgeText({ text: badgeText, tabId: this.tab.id });
        await chrome.action.setBadgeBackgroundColor({ color: badgeColor, tabId: this.tab.id });
      }
    } catch (error) {
      console.error('Error updating badge directly:', error);
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
    
    // Ensure badge is updated when popup opens
    this.updateBadgeDirectly(state.enabled);
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