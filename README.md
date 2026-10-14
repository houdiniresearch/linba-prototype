# LİNBA

Sunum merkezli Türkçe eğitim prototipi. Eğitmen sunumunu yükler, araya aktiviteler yerleştirir, kitlesine göre sesli prova yapar ve canlı eğitimi yönetir. Katılımcı kendi hesabından aktivitelere ve doküman sohbetine erişir.

## Çalışan akış

- Ayrı eğitmen ve katılımcı hesapları; sunucuda oturumlar ve kalıcı SQLite kayıtları.
- PDF/PPTX yükleme: orijinal sayfalar görsel olarak korunur, metin yanıt kaynağı olarak çıkarılır. İlk sürümde sunum içeriği düzenlenmez.
- Anket, açık uçlu soru ve senaryo aktiviteleri; AI ile hazırlama, slaytların arasına ekleme ve aktivite taşıma.
- Eğitmenin serbest metinle tarif ettiği kitleye göre oluşturulan personalarla gerçek WebRTC sesli prova. Prova sonunda aynı oturumdan geri bildirim.
- Prova katılımcıları kendi geçmişi, ön bilgisi ve öğrenme hedefiyle konuşur; isimle hitabı ve takip sorularını izler. Canlı katılımcı repliği ile yazılı değerlendirme ayrı fonksiyon çağrılarıyla alınır; değerlendirme konuşma geçmişine eklenmez. Etkin promptlar ve davranış sözleşmesi: [Prova promptları](docs/PROVA_PROMPTLARI.md).
- Ayrı eğitmen kontrol ekranı ve yansıtma ekranı. Eğitim kodu / QR ile katılım.
- Katılımcının özel sohbeti; dokümana dayanan yanıtlar ve kaynak slaytlar. Yanıtlanamayan sorular eğitmene iletilir. Eğitmenden yazılı cevap girmesi istenmez.
- Benzer soruların AI ile gruplanması. Canlı otomatik yanıtı eğitim ayarından açılıp kapatılabilir.
- Erişim süresi eğitim **bittiğinde** başlar. Sonrasında doküman sohbeti devam eder; sorular ve aktivite sonuçları raporda yer alır.

## Yerel kurulum

Node.js 24 veya üstü gerekir. PDF/PPTX işlemleri için Python (`pypdf`), Poppler (`pdftoppm`) ve LibreOffice (`soffice`) gerekir. Bu bilgisayardaki Codex runtime bağımlılıkları kullanılır; başka bilgisayarda bu araçlar kurulup PATH'e eklenmelidir. Python paketleri `python3 -m pip install -r scripts/requirements.txt` ile kurulabilir. Gerekirse `LINBA_PYTHON` ile Python yolu belirlenebilir.

```sh
npm install
cp .env.example .env.local
# OPENAI_API_KEY değerini yalnız yerel dosyada doldur.
npm run dev
```

