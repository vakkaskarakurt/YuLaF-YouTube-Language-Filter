class SettingsManager {
  constructor() {
    this.isEnabled = true;
    this.callbacks = [];

    // Storage change listener ekle (popup ile sync için)
    this.setupStorageListener();
  }

  async loadSettings() {
    const result = await chrome.storage.sync.get(["filterEnabled"]);
    this.isEnabled = result.filterEnabled !== false;
    return this.isEnabled;
  }

  async saveSettings(settings) {
    await chrome.storage.sync.set(settings);
    this.isEnabled = settings.filterEnabled !== false;
    this.notifyCallbacks();
  }

  onSettingsChange(callback) {
    this.callbacks.push(callback);
  }

  notifyCallbacks() {
    this.callbacks.forEach((callback) => callback(this.isEnabled));
  }

  // 🔄 Storage değişikliklerini dinle (popup'tan gelen değişiklikler için)
  setupStorageListener() {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === "sync" && changes.filterEnabled) {
        const newValue = changes.filterEnabled.newValue;
        if (newValue !== this.isEnabled) {
          console.log(`📢 Settings changed via popup: ${newValue}`);
          this.isEnabled = newValue !== false;
          this.notifyCallbacks();
        }
      }
    });
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("📨 Message received:", message);

      try {
        if (message.action === "toggleFilter") {
          console.log(`🔄 Manual toggle: ${message.enabled}`);
          this.isEnabled = message.enabled;
          this.notifyCallbacks();
          sendResponse({ success: true, state: message.enabled });
        } else if (message.action === "getStatus") {
          sendResponse({
            success: true,
            enabled: this.isEnabled,
          });
        }
      } catch (error) {
        console.error("Message handling error:", error);
        sendResponse({ success: false, error: error.message });
      }

      return true; // Keep message channel open
    });
  }
}
