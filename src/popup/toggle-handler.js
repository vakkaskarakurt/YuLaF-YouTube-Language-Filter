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

    this.updateUI(newEnabled, this.currentState.strictMode, this.currentState.languageLockEnabled);

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

  async handleLanguageLockChange(e) {
    const nextValue = e.target.checked;

    if (!nextValue && this.currentState.languageLockHash) {
      const provided = prompt('Enter language lock password to unlock languages:');
      if (provided === null) {
        e.target.checked = true;
        return;
      }

      const hashed = await this.hashPassword(provided);
      if (hashed !== this.currentState.languageLockHash) {
        alert('Incorrect password. Languages remain locked.');
        e.target.checked = true;
        return;
      }
    }

    this.uiManager.updateLanguageLockUI(nextValue);

    try {
      const success = await this.storageManager.saveState({ languageLockEnabled: nextValue }, this.tab, false);
      if (success) {
        this.currentState.languageLockEnabled = nextValue;
      } else {
        this.revertLanguageLockChange(e, !nextValue);
      }
    } catch (err) {
      console.error('Language lock toggle error:', err);
      this.revertLanguageLockChange(e, !nextValue);
    }
  }

  async handlePasswordSubmit(e) {
    e.preventDefault();
    const passwordInput = document.getElementById('languageLockPassword');
    const password = passwordInput?.value || '';

    if (!password.trim()) {
      this.uiManager.setLockPasswordStatus('Enter a password to save.', 'warning');
      return;
    }

    try {
      const hash = await this.hashPassword(password.trim());
      const success = await this.storageManager.saveState({ languageLockHash: hash }, this.tab, false);
      if (success) {
        this.currentState.languageLockHash = hash;
        passwordInput.value = '';
        this.uiManager.setLockPasswordStatus('Password saved.', 'success');
      } else {
        this.uiManager.setLockPasswordStatus('Could not save password. Try again.', 'error');
      }
    } catch (err) {
      console.error('Password save error:', err);
      this.uiManager.setLockPasswordStatus('Unexpected error while saving password.', 'error');
    }
  }

  async handlePasswordClear() {
    if (!this.currentState.languageLockHash) {
      this.uiManager.setLockPasswordStatus('No password set.', 'info');
      return;
    }

    const provided = prompt('Enter current password to remove language lock password:');
    if (provided === null) return;

    try {
      const hashed = await this.hashPassword(provided);
      if (hashed !== this.currentState.languageLockHash) {
        alert('Incorrect password. Password was not cleared.');
        return;
      }

      const updates = { languageLockHash: null };
      if (this.currentState.languageLockEnabled) {
        updates.languageLockEnabled = false;
        this.uiManager.updateLanguageLockUI(false);
      }

      const success = await this.storageManager.saveState(updates, this.tab, false);
      if (success) {
        this.currentState.languageLockHash = null;
        this.currentState.languageLockEnabled = updates.languageLockEnabled ?? this.currentState.languageLockEnabled;
        this.uiManager.setLockPasswordStatus('Password cleared.', 'success');
        const toggle = document.getElementById('languageLockToggle');
        if (toggle) toggle.checked = false;
      } else {
        this.uiManager.setLockPasswordStatus('Could not clear password. Try again.', 'error');
      }
    } catch (err) {
      console.error('Password clear error:', err);
      this.uiManager.setLockPasswordStatus('Unexpected error while clearing password.', 'error');
    }
  }

  updateToggles(state) {
    const enableFilter = document.getElementById('enableFilter');
    const strictModeToggle = document.getElementById('strictModeToggle');
    const languageLockToggle = document.getElementById('languageLockToggle');

    if (enableFilter) enableFilter.checked = state.enabled;
    if (strictModeToggle) strictModeToggle.checked = state.strictMode;
    if (languageLockToggle) languageLockToggle.checked = state.languageLockEnabled;

    this.updateUI(state.enabled, state.strictMode, state.languageLockEnabled);
    this.uiManager.setLockPasswordStatus(state.languageLockHash ? 'Password set.' : 'Password not set.', state.languageLockHash ? 'info' : 'warning');
  }

  setupEventListeners() {
    document.getElementById('enableFilter')
      ?.addEventListener('change', (e) => this.handleEnableChange(e));

    document.getElementById('strictModeToggle')
      ?.addEventListener('change', (e) => this.handleStrictModeChange(e));

    document.getElementById('languageLockToggle')
      ?.addEventListener('change', (e) => this.handleLanguageLockChange(e));

    document.getElementById('lockPasswordForm')
      ?.addEventListener('submit', (e) => this.handlePasswordSubmit(e));

    document.getElementById('clearLockPassword')
      ?.addEventListener('click', () => this.handlePasswordClear());
  }

  // --- Helpers ---
  updateUI(enabled, strictMode, languageLockEnabled) {
    this.uiManager.updateStatusText(enabled);
    this.uiManager.updateStrictModeUI(enabled, strictMode);
    this.uiManager.updateLanguageSelectorVisibility(enabled);
    this.uiManager.updateLanguageLockUI(languageLockEnabled);
  }

  revertEnableChange(e, fallbackEnabled) {
    e.target.checked = fallbackEnabled;
    this.updateUI(fallbackEnabled, this.currentState.strictMode, this.currentState.languageLockEnabled);
    alert('⚠️ Settings could not be saved. Please try again.');
  }

  revertStrictModeChange(e, fallbackStrict) {
    e.target.checked = fallbackStrict;
    this.uiManager.updateStrictModeUI(this.currentState.enabled, fallbackStrict);
    alert('⚠️ Settings could not be saved. Please try again.');
  }

  revertLanguageLockChange(e, fallbackLock) {
    e.target.checked = fallbackLock;
    this.uiManager.updateLanguageLockUI(this.currentState.languageLockEnabled);
    alert('⚠️ Settings could not be saved. Please try again.');
  }

  async hashPassword(password) {
    const encoded = new TextEncoder().encode(password);
    const buffer = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}