Eğitmen: [localhost:3000](http://localhost:3000). Katılımcı: [localhost:3000/katil](http://localhost:3000/katil). Farklı hesapları aynı anda denemek için farklı tarayıcı veya telefon kullan.

Telefondan katılım için aynı Wi-Fi ağında ol; canlı eğitimde **Katılım** düğmesi yerel ağ adresini ve QR kodunu gösterir. Sesli provayı bilgisayarda `localhost` üzerinden aç: tarayıcı mikrofonu güvenli bağlam gerektirir.

Ana sayfada **Örnek eğitimle dene** yalnızca sana ait bir deneme alanı oluşturur. Buradaki sunum örnektir; sohbet yanıtları, aktiviteler ve prova gerçek modeli kullanır.

## Tek model

`OPENAI_MODEL=gpt-realtime-2.1-mini` hem metin hem ses görevlerinde kullanılır. Farklı bir model seçilirse Realtime metin ve ses desteği bulunmalıdır. Ayrı embedding, transkripsiyon veya seslendirme modeli kullanılmaz. İlk sürümde çıkarılan metin üzerinden sözcük eşleşmesine dayalı kaynak seçimi vardır; model yalnız bu bağlamdan yanıt verir. Kaynak yetersizse eğitmene yönlendirir.

API anahtarı sunucuda kalır. `.env.local`, kullanıcı dosyaları ve `.linba/` veritabanı Git'e eklenmez. SQLite ve yüklenen dosyalar bu bilgisayarda saklanır; yedek almak için uygulama kapalıyken `.linba/` klasörünü kopyala.

## Kontroller

```sh
npm run typecheck
npm test
npm run build
```

Çalışan yerel sunucu ve geçerli model anahtarı ile:

```sh
npm run test:integration
npm run test:voice
```

Entegrasyon testi için `tests/create_fixtures.py` önce çalıştırılır; yalnız test amaçlı PDF/PPTX dosyaları sistem geçici klasöründe üretilir. Testler bağımsız hesaplar oluşturur ve gerçek API kullanımına yol açar. Ses testi mikrofonu açmadan WebRTC, ses çıktısı ve geri bildirimi doğrular; gerçek mikrofon/hoparlör deneyimi ayrıca elle denenmelidir.

## İlk sürümün sınırları

Bu sürüm yerel prototiptir; bulut yayını, e-posta doğrulaması ve şifre sıfırlama henüz yoktur. Taranmış ve metin içermeyen PDF'lerde OCR yapılmaz; slayt görüntülenebilir ama asistan yeterli kaynak bulamazsa soruyu eğitmene iletir. Dosya sınırı 30 MB / 80 slayttır. Sonuçlar gerçek yanıt sayılarından türetilir; öğrenme başarısı puanı uydurulmaz.

Ürün kararları: [PRODUCT.md](PRODUCT.md). Görsel dil: [DESIGN.md](DESIGN.md). GitHub başlangıç rehberi: [docs/GITHUB_REHBERI.md](docs/GITHUB_REHBERI.md).

### Prova sesleri ve kullanım

Prova kitlesindeki kurgusal karakterlere kadın, erkek veya nötr tını gruplarından ses atanır. Aynı gruptaki karakterlere mümkün olduğunca farklı sesler verilir. Prova öncesinde her karakterin ses türü ve sesi değiştirilebilir; “Sesi dinle” kısa bir ücretli ses örneği üretir. Bu gruplar ürün içindeki dinleme kategorileridir; sağlayıcının resmî cinsiyet sınıflandırması değildir. Eski, ses bilgisi olmayan personalar isimden çıkarım yapılmadan nötr atanır.

Mikrofon yalnızca bir WebRTC oturumuna gider. Aynı `OPENAI_MODEL` bu oturumda konuşmayı dinleyerek persona kimliği ve repliği üretir; sadece söz alan karakter için aynı modelden seçilen sesle ayrı bir ses çıktısı alınır. Ayrı STT/TTS modeli kullanılmaz. Yeni ses üretilirken kısa bir bekleme oluşabilir; öğretmen yeniden konuştuğunda bekleyen ses oynatılmaz veya çalan ses durur. Tamamlanmış üretimin ücreti yine sayılır.

“Prova kullanımı ve tahmini ücret” bölümü alınan `response.done.usage` kayıtlarından toplamı, ek karakter seslerini ve ses örneklerini ayrı gösterir. Kayıtlar yanıt kimliğiyle tekilleştirilir; önbellekteki giriş tokenları indirimli hesaplanır. Ses üretimi toplamı, eski sürümle karşılaştırmalı net maliyet farkı değildir. Tarife: GPT-Realtime-2.1 Mini için 15 Ekim 2026 tarihinde kontrol edilen USD / milyon token fiyatları (metin giriş 0.60, önbellek 0.06, çıkış 2.40; ses giriş 10, önbellek 0.30, çıkış 20). Başka modelde veya eksik modalite detaylarında ücret tahmini gösterilmez. Tarife, eksik/kopmuş bağlantı kayıtları ve tarayıcıdan gelen konuşma ölçümü nedeniyle bu ekran fatura kaydı olarak kullanılmamalıdır.

Resmî kaynaklar: [Ses seçenekleri ve oturum kısıtı](https://developers.openai.com/api/docs/guides/realtime-conversations#voice-options), [model fiyatları](https://developers.openai.com/api/docs/models/gpt-realtime-2.1-mini), [kullanım kayıtları](https://developers.openai.com/api/docs/guides/realtime-costs).

Ses testi varsayılan olarak Marin ve Cedar'ı, `LINBA_TEST_ALL_VOICES=1 npm run test:voice` ise 10 sesin tamamını gerçek API ile doğrular. Sentetik metin kullanır; gerçek mikrofonu açmaz. Testin WAV örnekleri ve ölçümleri, Git'e eklenmeyen `output/voice-tests/` klasöründedir. Oluşturduğu geçici hesapları, provaları ve eğitimi temizler.
