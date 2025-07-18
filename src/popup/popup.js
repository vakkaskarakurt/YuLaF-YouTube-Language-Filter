document.addEventListener('DOMContentLoaded', async () => {
  const enableFilter = document.getElementById('enableFilter');
  const statusDiv = document.getElementById('status');
  
  try {
    // Load current settings
    const result = await chrome.storage.sync.get(['filterEnabled']);
    const isEnabled = result.filterEnabled !== false;
    enableFilter.checked = isEnabled;
    
    // Update status
    updateStatus(isEnabled);
    
    // Toggle listener
    enableFilter.addEventListener('change', async () => {
      const newState = enableFilter.checked;
      
      try {
        // Save settings (bu her zaman çalışır)
        await chrome.storage.sync.set({
          filterEnabled: newState
        });
        
        console.log(`✅ Settings saved: ${newState}`);
        
        // Update status immediately
        updateStatus(newState);
        
        // Try to notify active tab (optional - başarısız olsa da sorun değil)
        notifyActiveTabSilently(newState);
        
      } catch (error) {
        console.warn('Settings save error:', error);
        // Revert UI if save failed
        enableFilter.checked = !newState;
        updateStatus(!newState, 'Error saving settings');
      }
    });
    
  } catch (error) {
    console.error('Popup initialization error:', error);
    updateStatus(false, 'Error loading settings');
  }
});

// 🔕 Silent notification (hata vermez)
function notifyActiveTabSilently(enabled) {
  // Promise kullanmaz, async değil - hata vermez
  chrome.tabs.query({
    active: true, 
    currentWindow: true,
    url: 'https://www.youtube.com/*'
  }, (tabs) => {
    if (chrome.runtime.lastError) {
      // Hata varsa sessizce logla
      console.log('No active YouTube tab');
      return;
    }
    
    if (tabs && tabs[0]) {
      // Message gönder, response beklemez
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'toggleFilter',
        enabled: enabled
      }, (response) => {
        if (chrome.runtime.lastError) {
          // Hata varsa sessizce logla
          console.log('Content script not ready, settings saved anyway');
        } else {
          console.log('✅ Filter state updated on active tab');
        }
      });
    }
  });
}

// Status updater
function updateStatus(isEnabled, customMessage = null) {
  const statusDiv = document.getElementById('status');
  if (statusDiv) {
    if (customMessage) {
      statusDiv.textContent = customMessage;
      statusDiv.className = 'error';
    } else {
      statusDiv.textContent = isEnabled ? '✅ Filter: ON' : '❌ Filter: OFF';
      statusDiv.className = isEnabled ? 'enabled' : 'disabled';
    }
  }
}