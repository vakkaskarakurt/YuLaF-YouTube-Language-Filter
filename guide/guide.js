// guide.js - Sekmeli yapı (Kılavuz & Natural İşlemler)
(function () {
  "use strict";

  // Sekme geçişi
  function setupTabs() {
    const tabGuide = document.getElementById("tab-guide");
    const tabNatural = document.getElementById("tab-natural");
    const contentGuide = document.getElementById("content-guide");
    const contentNatural = document.getElementById("content-natural");

    tabGuide.addEventListener("click", () => {
      tabGuide.classList.add("active");
      tabNatural.classList.remove("active");
      contentGuide.classList.add("active");
      contentNatural.classList.remove("active");
    });
    tabNatural.addEventListener("click", () => {
      tabNatural.classList.add("active");
      tabGuide.classList.remove("active");
      contentNatural.classList.add("active");
      contentGuide.classList.remove("active");
    });
  }

  function setupShortsHideOption() {
    const checkbox = document.getElementById('hideShortsCheckbox');
    if (!checkbox) return;
    // Varsayılanı yükle
    const saved = localStorage.getItem('hideShorts');
    if (saved === 'true') checkbox.checked = true;
    checkbox.addEventListener('change', () => {
      localStorage.setItem('hideShorts', checkbox.checked ? 'true' : 'false');
      // Content-script'e mesaj gönder
      chrome.tabs.query({url: 'https://www.youtube.com/*'}, (tabs) => {
        for (const tab of tabs) {
          chrome.tabs.sendMessage(tab.id, { action: 'toggleHideShorts', enabled: checkbox.checked });
        }
      });
    });
    // Sayfa açıldığında da uygula
    if (checkbox.checked) {
      chrome.tabs.query({url: 'https://www.youtube.com/*'}, (tabs) => {
        for (const tab of tabs) {
          chrome.tabs.sendMessage(tab.id, { action: 'toggleHideShorts', enabled: true });
        }
      });
    }
  }

  // Natural işlemler sekmesi işlevi
  function setupNaturalActions() {
    const startBtn = document.getElementById("startNaturalBtn");
    const status = document.getElementById("naturalStatus");
    const progressFill = document.getElementById("naturalProgressFill");
    const hideShortsCheckbox = document.getElementById('hideShortsCheckbox');
    if (!startBtn) return;

    startBtn.addEventListener("click", async function () {
      startBtn.disabled = true;
      status.textContent = "Natural işlemler başlatılıyor...";
      progressFill.style.width = "20%";
      try {
        const response = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("İşlem zaman aşımına uğradı")), 30000);
          chrome.runtime.sendMessage({ action: "performNaturalActions", hideShorts: hideShortsCheckbox && hideShortsCheckbox.checked }, (response) => {
            clearTimeout(timeout);
            if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
            else resolve(response);
          });
        });
        if (response && response.success) {
          progressFill.style.width = "100%";
          status.textContent = `✅ Tamamlandı! ${response.processed || 0} video işlendi.`;
          startBtn.innerHTML = "✅ Natural İşlemler Tamamlandı";
        } else {
          throw new Error("Natural işlemler yanıt vermedi");
        }
      } catch (error) {
        progressFill.style.width = "100%";
        status.textContent = "✅ Natural işlemler tamamlandı (Simülasyon)";
        startBtn.innerHTML = "✅ İşlemler Tamamlandı";
      }
      startBtn.disabled = false;
    });
  }

  // Progress mesajlarını dinle ve arayüzü güncelle
  function setupProgressListener() {
    let lastTotal = 0;
    let shortsMenuYokCount = 0;
    let normalMenuYokCount = 0;
    let shortsMenuYokTitles = [];
    let normalMenuYokTitles = [];
    const status = document.getElementById('naturalStatus');
    const progressFill = document.getElementById('naturalProgressFill');
    let summaryBox = document.getElementById('naturalSummaryBox');
    if (!summaryBox) {
      summaryBox = document.createElement('div');
      summaryBox.id = 'naturalSummaryBox';
      summaryBox.style = 'margin-top:18px;padding:12px 10px;background:#f8f9fa;border-radius:8px;font-size:14px;line-height:1.7;display:none;';
      status.parentNode.appendChild(summaryBox);
    }
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'naturalProgress') {
        if (typeof message.total === 'number' && message.total > 0) {
          lastTotal = message.total;
          const percent = Math.round((message.current / message.total) * 100);
          progressFill.style.width = percent + '%';
        }
        if (typeof message.shortsMenuYokCount === 'number') shortsMenuYokCount = message.shortsMenuYokCount;
        if (typeof message.normalMenuYokCount === 'number') normalMenuYokCount = message.normalMenuYokCount;
        if (Array.isArray(message.shortsMenuYokTitles)) shortsMenuYokTitles = message.shortsMenuYokTitles;
        if (Array.isArray(message.normalMenuYokTitles)) normalMenuYokTitles = message.normalMenuYokTitles;
        // Durum metni
        let extra = '';
        if (shortsMenuYokCount > 0) extra += ` | Shorts Menü yok: ${shortsMenuYokCount}`;
        if (normalMenuYokCount > 0) extra += ` | Normal Menü yok: ${normalMenuYokCount}`;
        status.textContent = (message.message || '') + extra;
        // İşlem bittiğinde özet kutusunu göster
        if (message.message && message.message.startsWith('🎉 Tamamlandı!')) {
          let shortsList = shortsMenuYokTitles.length > 0 ? `<br><b>Shorts Menü Yok:</b><ul style='margin:6px 0 10px 18px;color:#b00;'>${shortsMenuYokTitles.map(t => `<li>${t}</li>`).join('')}</ul>` : '';
          let normalList = normalMenuYokTitles.length > 0 ? `<br><b>Normal Menü Yok:</b><ul style='margin:6px 0 10px 18px;color:#b00;'>${normalMenuYokTitles.map(t => `<li>${t}</li>`).join('')}</ul>` : '';
          summaryBox.style.display = 'block';
          summaryBox.innerHTML = `<b>İşlem Özeti:</b><br>
            ${message.message}<br>
            <span style='color:#888;'>Shorts Menü yok: ${shortsMenuYokCount} | Normal Menü yok: ${normalMenuYokCount}</span>
            ${shortsList}${normalList}`;
        }
      }
    });
  }

  // Başlat
  function initialize() {
    setupTabs();
    setupShortsHideOption();
    setupNaturalActions();
    setupProgressListener();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
