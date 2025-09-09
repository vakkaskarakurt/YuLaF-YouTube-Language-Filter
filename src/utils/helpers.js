// 🔹 Dinamik element oluşturucu
export const createElement = (tag, className, innerHTML) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (innerHTML) element.innerHTML = innerHTML;
  return element;
};

// 🔹 YouTube’a yönlendirici
export const goToYouTube = () => {
  const YOUTUBE_URL = 'https://www.youtube.com';

  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.create({ url: YOUTUBE_URL });
    window.close();
  } else {
    window.open(YOUTUBE_URL, '_blank');
  }
};

// 🔹 “Rate Us” butonunun click handler’ı
export const handleRateUsClick = () => {
  const STORE_URL =
    'https://chromewebstore.google.com/detail/yulaf-youtube-language-fi/ejfoldoabjeidjdddhomeaojicaemdpm';

  window.open(STORE_URL, '_blank');
};
