// İlk kurulumda otomatik kılavuz açma
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("🎯 Extension installed - Opening guide");

    // Kılavuz sayfasını aç
    chrome.tabs.create({
      url: chrome.runtime.getURL("guide/guide.html"),
    });
  }
});

// Extension ikonuna tıklandığında popup açılması için
chrome.action.onClicked.addListener((tab) => {
  console.log("Extension icon clicked");
});

// ========================================
// KILAVUZ SAYFASI İÇİN MESAJ KÖPRÜSÜ
// ========================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("🔄 Background received message:", message);

  // Guide sayfasından gelen mesajları YouTube sekmelerine yönlendir
  if (
    message.action === "analyzeCurrentPage" ||
    message.action === "performNaturalActions"
  ) {
    // YouTube sekmelerini bul
    chrome.tabs.query({ url: "https://www.youtube.com/*" }, (tabs) => {
      if (tabs.length === 0) {
        console.error("❌ No YouTube tabs found");
        sendResponse({
          success: false,
          error: "YouTube sekmesi bulunamadı",
        });
        return;
      }

      const youtubeTab = tabs[0];
      console.log(
        `🎯 Forwarding ${message.action} to YouTube tab:`,
        youtubeTab.id
      );

      // Mesajı YouTube content script'ine yönlendir
      chrome.tabs.sendMessage(youtubeTab.id, message, (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "❌ Error forwarding message:",
            chrome.runtime.lastError
          );
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message,
          });
        } else {
          console.log("✅ Message forwarded successfully:", response);
          sendResponse(response);
        }
      });
    });

    return true; // Async response
  }

  // Progress mesajlarını guide.html sekmelerine ilet
  if (message.action === 'naturalProgress') {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.url && tab.url.includes('guide/guide.html')) {
          chrome.tabs.sendMessage(tab.id, message);
        }
      }
    });
    // Progress mesajı async response gerektirmez
    return;
  }

  // Diğer mesajlar için direct handling
  return false;
});
