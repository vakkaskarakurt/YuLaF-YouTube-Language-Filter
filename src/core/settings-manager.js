class SettingsManager {
  constructor() {
    this.isEnabled = true;
    this.onSettingsChangeCallback = null;
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['filterEnabled']);
      this.isEnabled = result.filterEnabled !== false;
      console.log(`⚙️ Settings loaded: filter ${this.isEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('❌ Error loading settings:', error);
      this.isEnabled = true;
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.sync.set({
        filterEnabled: this.isEnabled
      });
      console.log(`💾 Settings saved: filter ${this.isEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('❌ Error saving settings:', error);
    }
  }

  onSettingsChange(callback) {
    this.onSettingsChangeCallback = callback;
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'toggleFilter') {
        this.isEnabled = message.enabled;
        if (this.onSettingsChangeCallback) {
          this.onSettingsChangeCallback(this.isEnabled);
        }
        
        try {
          chrome.runtime.sendMessage({
            action: 'filterToggled',
            enabled: this.isEnabled
          });
        } catch (error) {
          // Silent error - popup might not be open
        }
      }
      
      // 🆕 Natural işlemler için mesaj handler
      if (message.action === 'performNaturalActions') {
        this.handleNaturalActions(sendResponse);
        return true; // Async response için
      }
      
      if (message.action === 'videoFiltered') {
        try {
          chrome.runtime.sendMessage({
            action: 'videoListUpdated'
          });
        } catch (error) {
          // Silent error - popup might not be open
        }
      }
    });
  }

  // 🆕 Natural işlemleri yönet
  async handleNaturalActions(sendResponse) {
    try {
      // VideoProcessor'den natural işlemleri çağır
      if (window.youtubeFilter && window.youtubeFilter.videoProcessor) {
        const result = await window.youtubeFilter.videoProcessor.performNaturalActions();
        sendResponse({
          success: true,
          processed: result.processed,
          errors: result.errors
        });
      } else {
        sendResponse({
          success: false,
          error: 'VideoProcessor not available'
        });
      }
    } catch (error) {
      console.error('❌ Natural actions error:', error);
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }

  async toggleFilter() {
    this.isEnabled = !this.isEnabled;
    await this.saveSettings();
    
    if (this.onSettingsChangeCallback) {
      this.onSettingsChangeCallback(this.isEnabled);
    }
  }
}
