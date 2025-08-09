export const createElement = (tag, className, innerHTML) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (innerHTML) el.innerHTML = innerHTML;
  return el;
};

export const goToYouTube = () => {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.create({ url: 'https://www.youtube.com' });
    window.close();
  } else {
    window.open('https://www.youtube.com', '_blank');
  }
};

export const handleRateUsClick = () => {
  window.open('https://chromewebstore.google.com/detail/yulaf-youtube-language-fi/ejfoldoabjeidjdddhomeaojicaemdpm', '_blank');
};