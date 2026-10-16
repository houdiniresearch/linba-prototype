# Planlanan entegrasyonlar

Tanıtımda kullanım senaryolarının altında merkezinde özgün LİNBA logosu olan bir bağlantı haritası vardır. Sunum araçları (PowerPoint, Google Slides), canlı eğitim (Microsoft Teams, Zoom, Google Meet) ve yapay zekâ asistanları (ChatGPT, Claude) üç grupta gösterilir. Masaüstünde ince kesik çizgiler araç gruplarını LİNBA’ya bağlar ve yavaşça akar. 850 px altında gruplar ızgaraya, 540 px altında tek sütuna geçer; azaltılmış harekette çizgiler sabittir. Bunlar henüz bağlantı kuran entegrasyonlar değildir. Üst/alt gezinmede ve mobil menüde “Entegrasyonlar” bağlantısı doğrudan haritaya yumuşak kaydırır; ayrı araç menüsü yoktur. Yanındaki “Bekleme listesine katıl” düğmesi doğrudan genel kayıt penceresini açar; sayfa kaydırılmaz.

Bekleme listesi LİNBA geneli içindir. Haritadaki araç düğmelerinden gelen ziyaretçi de aynı genel forma kaydolur; seçilen araç yalnız pencerenin görsel bağlamıdır, kayda eklenmez. Doğrudan açılan genel formda yalnız ortalanmış LİNBA logosu vardır.

`POST /api/public-waitlist`, e-posta adresini ve TR/EN tercihini alır. Kayıtlar yerel SQLite içinde `publicWaitlist` türünde saklanır. Aynı normalize e-posta tek kayıttır; tekrar gönderimde oluşturma tarihi korunur. Yanıt yalnız `{ ok: true }` döner; herkese açık listeleme yoktur. Eski `integration-waitlist` API adresi de aynı genel kayda yönlenir; araç alanı saklanmaz. Önceden oluşturulan entegrasyon kayıtları silinmez. Hesaba bağlı plan bekleme listesi mevcut akışında kalır. Otomatik e-posta gönderimi henüz bağlı değildir.

Formda e-posta doğrulaması, gerçek kayıt sırasında yüklenme simgesi, hata ve başarı durumları vardır. Pencere kapanınca odak tetikleyicisine, mobil menüden açıldıysa ana menü düğmesine döner. Dil, tema ve dar ekran desteklenir.

Simgeler yerel dosyalardır. PowerPoint, Teams, Google Slides ve ChatGPT SVG kaynakları [Simple Icons 11.15.0](https://github.com/simple-icons/simple-icons/tree/11.15.0/icons); lisansı `public/integrations/LICENSE.md` içinde korunur. Zoom simgesi [Zoom'un kendi sitesindeki simgeden](https://st1.zoom.us/zoom.ico) alınmıştır; dosyanın özgün biçimi PNG'dir.

Doğrulama: `npm run test:waitlist` anonim kayıt, normalizasyon, farklı araçlardan gelen tekrarların aynı genel kayda yazılması, geçersiz e-posta, dış kaynaktan yazma ve listeleme yasağını kontrol eder. Mevcut hesap bekleme listesi `tests/header.test.ts` ile doğrulanır.

Google Meet’in sarı 2026 simgesi, [Google Workspace Meet sayfasında](https://workspace.google.com/products/meet/) kullanılan [özgün SVG](https://www.gstatic.com/images/branding/productlogos/meet_2026/v2/web/192px.svg) dosyasıdır. Claude’un turuncu sembolü [resmi Claude sayfasındaki](https://claude.com/) özgün SVG wordmark içinden alınmıştır; yalnız sembol yolu ve rengi korunur. Bu iki marka varlığı Simple Icons CC0 dosyalarına dahil değildir.
