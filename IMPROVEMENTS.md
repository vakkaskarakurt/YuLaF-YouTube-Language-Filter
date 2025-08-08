# YuLaF - Önceliklendirilmiş İyileştirme Önerileri

Bu doküman, YuLaF (YouTube Language Filter) projesi için önceliklendirilmiş iyileştirme önerilerini içerir. Öneriler puan/önem sırasına göre düzenlenmiştir.

## En Öncelikli İyileştirme Önerileri (Yüksekten Düşüğe, Puan/Önem)

### 1) Öğe Yeniden-İşleme (Cache) Hatasını Düzeltin – Seçim İmzası Kullanın
- **Puan:** 10/10 (Kritik)
- **Ne Değişecek:**
  - `src/services/filter-service.js`: `data-language-filter-checked` kontrolü için olmayan `currentLanguage` yerine bir "seçim imzası" (`selectedLanguages` + `strictMode`) yazıp/okuyacak.
  - `src/services/language-service.js`: `getSelectionSignature()` benzeri ufak yardımcı fonksiyon eklenecek.
- **Sonuç:** Aynı öğeler sürekli tekrar işlenmeyecek, performans ve kararlılık ciddi artar.

### 2) Gizlilik Metni ile Formspree Çelişkisini Giderin
- **Puan:** 9/10 (Kritik/Yüksek)
- **Ne Değişecek:**
  - `PRIVACY.md`: Geri bildirim gönderiminde `formspree.io` kullanıldığını, iletilen alanları (konu, mesaj, opsiyonel e‑posta vb.) açıkça belirtecek şekilde güncelleme.
  - `manifest.json` içindeki `host_permissions` zaten `formspree.io` içeriyor; metinle uyumlu hale gelecek.
- **Sonuç:** Mağaza onayı ve kullanıcı güveni artar; hukuki/dökümantasyon tutarlılığı sağlanır.

### 3) Dil Algılamada Eşik (Threshold) ve Güvenilirlik (isReliable) Kullanımını Ekleyin
- **Puan:** 8/10 (Yüksek)
- **Ne Değişecek:**
  - `src/services/language-detector.js`: `YT_FILTER_CONFIG.detection.threshold` (örn. 0.7) ve `result.isReliable` strictMode ile birlikte değerlendirilecek. `topLanguage.confidence` uygunsa eklenecek.
- **Sonuç:** Yanlış pozitif/negatifler azalır; filtre daha isabetli çalışır.

### 4) Kanal Metni Seçicilerini Başlıktan Ayırın
- **Puan:** 7/10 (Yüksek-Orta)
- **Ne Değişecek:**
  - `src/utils/config.js`: `selectors.channelTitle` gibi ayrı bir dizi tanımlanacak (örn. `#channel-name a`, `.ytd-channel-name a`, `#text.ytd-channel-name`).
  - `src/services/dom-service.js`: `type === 'channel'` için `channelTitle` dizisi kullanılacak.
- **Sonuç:** Kanal bazlı filtre doğruluğu artar; özellikle kanal kartları/sonuçları daha isabetli işlenir.

### 5) Filtre Tetiklemelerini Debounce/Idle ile Birleştirin
- **Puan:** 6/10 (Orta)
- **Ne Değişecek:**
  - `src/js/content.js`: URL değişimi ve yoğun DOM mutasyonlarında `window.FilterService.filterContent` çağrılarını debounce (`setTimeout`) veya `requestIdleCallback` ile toplamak; `timing.filterDelay/urlChangeDelay` gerekirse ayarlamak.
- **Sonuç:** Yoğun sayfalarda CPU kullanımı düşer, mikro takılmalar azalır.

### 6) Varsayılan Dili Kullanıcının Arayüz Diline Ayarlayın
- **Puan:** 5/10 (Orta)
- **Ne Değişecek:**
  - `src/js/background.js`: `onInstalled` içinde `chrome.i18n.getUILanguage()` ile gelen dili (örn. `tr-TR` → `tr`) destekli ise `selectedLanguages` varsayılanı olarak set etmek.
- **Sonuç:** İlk kurulum deneyimi daha kişisel; "hemen çalıştı" algısı güçlenir.

### 7) `history.pushState/replaceState` Override'larını Güvenceye Alın (Opsiyonel)
- **Puan:** 4/10 (Düşük-Orta)
- **Ne Değişecek:**
  - `src/js/content.js`: Toggle-off dışında, sayfa terkinde/kapatmada restore güvenliği için `beforeunload` ile orijinal fonksiyonlara dönüş eklemek (opsiyonel).
- **Sonuç:** Marjinal kararlılık iyileştirmesi.

### 8) Gereksiz İzinleri Sadeleştirin (Opsiyonel)
- **Puan:** 3/10 (Düşük)
- **Ne Değişecek:**
  - `manifest.json`: `activeTab` pratikte şart değil; isterseniz kaldırabilirsiniz (içerik betikleri zaten eşleşmelere göre çalışıyor).
- **Sonuç:** İzin yüzeyi küçülür; mağaza denetiminde küçük artı.

## Kısa Etkiler Özeti

- **En kritik düzeltme (1):** Gereksiz yeniden-işleme biter; performans ve kararlılık bariz iyileşir.
- **Dokümantasyon uyumu (2):** Gizlilik metni gerçeği yansıtır; kullanıcı güveni ve mağaza uyumu artar.
- **Algılama kalitesi (3-4):** Daha isabetli filtre; yanlış gizleme/gösterme azalır.
- **Performans (5):** Yoğun DOM değişimlerinde daha akıcı deneyim.
- **UX (6):** Kurulumdan itibaren doğru dil varsayılanı.
- **Bakım/temizlik (7-8):** Küçük ama faydalı sağlamlaştırma ve izin sadeleştirme.

## Özet

- 8 öneri sunuldu, önem/puan sırasına göre. En kritik: cache imzası (10/10) ve gizlilik uyumu (9/10).
- Değişiklikler; `filter-service.js`, `language-service.js`, `language-detector.js`, `dom-service.js`, `config.js`, `PRIVACY.md`, `content.js`, `background.js`, `manifest.json` üzerinde ufak-orta ölçekli editler.
- Beklenen kazanımlar: doğruluk ve performansta belirgin artış, politika uyumu ve daha iyi ilk-kullanım deneyimi.

---

*Bu doküman, proje geliştirme sürecinde öncelikli iyileştirmeleri takip etmek için oluşturulmuştur.*
