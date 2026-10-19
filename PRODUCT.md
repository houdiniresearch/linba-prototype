# LİNBA

## Register

product

## Users

İki hesap tipi: eğitmen ve katılımcı. Eğitmen sunumunu hazırlar, prova eder ve canlı oturumu yönetir. Katılımcının kişisel RAG sohbeti ve ayrı Aktiviteler alanı vardır.

## Product Purpose

Sunum merkezli platform. Kullanıcının 13 Ekim 2026 konuşmasındaki kararları önceki ürün taslağının yerine geçer.

## Confirmed Workflow

- Sidebar: Ana sayfa, Eğitimlerim, Raporlar; altta entegrasyonlar, Ayarlar, Çöp kutusu ve Yardım. Ana sayfada AI oluşturma kutusu yok.
- Eğitim oluştur: doküman yükle, dosya adından gelen eğitim adını gerekirse değiştir, eğitim sonrası RAG süresini seç, canlı otomatik yanıtı aç/kapat.
- Yüklenen sunum metni/görselleri düzenlenmez. Ayrı çalışma ekranında solda slayt sırası, ortada seçili slayt, sağda aktivite ayarları.
- Aktivite seçili slayttan sonra eklenir ve sürüklenerek taşınır. Türler sonraya bırakılmıştır; temel anket/açık uçlu/senaryo altyapısı ilk sürüme yeterlidir.
- Üst işlemler: Önizle, Prova yap, Eğitimi başlat.
- Prova: kitle serbest metinle tarif edilir; model personaları oluşturur. Eğitmen sesli anlatır, simüle katılımcılar sesli soru ve yorumlarla katılır. Sonunda geri bildirim özeti.
- Canlı eğitmen kontrolü ve yansıtılan sunum ayrı ekranlar.
- AI otomatik yanıt açıksa soruyu doküman bağlamında doğrudan yanıtlar; yalnız soran katılımcı görür. Eğitmen tüm soruları ve AI yanıtlarını görür.
- Benzer sorular gruplanır. Yanıtlanamayanlar hocaya iletilir; hocanın uygulamada yazılı cevap vermesi istenmez.
- Katılımcıda Sohbet ve Aktiviteler ayrı. Aktivite slaytında otomatik Aktiviteler'e geçer; sohbet korunur.
- Eğitim bitince canlı oturum kapanır, RAG süresi başlar ve rapor hazırlanır. Sonraki sorular ve aktivite sonuçları aynı rapora eklenir.
- Tek model: metin, sesli prova, persona, gruplama ve özet; ek embedding/STT/TTS modeli yok.

## Brand Personality

15 Ekim 2026'da onaylanan AhaSlides referanslı yaklaşım: beyaz sidebar/üst çubuk, açık gri çalışma alanı, fuşya ana eylemler ve beyaz yazı, mint eğitim başlatma/canlı eğitime dönme ve plan yükseltme butonları ve koyu yazı, açık lila rapor butonu ve fuşya sonuç çubukları, açık pembe seçimler ve fuşya vurgular, lila hafif yüzeyler, okunaklı sans ve hafif yuvarlatılmış kontroller. Sitede kullanılan özgün katlanmış sayfa sembolü ve linba yazısının geometrisi korunur; yalnız renkleri lila–fuşya ve koyu mürekkebe uyarlanır. Alternatif logo sembolleri uygulanmaz. Renk rolleri DESIGN.md ve docs/MARKA_RENKLERI.md'de kayıtlıdır.

## Design Principles

- Sunum bütün akışların ortak bağlamıdır.
- Eğitmen, sunum ve katılımcı görünümünü ayır.
- Kişisel sohbeti diğer katılımcılara açma.
- Kaynak ve hocaya iletim durumlarını görünür tut.
- Gerçek kayıtlarla raporla, bağlantı durumunu doğru göster.

## Accessibility & Inclusion

Türkçe/İngilizce arayüz; görünür odak; klavye/dokunma; azaltılmış hareket; sürüklemeye alternatif taşıma düğmeleri. Katılımcı mobil, eğitmen masaüstü. Dil seçimi sağ üstte, tercih çerezle korunur; eğitim içerikleri çevrilmez.

## Header & Account

Sağ üst sıra: dil seçimi, açık mint Erken erişim butonu, bildirim simgesi ve aşağı oklu 40 px profil avatarı. Profil menüsü ad/e-posta, ücretsiz plan etiketi, Upgrade alanı, hesap ayarları, plan/bekleme listesi ve çıkış içerir. Hesap ayarları; profil, güvenlik, fatura ve ödeme, genel tercihler bölümlerini içeren bir penceredir. Fatura alanı mevcut ücretsiz planı ve gerçek fatura bulunmadığını gösterir; ödeme servisi bağlı değildir. Upgrade bekleme listesi kaydını açar; kayıt hesaba bağlı ve SQLite'da kalıcıdır, tekrar gönderimde güncellenir. Bildirim listesi kullanıcıya ait tamamlanan eğitim raporlarından türetilir. Otomatik e-posta gönderimi henüz bağlı değildir.

## Project

Mevcut Next.js/TypeScript yerel projeyi kullan. SQLite ve yerel dosyalar. GitHub özel: https://github.com/houdiniresearch/linba-prototype.

## Görünüm tercihi

Ürün genelinde Açık / Koyu / Sistem temaları desteklenir. Eğitmen çalışma alanında görünüm tercihi Ayarlar → Genel tercihler içindedir; katılımcı ve giriş ekranlarında görünüm menüsü korunur. Tercih tarayıcıda bir yıl saklanır, yenilemede korunur ve tüm ekranlara uygulanır. Yüklenen sunum sayfalarının renkleri değişmez.

