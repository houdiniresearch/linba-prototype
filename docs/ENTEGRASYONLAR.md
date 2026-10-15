# Planlanan entegrasyonlar

Tanıtımda kart akışının altında PowerPoint, Microsoft Teams, Google Slides, Zoom ve ChatGPT sıralanır. Bunlar henüz bağlantı kuran entegrasyonlar değildir. Bölüm açıklaması ve açılan form bu durumu açıkça belirtir. Her düğme ilgili araca özel bekleme listesi açar; hesap zorunlu değildir.

`POST /api/integration-waitlist`, katalogdaki entegrasyon kimliğini, e-posta adresini ve TR/EN tercihini alır. Kayıtlar yerel SQLite içinde `integrationWaitlist` türünde saklanır. Aynı e-posta/entegrasyon çifti tek kayıttır; e-posta normalize edilir, tekrar gönderimde oluşturma tarihi korunur. Yanıt yalnız `{ ok: true }` döner; herkese açık listeleme yoktur. Mevcut hesaba bağlı plan bekleme listesi aynı şekilde çalışmaya devam eder. Otomatik e-posta gönderimi bu değişikliğin parçası değildir.

Formda yerel e-posta doğrulaması, gerçek kayıt sırasında yüklenme simgesi, hata ve başarı durumları vardır. Pencere kapanınca klavye odağı tıklanan entegrasyon düğmesine döner. Mobilde logolar sarılır, form ekrana sığar. Dil ve tema ortak tokenlarla çalışır.

Simgeler yerel dosyalardır. PowerPoint, Teams, Google Slides ve ChatGPT SVG kaynakları [Simple Icons 11.15.0](https://github.com/simple-icons/simple-icons/tree/11.15.0/icons); lisansı `public/integrations/LICENSE.md` içinde korunur. Zoom simgesi [Zoom'un kendi sitesindeki simgeden](https://st1.zoom.us/zoom.ico) alınmıştır; dosyanın özgün biçimi PNG'dir.

Doğrulama: `npm run test:integration-waitlist` anonim kayıt, normalizasyon, tekrar gönderim, entegrasyon ayrımı, geçersiz girdi, dış kaynaktan yazma ve listeleme yasağını kontrol eder. Mevcut header testleri de geçti. Tarayıcıda beş düğmenin kendi bağlamında form açması, kayıt başarısı, Türkçe/İngilizce, Escape/odak dönüşü ve 320 px mobil kontrol edildi. Test kayıtları temizlendi.
