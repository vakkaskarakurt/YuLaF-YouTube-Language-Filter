export class UIManager {
  constructor() {
    this.container = document.querySelector('.container');
  }

  showLoaded() {
    if (this.container) {
      this.container.classList.add('loaded');
      this.container.style.opacity = '1';
    }
  }

  updateStatusText(enabled) {
    const statusText = document.getElementById('statusText');
    if (statusText) {
      statusText.textContent = enabled ? 'Filter Enabled' : 'Filter Disabled';
      statusText.style.color = enabled ? '#ff0000' : '#aaa';
    }
  }

  updateStrictModeUI(filterEnabled, strictModeEnabled) {
    const strictModeToggle = document.getElementById('strictModeToggle');
    const strictModeText = document.getElementById('strictModeText');
    const toggleGroup = strictModeToggle?.closest('.toggle-group');
    
    if (filterEnabled) {
      toggleGroup?.classList.remove('disabled');
      if (strictModeText) {
        strictModeText.style.color = strictModeEnabled ? 'var(--text-primary)' : 'var(--text-secondary)';
      }
    } else {
      toggleGroup?.classList.add('disabled');
      if (strictModeText) {
        strictModeText.style.color = 'var(--text-secondary)';
      }
    }
  }

  updateLanguageSelectorVisibility(enabled) {
    const languageSelector = document.querySelector('.language-selector');
    if (languageSelector) {
      if (enabled) {
        languageSelector.classList.remove('disabled');
      } else {
        languageSelector.classList.add('disabled');
      }
    }
  }

  updateSelectedCount(count) {
    const selectedCount = document.getElementById('selectedCount');
    if (selectedCount) {
      selectedCount.textContent = count;
    }
  }

  updateSortUI(currentSortBy) {
    const sortText = document.querySelector('.sort-text');
    if (sortText) {
      sortText.textContent = 'Sort by';
    }
    
    const sortOptions = document.querySelectorAll('.sort-option');
    sortOptions.forEach(option => {
      option.classList.remove('active');
      if (option.dataset.sort === currentSortBy) {
        option.classList.add('active');
      }
    });
  }

  showNonYouTubePage() {
    document.body.style.cssText = 'margin: 0; padding: 0; overflow: hidden;';
    document.body.innerHTML = `
      <div style="
        width: 380px;
        min-height: 400px;
        padding: 40px 30px;
        background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
        color: #fff;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 18px;
        box-sizing: border-box;
        margin: 0;
        position: relative;
        opacity: 1;
      ">
        <div style="
          width: 80px;
          height: 80px;
          background: linear-gradient(45deg, #ff0000, #ff4444);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          box-shadow: 0 8px 25px rgba(255, 0, 0, 0.3);
          margin-bottom: 10px;
        ">
          🎯
        </div>
        
        <h2 style="
          margin: 0;
          font-size: 1.4rem;
          font-weight: 600;
          color: #fff;
          line-height: 1.3;
        ">
          YuLaF is Ready!
        </h2>
        
        <p style="
          margin: 0;
          font-size: 1rem;
          color: #ccc;
          line-height: 1.5;
          max-width: 280px;
        ">
          Please visit <strong style="color: #ff4444;">YouTube</strong> to start filtering videos by language.
        </p>
        
        <button id="goToYouTubeBtn" style="
          background-color: #ff0000;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 10px;
          display: flex; justify-content: center; align-items: center;
        ">
          Go to YouTube
        </button>
        
        <div style="
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #333;
          width: 100%;
          max-width: 280px;
          justify-content: center;
        ">
          <button id="guideBtn" style="
            background-color: #ff0000;
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 6px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            flex: 1;
            min-width: 80px;
            display: flex; justify-content: center; align-items: center;
          ">
            Guide
          </button>
          
          <button id="feedbackBtn" style="
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 6px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            flex: 1;
            min-width: 80px;
            display: flex; justify-content: center; align-items: center;
          ">
            Feedback
          </button>

          <button id="rateUsBtn" style="
            background-color: #FFA500;
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 6px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            flex: 1;
            min-width: 80px;
            display: flex; justify-content: center; align-items: center;
          ">
            Rate Us
          </button>
        </div>
        
        <p style="
          margin: 15px 0 0 0;
          font-size: 0.8rem;
          color: #666;
          font-style: italic;
        ">
          YouTube Language Filter
        </p>
      </div>
    `;
  }

  setupNonYouTubeEventListeners() {
    setTimeout(() => {
      const goToYouTubeBtn = document.getElementById('goToYouTubeBtn');
      const guideBtn = document.getElementById('guideBtn');
      const feedbackBtn = document.getElementById('feedbackBtn');
      const rateUsBtn = document.getElementById('rateUsBtn');
      
      if (goToYouTubeBtn) {
        goToYouTubeBtn.addEventListener('click', () => {
          chrome.tabs.create({url: 'https://www.youtube.com'});
          window.close();
        });
        
        goToYouTubeBtn.addEventListener('mouseover', () => {
          goToYouTubeBtn.style.background = '#ff2222';
          goToYouTubeBtn.style.transform = 'translateY(-2px)';
          goToYouTubeBtn.style.boxShadow = '0 8px 25px rgba(255, 0, 0, 0.3)';
        });
        
        goToYouTubeBtn.addEventListener('mouseout', () => {
          goToYouTubeBtn.style.background = '#ff0000';
          goToYouTubeBtn.style.transform = 'translateY(0)';
          goToYouTubeBtn.style.boxShadow = 'none';
        });
      }
      
      if (guideBtn) {
        guideBtn.addEventListener('click', () => {
          chrome.tabs.create({url: chrome.runtime.getURL('src/html/welcome.html')});
          window.close();
        });
        
        guideBtn.addEventListener('mouseover', () => {
          guideBtn.style.background = '#ff2222';
          guideBtn.style.transform = 'translateY(-1px)';
          guideBtn.style.boxShadow = '0 4px 12px rgba(255, 0, 0, 0.3)';
        });
        
        guideBtn.addEventListener('mouseout', () => {
          guideBtn.style.background = '#ff0000';
          guideBtn.style.transform = 'translateY(0)';
          guideBtn.style.boxShadow = 'none';
        });
      }
      
      if (feedbackBtn) {
        feedbackBtn.addEventListener('click', () => {
          chrome.tabs.create({url: chrome.runtime.getURL('src/html/welcome.html')}, (tab) => {
            setTimeout(() => {
              chrome.tabs.sendMessage(tab.id, { action: 'openFeedback' }).catch(() => {});
            }, 1500);
          });
          window.close();
        });
        
        feedbackBtn.addEventListener('mouseover', () => {
          feedbackBtn.style.background = '#66BB6A';
          feedbackBtn.style.transform = 'translateY(-1px)';
          feedbackBtn.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
        });
        
        feedbackBtn.addEventListener('mouseout', () => {
          feedbackBtn.style.background = '#4CAF50';
          feedbackBtn.style.transform = 'translateY(0)';
          feedbackBtn.style.boxShadow = 'none';
        });
      }

      if (rateUsBtn) {
        rateUsBtn.addEventListener('click', () => {
          chrome.tabs.create({url: 'https://chromewebstore.google.com/detail/yulaf-youtube-language-fi/ejfoldoabjeidjdddhomeaojicaemdpm'});
          window.close();
        });
        
        rateUsBtn.addEventListener('mouseover', () => {
          rateUsBtn.style.background = '#FF8C00';
          rateUsBtn.style.transform = 'translateY(-1px)';
          rateUsBtn.style.boxShadow = '0 4px 12px rgba(255, 165, 0, 0.3)';
        });
        
        rateUsBtn.addEventListener('mouseout', () => {
          rateUsBtn.style.background = '#FFA500';
          rateUsBtn.style.transform = 'translateY(0)';
          rateUsBtn.style.boxShadow = 'none';
        });
      }
    }, 100);
  }
}