## Rapor asistanı

Raporlar ve rapor detayından yeni sekmede açılır. Solda yalnız eğitmene ait tamamlanmış eğitim raporları vardır; her rapor ayrı ve kalıcı bir sohbeti temsil eder. Sorular ve aktivite sonuçları üzerinden konuşulur. Ajan ekranındaki Raporu aç düğmesi ve sohbet kaynakları raporu aynı ekranın sağ panelinde açar; sohbet ve taslak korunur. Mobilde panel tam genişlikte açılır. Mevcut tek model kullanılır; başarısız yanıtlar geçmişe kaydedilmez. Başka rapora geçmek o konuşmayı açar; raporlar arası kıyaslama yoktur. Detay ve testler docs/RAPOR_ASISTANI.md'dedir.

## Yükleme deneyimi

Sayfa ve veri bekleme durumlarında gerçek ekranın düzenini izleyen iskeletler gösterilir; veri geldiğinde içerikle yer değiştirir. Eğitim/rapor listeleri sonuç gelmeden boş sayılmaz. Oturum doğrulanmadan eğitim listesi istenmez. Arka plandaki veri yenilemeleri mevcut içeriği korur. Sunum görselleri yüklenirken oranları ayrılır; hata varsa sonsuz iskelet yerine hata durumu görünür. Açık/koyu tema ve azaltılmış hareket tercihi desteklenir.

## Tanıtım sayfası

Eğitim akışının altında PowerPoint, Microsoft Teams, Google Slides, Zoom ve ChatGPT planlanan entegrasyonlar olarak sunulur. Entegrasyonlar ayrı açılır menüde listelenir. Bekleme listesi düğmesi doğrudan genel LİNBA kayıt penceresini açar; hesap gerekmez ve kayıtlar entegrasyona göre ayrılmaz. Entegrasyonlardan gelen kayıtlar da aynı genel listeye yazılır. Gerçek entegrasyon bağlantısı kurulmaz; yerel SQLite içinde e-posta başına tek kayıt saklanır.

Oturum açmamış kullanıcı `/` adresinde izometrik görsellerle ürün akışını anlatan landing page görür; oturum açmış kullanıcı aynı adreste çalışma alanına girer. `/kesfet` tanıtımın her zaman erişilebilir önizlemesidir. Açılış öncesi karşılama ve bekleme listesi `/giris` adresindedir; eski `/giris?mod=kayit` bağlantısı da aynı ekranı açar. Mevcut kullanıcı girişi `/giris?mod=giris` adresindedir; var olan hesabın oturumu varsa bu adresler çalışma alanına döner. Katılımcı bağlantısı `/katil` olarak korunur. Görünüm ve TR/EN dil seçimi ortak tercihlerle çalışır.

Tanıtımda “Senin eğitimine göre” bölümü kurumsal eğitmen, öğretim görevlisi, bağımsız eğitimci ve eğitim kurumları için dört seçilebilir kullanım senaryosu sunar. Örnekler sırasıyla prova, açık uçlu yazılı yanıtların yapay zekâ analizini, eğitim sonrası kaynaklı sohbeti ve kurumun rapor asistanıyla öğrencilerin zorlandığı konuları incelemesini kodla çizilmiş kısa animasyonlarla gösterir. Bunlar “Örnek senaryo” etiketi taşıyan temsili içeriklerdir; gerçek kullanıcı ölçümü veya canlı model görüşmesi değildir.

## Ürün ana sayfasında keşif alanı

Eğitmen ana sayfasında son eğitimlerin sağında LİNBA'ya ait üç görselli yenilik gösterilir: pratik ajanı, aktiviteler ve sohbetin yanındaki rapor paneli. İçerik altı saniyede bir döner; nokta düğmeleriyle doğrudan seçilebilir. Ok, sayısal sayaç, sahte yayın tarihi veya değerlendirme puanı yoktur. Odak, hover, gizli sekme, açık keşif pencereleri ve azaltılmış hareket otomatik dönüşü durdurur. Tümünü gör aynı yenilikleri ayrıntılarıyla açar. Çalışma alanını aç ilk taslak eğitime, pratik için onun /practice adresine gider; taslak yoksa eğitim oluşturma formu açılır. Raporlar düğmesi gerçek rapor listesine gider. Sosyal düğmeler mevcut tanıtım sayfasındaki gibi şimdilik devre dışıdır. Görüşünü paylaş formu kategori ve en fazla 2.000 karakterlik metni hesapla ilişkilendirerek yerel SQLite feedback kayıtlarına kaydeder; e-posta veya dış servis gönderimi yapmaz.

## Training library and account settings — 19 October 2026

See [WORKSPACE_LIBRARY.md](docs/WORKSPACE_LIBRARY.md) for reusable sessions, user-owned training groups, Istanbul calendar filters, recoverable Trash, private slide notes and account settings. Logout is only in the profile menu. Product integration marks moved into the sidebar and open the account waitlist.

## Ongoing UI quality

For future UI/UX work, inspect the existing product first, research relevant patterns in authoritative design-system and usability sources, and verify the actual interaction in the browser. Preserve LİNBA’s established identity. A passing test or build alone does not establish visual quality. Favor clear task hierarchy, progressive disclosure, accessible state and focus behavior, restrained selection colors and responsive layouts over generic decoration.
