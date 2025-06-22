// popup.js
document.addEventListener('DOMContentLoaded', function() {
  const toggle = document.getElementById('toggle');
  const status = document.getElementById('status');
  
  // Load current state
  chrome.storage.sync.get(['filterEnabled'], function(result) {
    const isEnabled = result.filterEnabled !== false; // Default to true
    updateUI(isEnabled);
  });
  
  // Toggle click handler
  toggle.addEventListener('click', function() {
    chrome.storage.sync.get(['filterEnabled'], function(result) {
      const currentState = result.filterEnabled !== false;
      const newState = !currentState;
      
      chrome.storage.sync.set({ filterEnabled: newState }, function() {
        updateUI(newState);
        
        // Send message to content script
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs[0].url.includes('youtube.com')) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'toggleFilter',
              enabled: newState
            });
          }
        });
      });
    });
  });
  
  function updateUI(isEnabled) {
    if (isEnabled) {
      toggle.classList.add('active');
      status.textContent = '✓ Filter is active - Showing only English content';
      status.style.color = '#4CAF50';
    } else {
      toggle.classList.remove('active');
      status.textContent = '✗ Filter is disabled - Showing all content';
      status.style.color = '#f44336';
    }
  }
});