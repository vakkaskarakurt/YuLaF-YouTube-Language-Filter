# YuLaF - YouTube Language Filter 🎯

> Filter YouTube content by language to supercharge your language learning experience!

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/ejfoldoabjeidjdddhomeaojicaemdpm?style=for-the-badge&logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/yulaf-youtube-language-fi/ejfoldoabjeidjdddhomeaojicaemdpm)
[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/ejfoldoabjeidjdddhomeaojicaemdpm?style=for-the-badge&color=success)](https://chromewebstore.google.com/detail/yulaf-youtube-language-fi/ejfoldoabjeidjdddhomeaojicaemdpm)
[![Chrome Web Store Rating](https://img.shields.io/chrome-web-store/rating/ejfoldoabjeidjdddhomeaojicaemdpm?style=for-the-badge&color=orange)](https://chromewebstore.google.com/detail/yulaf-youtube-language-fi/ejfoldoabjeidjdddhomeaojicaemdpm)
[![Chrome Web Store Last Updated](https://img.shields.io/chrome-web-store/last-updated/ejfoldoabjeidjdddhomeaojicaemdpm?style=for-the-badge&color=purple)](https://chromewebstore.google.com/detail/yulaf-youtube-language-fi/ejfoldoabjeidjdddhomeaojicaemdpm)
[![YuLaF](https://img.shields.io/badge/YuLaF-Language%20Filter-red?style=for-the-badge&logo=youtube&logoColor=red)](https://chromewebstore.google.com/detail/yulaf-youtube-language-fi/ejfoldoabjeidjdddhomeaojicaemdpm)

## 👥 Team

**Vakkas Karakurt** - Developer  
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/vakkaskarakurt)

**Emrah Fidan** - Developer  
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/emrah-fidann)

## 🔗 Links

- **[Chrome Web Store](https://chromewebstore.google.com/detail/yulaf-youtube-language-fi/ejfoldoabjeidjdddhomeaojicaemdpm)** - Install the extension
- **[GitHub Repository](https://github.com/vakkaskarakurt/YuLaF-YouTube-Language-Filter)** - Source code
- **[Issues](https://github.com/vakkaskarakurt/YuLaF-YouTube-Language-Filter/issues)** - Report bugs or request features
- **[Privacy Policy](PRIVACY.md)** - Our privacy commitment

## 🚀 Simple Idea

Learning a new language but YouTube keeps showing content in your native language? **YuLaF** filters your feed to show only content in your target language(s), giving you maximum exposure to the languages you're learning.

Perfect for polyglots, language learners, and anyone wanting to customize their YouTube experience by language!

## ✨ Features

- **🌍 61 Languages Supported** - Turkish, English, Spanish, French, German, Chinese, Japanese, Arabic, and many more
- **🎯 Precision Control** - New Strict Mode for more accurate language detection
- **🧠 Smart Detection** - Uses Chrome's built-in language API with 99% accuracy
- **🔄 Multi-Language Support** - Select multiple target languages simultaneously
- **🔒 Privacy-First** - All processing done locally, no data collected or transmitted
- **⚡ One-Click Toggle** - Easy on/off control with visual status indicator
- **🎨 Enhanced Interface** - Improved popup design with dual-toggle controls
- **🆓 Completely Free** - Free to use forever

## 🆕 What's New in v1.0.5

- **🎯 Strict Mode** - New precision toggle for stricter language detection
- **🔧 Enhanced Controls** - Dual-toggle interface for filter and strict mode
- **💪 Improved Stability** - Better error handling and content script reliability
- **🎨 UI Refinements** - Modular CSS architecture and improved visual feedback
- **⚡ Performance Boost** - Optimized language detection algorithms

## 📱 Installation

### From Chrome Web Store (Recommended)
1. Visit the [Chrome Web Store page](https://chromewebstore.google.com/detail/yulaf-youtube-language-fi/ejfoldoabjeidjdddhomeaojicaemdpm)
2. Click "Add to Chrome"
3. Confirm by clicking "Add extension"

### From Source Code
1. Clone this repository:
   ```bash
   git clone https://github.com/vakkaskarakurt/YuLaF-YouTube-Language-Filter.git
   ```
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked" and select the project folder

## 🎯 How It Works

1. **Select Languages** - Choose your target language(s) from 61+ options
2. **Configure Settings** - Enable filter and adjust strict mode if needed
3. **Browse Normally** - Visit YouTube and browse as usual
4. **Smart Filtering** - Only content in your selected languages will appear
5. **Toggle Anytime** - Turn off to see all content again

## ⚙️ Settings Explained

- **Filter Toggle** - Master switch to enable/disable language filtering
- **Strict Mode** - When enabled, only highly confident language detections are accepted
- **Language Selection** - Choose multiple languages with search and sort functionality

## 🔧 Technical Details

### Architecture

- **Manifest V3** - Latest Chrome extension standards
- **Content Scripts** - Real-time DOM manipulation
- **Background Service Worker** - Efficient state management
- **Local Storage** - Privacy-focused settings storage

### Language Detection

- Uses Chrome's native `chrome.i18n.detectLanguage` API
- Configurable confidence thresholds with Strict Mode
- Support for language variants (e.g., en-US, en-GB)
- Real-time processing with optimized algorithms

## 🌍 Supported Languages

<details>
<summary>View all 61 supported languages</summary>

**European Languages:**  
English, French, German, Spanish, Italian, Portuguese, Russian, Dutch, Polish, Turkish, Swedish, Danish, Norwegian, Finnish, Czech, Hungarian, Romanian, Bulgarian, Croatian, Slovak, Slovenian, Estonian, Latvian, Lithuanian, Greek, Ukrainian, Belarusian, Serbian, Bosnian, Albanian, Macedonian, Icelandic, Maltese, Welsh, Irish, Basque, Catalan, Galician

**Asian Languages:**  
Chinese, Japanese, Korean, Hindi, Arabic, Thai, Vietnamese, Indonesian, Malay, Filipino, Hebrew, Persian, Urdu, Bengali, Tamil, Telugu, Malayalam, Kannada, Gujarati, Punjabi

**African Languages:**  
Swahili, Afrikaans, Amharic

</details>

## 🔒 Privacy

YuLaF is built with privacy as a core principle:

- **No Data Collection** - We don't collect any personal information
- **Local Processing** - All language detection happens on your device
- **No External Services** - No data sent to external servers
- **Complete Transparency** - Privacy-focused development

Read our full [Privacy Policy](PRIVACY.md) for details.

## 📊 Browser Compatibility

- ✅ **Chrome** - Fully supported (v88+)
- ✅ **Edge** - Fully supported (Chromium-based)
- ✅ **Brave** - Fully supported
- ✅ **Opera** - Fully supported (Chromium-based)
- ❌ **Firefox** - Not supported (Manifest V3 differences)
- ❌ **Safari** - Not supported

## 📄 License

This project is proprietary software. All rights reserved - see the [LICENSE](LICENSE) file for details.

## ⭐ Support

If YuLaF helps with your language learning journey:

- ⭐ Star this repository
- 📝 Rate us on the Chrome Web Store
- 🐛 Report any issues you find
- 💡 Suggest new features

---

<div align="center">

**Made with ❤️ for language learners worldwide**

[⬆ Back to top](#yulaf---youtube-language-filter-)

</div>