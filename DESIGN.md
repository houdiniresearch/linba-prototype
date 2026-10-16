---
name: LİNBA — Lila, fuşya ve mint
description: 15 Ekim 2026'da onaylanan beyaz ağırlıklı, lila–fuşya kimliği fuşya ana eylemler ve mint eğitim başlatma ve plan yükseltme.
colors:
  primary: "oklch(0.5943 0.2394 3.26)"
  primary-foreground: "oklch(1 0 0)"
  accent: "oklch(0.531 0.214 3.02)"
  accent-soft: "oklch(0.9673 0.0167 343.61)"
  brand-lilac: "oklch(0.7044 0.1301 304.43)"
  brand-fuchsia: "oklch(0.6021 0.2426 3.28)"
  background: "oklch(1 0 0)"
  workspace: "oklch(0.9797 0.0026 286.35)"
  ink: "oklch(0.2616 0.0223 284.75)"
  muted: "oklch(0.5117 0.022 285.6)"
  border: "oklch(0.9294 0.0067 286.27)"
typography:
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.55
rounded:
  control: "8px"
  panel: "12px"
---

# LİNBA görsel sistem

## Overview

Kullanıcının paylaştığı beş AhaSlides ekranı görsel sözleşmedir. Ana sayfa/raporda beyaz üst çubuk ve sol gezinme; düzenleyicide sol slayt önizlemeleri, geniş açık gri sahne, sağ bağlamsal araçlar. Önceki keşifler geçersiz. LİNBA markası ve Türkçe işlevleri kullanılır.

## Colors

Beyaz ana yüzeyler ve açık gri sahne baskındır. Fuşya ana eylem butonlarında beyaz yazıyla kullanılır; Eğitimi başlat, Canlı eğitime dön ve Planı yükselt butonları mint zemin ve koyu yeşil yazıyla ayrılır. Raporu aç butonu ve tamamlanan eğitim etiketleri açık lila, rapor sonuç çubukları açık pembe üzerinde fuşyadır. Seçimler açık pembe, etkileşimli metin ve odak çizgileri okunaklı koyu fuşyadır. Lila logo, avatarlar ve hafif yardımcı yüzeylerde yer alır. Parlak fuşya logo/marka detayları içindir; küçük metinde daha koyu erişilebilir tonu kullanılır. Durum renkleri mevcut anlamlarını korur. Tam palet ve kullanım rolleri docs/MARKA_RENKLERI.md'dedir.

## Logo

Mevcut katlanmış sayfa sembolü, linba harfleri, boşlukları ve oranları korunur. İlk sembol parçası lila, ikinci parçası ve i noktası fuşya, yazı koyu mürekkeptir. Yeni logo alternatifleri bu kararla uygulanmaz. Ortak Logo bileşeni tüm ürün yüzeylerine aynı dosyayı taşır. Sekme simgesinde aynı özgün sembol kullanılır.

## Typography

Referanstaki okunaklı sans; yerel Inter. Gövde/form 16 px, ikincil 13–14 px, başlık 24–28 px. Türkçe karakter ve uzun metin.

## Elevation

İnce sınırlar, hafif köşeler. Gölge yalnız menü/diyalogda. Koyu sidebar ve dekoratif gradient yok.

## Components

Mevcut Phosphor ikon ailesi ve Radix. Aktif slayt fuşya odak çizgisi ve açık pembe seçimle, sahne gerçek sunum görüntüsüyle gösterilir. Kayıt, yükleme, hata, süre sonu, AI bağlantısı ve sesli prova durumları açık.

## Do's and Don'ts

- Ana sayfaya AI oluşturma kutusu ekleme.
- Materyal/provayı ayrı ana menü yapma.
- Kaynaksız yanıtı hocaya ilet; sahte ölçüm gösterme.
- Sunum ekranına özel soru/sohbet koyma.
- Mikrofonu kullanıcı başlatsın; oturum kapanınca durdur.

## Tema

Açık, Koyu ve Sistem seçenekleri ortak görünüm menüsündedir. İlk tercih Sistem'dir; kullanıcı seçimi bir yıl süreli linba_theme çerezinde saklanır ve sunucu ilk HTML'ye uygular. Sistem seçimi işletim sistemindeki değişiklikleri CSS color-scheme ile anında izler; tema için sayfa yüklenirken JavaScript beklenmez. Koyu temada nötr yüzeyler hafif lila tonlu kömür, ana metin kırık beyaz, yardımcı metin açık gridir. Fuşya ve mint dolgulu eylemler aynı kalır; etkileşimli metinler koyu zeminde daha açık ton kullanır. Sunum görselleri dönüştürülmez. Logonun yalnız yazısı koyu temada açılır; özgün sembol, fuşya nokta ve geometri korunur.

## Rapor sohbet alanı

AhaSlides rapor asistanı referansı: bağımsız yeni sekme, solda rapor listesi, üstte seçili eğitim, ortada sade konuşma ve altta sabit mesaj alanı. Boş durumda kısa karşılama ve dört gerçek soru önerisi. Yeni sohbet düğmesi yerine raporlar seçilir; seçili rapor açık pembe vurgulanır. Asistan yanıtları geniş metin alanında, eğitmen mesajları sağa hizalı nötr yüzeyde yer alır. Kaynaklar açık lila bağlantılardır. Tema tokenları ve özgün logo kullanılır. Mobilde sol liste menüye dönüşür.

## Yükleme durumları

İlk sayfa/veri yüklemesinde içerik düzenine uygun gri iskeletler kullanılır: eğitmen paneli, eğitim kartları, rapor tablosu ve detayı, düzenleyici, prova, önizleme, yansıtma, katılımcı ve rapor sohbeti. Ortak bileşenler components/skeletons.tsx içindedir; Next loading.tsx sınırları ile istemci veri bekleme durumları aynı bileşenleri kullanır. Sonuç boş olduğu doğrulanmadan boş durum gösterilmez. Arka plan yenilemesi mevcut içeriği kaldırmaz. Görsellerin oranı yüklenmeden ayrılır; görsel gelene kadar kendi yerinde iskelet görünür.

İskeletler sahte veri veya tıklanabilir sahte kontrol içermez. Ekran okuyucu için tek yüklenme durumu duyurulur, dekoratif parçalar gizlenir. Hareket tercihi azaltıldığında animasyon kapalıdır. Yapay bekleme süresi yoktur. Veri hatasında iskelet durur, hata ve yeniden deneme gösterilir. Sunum işleme, eğitimi bitirme ve model yanıtı üretme gibi işlemlerde açıklayıcı durum mesajları korunur.

## Tanıtım sayfası

Kullanım senaryolarının altında ortalanmış bir başlık ve merkezinde LİNBA bulunan, yedi planlanan aracı üç grupta gösteren bağlantı haritası bulunur. Planlanan durum açıkça belirtilir; düğmeler genel LİNBA e-posta bekleme listesi açar. Araç düğmeleri grup başlıkları ve bağlantılarla tek bir harita oluşturur. Üst/alt gezinme ve mobil menüde Entegrasyonlar bağlantısı doğrudan bağlantı haritasına yumuşak kaydırır. Menü sırası sayfadaki Nasıl çalışır → Kullanım senaryoları → Entegrasyonlar → Sık sorulanlar sırasını izler. Bekleme listesine katıl düğmesi doğrudan genel formu açar; kayıtlar araca özel değildir. Mobil gezinmede yerel popover, görünür odak ve klavye gezinmesi kullanılır. Akış başlığı 40 px, aşama etiketleri 20 px ve daha belirgin ikonlarla sunulur; mobilde 30/18 px'e uyarlanır.

Üst çubuk kaydırmada sabittir; kullanıcının isteğiyle yarı saydam, arkasını bulanıklaştıran cam yüzey kullanılır. Logo ve gezinme solda, dil ve giriş sağdadır. Bu yüzeyde görünüm menüsü yoktur. Bölüm bağlantıları yumuşak kayar, azaltılmış harekette anlık gider; başlıklar sabit çubuğun altında kalmaz. Katılım kodu formu ana menünün üstündeki ince lila şeritte ortalanır; önek içermeyen kod alanı ve nötr Katıl düğmesiyle tek yüzeyde birleşir. Dil düğmesi ince çerçeveli ve kompakt, seçenekleri düğmenin altında açılan markaya uyumlu bir popover'dır.

Arka planda özgün izometrik görsellerin açılarını sürdüren ince lila çizgi deseni kullanılır. Desen görsellerin çevresinde ve bölüm kenarlarında belirir, metin çevresinde silikleşir. Mobilde yoğunluğu azaltılır. CSS maskesi dekoratiftir; tıklamaları engellemez, hareket içermez ve ürün ekranlarına taşınmaz.

Markayı koruyan, düşük yoğunluklu tasarım. Tasarım varyansı 6, hareket 3, görsel yoğunluk 2: ilk ekranda solda iki satırlı mesaj, sağda tek izometrik sahne. Hareket, kaydırmayla üst üste gelen aşama kartları ve soru açılışıyla sınırlı. Genel font Inter, yüzeyler mevcut açık/koyu tokenlar; fuşya kayıt eylemleri, görsellerde sınırlı lila/mint ayrıntılar. Gölgeler raster nesnelerin fiziksel derinliği ve mevcut menülerle sınırlı.

Açılışa özel WebP sahnede katlanmış sunum sayfası, eğitmen ve üç katılımcı bir öğrenme alanı oluşturur. Bu görsel altta tekrarlanmaz. Üç ayrı destek görseli hazırlık, canlı eğitim ve eğitim sonrası aşamalarını anlatır; yazılar HTML'dir. İkinci bölümde metin solda, izometrik görsel sağda üç büyük kart vardır. Geniş ekranda kartlar kaydırmayla üst üste oturur; sıradaki kart alttan gelirken arkada kalan küçülür ve silikleşir. İlk/son kart açık lila–pembe, orta kart açık minttir. Sekme veya elle seçim yoktur. Mobil, kısa ekran ve azaltılmış hareket tercihinde kartlar doğal sırayla, üst üste binmeden gösterilir. Devamında 18 px / 500 ağırlıkta (mobilde 17 px) soru başlıkları, ince ayırıcılar ve tam genişlikte altı soru bulunur; başlangıçta kapalıdır ve tek seferde bir soru açılır. Entegrasyon bekleme listesinde özgün LİNBA logosu, 36 px (mobilde 32 px) bağlantı simgesi ve seçilen aracın logosu pencerenin ortasında aynı sırada gösterilir. Ardından sunumla başlamayı vurgulayan kapanış çağrısı vardır. Alt gezinme temel ürün bağlantılarını tekrar erişilebilir kılar. Küçük ekranda başlık, görsel ve bölüm içeriği tek sütuna geçer; gezinme yerel popover menüsüne dönüşür. Sahte müşteri referansları, ölçümler veya fiyatlandırma kullanılmaz.

## Kullanım senaryoları

Tanıtımda aşama kartları ile entegrasyonlar arasında dört seçilebilir profil vardır: kurumsal eğitmen, öğretim görevlisi, bağımsız eğitimci ve eğitim kurumları. Solda somut kullanım ve fayda, sağda kodla çizilmiş küçük ürün akışı gösterilir. Yapay zekâ katılımcı ajanlarıyla sesli prova ve eğitmenin anlatım performansına ilişkin geri bildirim, açık uçlu yazılı yanıtların yapay zekâ analizi, kaynak slayta bağlı eğitim sonrası sohbet farklı senaryolardır. Öğretim görevlisi örneğinde iki yazılı yanıt ve ortak kavram yanılgısı özeti gösterilir. Ardından kafa karışıklığı sinyali, benzer soruların ilgili slaytta yoğunlaşmasını temsil eder; gerçek ölçüm değildir. Gerçek kayıt, model yanıtı veya başarı ölçümü iddiası yoktur.

Kullanım senaryoları geniş ve en az 800 px yüksek ekranda tek sabit sahnede, her 75 vh kaydırmada bir sonraki profile geçer. Yukarı kaydırma sırayı tersine çevirir. Profil başlıkları ilgili kaydırma konumuna doğrudan erişim sağlar. Kaydırma olayları engellenmez. Mobil, kısa ekran ve azaltılmış hareket tercihinde dört profil normal belge sırasında gösterilir; JavaScript kapalıyken de tümü okunabilir. Dört profil de aynı 405 px pencere içinde (mobilde 397 px) üç sahne kullanır. Kurumsal eğitmen: ayrı lila alanda belirgin kitle tanımı, tanıma göre yapay zekâ ajanları; sesli provada bir ajanın sorusu; eğitmenin anlatım netliği/temposu/soru yanıtlama performansına ilişkin geri bildirim. Öğretim görevlisi: yazılı yanıtlar, görsel AI gruplaması ve sarı confusion spike grafiği. Bağımsız eğitimci: eğitim bittikten sonra hocanın gösterdiği bitki ve hayvan hücrelerini ayırt etme sorusu, kaynaklı yanıt ve bitki/hayvan hücresi karşılaştırmalı kaynak slayta dönüş. Son sahnede 7 günlük soru sorma erişimi ve bu sürenin eğitmen tarafından belirlendiği belirtilir. Eğitim kurumları: tarihli, katılım grafiği ve yanıt özeti içeren eğitim raporu; katılım, etkinlik yanıtları ve öğrenci davranışlarına ilişkin rapor sohbeti; sonraki eğitimler için iyileştirme önerileri. Kurumun soruları birinci çoğul şahısla, açıklamalar kurumsal hitapla yazılır. Kurum örneği rapora dayalı açıklama gösterir; kurum genelinde gerçek öğrenci analitiği veya ölçüm iddiası içermez. Her sahne 4,5 saniye kalır; sabit pencere içinde 450 ms çapraz solmayla biri kaybolurken diğeri belirir. Pencerenin üstünde oynat/duraklat ile aynı satırdaki 1–2–3 düğmeleri kısa adlar taşır, aktif adım renk ve dolu sayı ile gösterilir. Akış sayfa açılışında otomatik çalışır; oynat/duraklat düğmesiyle kullanıcı kontrol eder. 1–2–3 düğmesi seçilen sahneyi gösterir ve süreyi yeniden başlatır; kullanıcı duraklatmamışsa akış devam eder. Duraklatma tercihi profil ve sahne değişiminde korunur. Başka profil seçilince ilk sahneden başlanır. Bölüm ve tarayıcı sekmesi görünür değilken hareket durur. Azaltılmış hareket tercihinde otomatik geçiş yapılmaz; sahneler düğmelerle değiştirilebilir. Görsel akış erişilebilirlik ağacından gizlenir ve her profil için kısa sabit açıklama sunulur. JS olmadan ilk sahne okunabilir. Mobilde metin ve animasyon alt alta yerleşir; numaralı gezinme satırı korunur. Yeni bağımlılık veya model çağrısı yoktur.

Entegrasyonlar, merkezde özgün LİNBA logosu ve üç araç grubu ile bir bağlantı haritasında gösterilir: sunum araçları (PowerPoint, Google Slides), canlı eğitim (Microsoft Teams, Zoom, Google Meet) ve yapay zekâ asistanları (ChatGPT, Claude). Masaüstünde ince kesik bağlantılar yavaşça akar; 850 px altında gruplar doğal ızgaraya, 540 px altında tek sütuna geçer. Bağlantılar azaltılmış hareket tercihinde sabittir. Planlandıkları açıklanır; araç düğmeleri genel bekleme listesi penceresini açar.

Üst/alt gezinme ve mobil menüde “Kullanım senaryoları / Use cases” bağlantısı #kimler-icin bölümüne yumuşak kayar. Ek bağlantının sığması için üst menü 1200 px altında dar menüye geçer. Senaryo penceresi ve metni birlikte hafifçe belirir; sahne içindeki öğeler 45 ms aralıklarla sıralı geçiş yapar. Aktif adımın etrafındaki ince halka 4,5 saniyelik süreyi gösterir, duraklatıldığında durur ve adım seçilince sıfırlanır. Azaltılmış harekette halka ve geçiş hareketleri kapalıdır.

Kullanıcı grupları ikonlu, dört sütunlu tek gezinme şeridinde sunulur; seçili profil beyaz yüzey ve fuşya ikonla ayrılır. Mobilde iki sütuna geçer. Örnek pencereler masaüstünde 405 px, mobilde 397 px yüksekliğindedir; sağ sütun daha geniştir. Bağımsız eğitimci son sahnesinde hücre karşılaştırmalı kaynak slaytı ve eğitmenin belirlediği 7 günlük asistan erişimi birlikte gösterilir; bu süre landing örneğine aittir.

Kurum raporunun ilk sahnesinde büyük dekoratif simge kullanılmaz. Tarihli başlığın altında katılım eğrisi ve üç yanıt grubu, alt satırda da korelasyon/nedensellik konusu için yeniden ele alma önerisi vardır. Grafikler sabit temsili veriyle çizilir; gerçek katılımcı sayısı veya performans yüzdesi iddia edilmez. Mobilde katılım eğrisi ve üçlü yanıt satırı alt alta yerleşir.

## Açılış ve ajan anlatımı

Ana sayfa eğitim için yapay zekâ ajanlarını üç somut kullanım üzerinden anlatır: sesli pratik, katılımcı etkileşimi ve öğrenme sonuçlarını değerlendirme. Üçüncü İngilizce mesaj “assess learning.” olarak çevrilir; ölçümün konusu açıktır, otomatik notlandırma iddiası yoktur. Kaynaklara dayanma, eğitmene soru iletme ve son kararın eğitmende olması FAQ içinde açıklanır. Dosya formatları ve sunum yükleme pazarlama anlatımının odağı değildir; gerçek örneklerde kaynak dosyaları ve slayt atıfları korunur.

Başlık tek lila renktedir. Beyaz/tema zemini üzerinde üç farklı izometrik sahne, 4 saniyelik otomatik döngü ve sakin çapraz solmayla başlığa eşlik eder. Mevcut `hero-learning-space.webp` etkileşim sahnesinde korunur; `hero-agents-rehearsal.webp` ve `hero-agents-assessment.webp` yeni sahnelerdir. Görsel altındaki 1–2–3 ve kısa adlar mesajı seçer, süreyi yeniden başlatır; oynat/duraklat kontrolü yoktur. Ekran veya sekme görünür değilken döngü durur. Azaltılmış harekette otomatik geçiş kapalıdır, seçim düğmeleri çalışır. Sunucu ve ilk istemci çıktısı aynıdır. Tüm görsellerin alanı yüklenmeden ayrılır.

Ana ve kapanış eylemleri “Şimdi Dene, Ücretsiz!” ve “Bekleme listesine katıl”dır. İlk eylem kayıt yoluna gider; ikinci genel e-posta kayıt penceresini açar. Bekleme listesi üst menüye eklenmez. Kapanışta küçük `agents-invitation.webp` kullanılır; footer “Eğitim için yapay zekâ ajanları.” der. Özgün logo, Inter, fuşya ana eylemler ve 8 px düğme köşeleri korunur. Yeni görseller yerleşik imagegen ile üretilip gerçek alfa kanalı korunarak WebP olarak projeye kopyalanmıştır; promptlar docs/LANDING_GORSELLERI.md içinde saklanır.

Entegrasyon haritası kaydırmaya doğrudan bağlıdır: araç grupları 30 px hareketten yerlerine otururken netleşir, merkezdeki logo hafifçe ölçeklenir ve üç bağlantı merkezden araçlara doğru çizilir. Her grubun ilerlemesi kendi yerleşim yüksekliğinden hesaplanır; yukarı kaydırma ilerlemeyi geri sarar. Tek seferlik zaman animasyonu, sabitleme veya tekerlek/dokunma engeli yoktur. IntersectionObserver yalnız harita yakınındayken pasif scroll dinleyicisinin requestAnimationFrame boyamasını etkinleştirir. Okumalar yazmalardan önce yapılır, offsetTop/offsetHeight sayesinde dönüşümler kendi hesaplarına etki etmez. Sunucu/JS kapalı ve azaltılmış hareket durumlarında içerik bütünüyle görünürdür. Klavye odağı alan grup daima tam okunaklıdır. Tarayıcının View Transition desteği varsa dil seçimi 160–260 ms çapraz solmayla güncellenir; destek yoksa veya hareket azaltılmışsa doğrudan değişir. Etki yalnız tanıtım sayfasında kullanılır.

Altı FAQ; ajan rolleri, kitlenin provayı şekillendirmesi, kaynaklı öğrenme yanıtları, öğrenme değerlendirmesi, eğitim sonrası erişim ve deneme/bekleme listesi ayrımını kapsar. Entegrasyonların planlandığı bölümün kısa açıklamasında belirtilir; deneme FAQ yanıtında bu bilgi tekrarlanmaz. Mevcut dört kullanım senaryosu ve eğitim öncesi/sırası/sonrası kart yapısı korunur.

Footer, marka/açıklama, iki sütunlu gezinme ve sosyal medya olarak düzenlenir. LinkedIn, Instagram, X ve YouTube ikonları mevcut Phosphor ailesindendir. Gerçek hesap adresleri henüz verilmediği için yerel disabled düğmelerdir; bağlantı veya tıklama işlemi yoktur. Sosyal alanda yalnız ikonlar görünür; başlık ve yakında etiketi kullanılmaz. Mobilde alanlar alt alta gelir; 44 px sosyal düğmeler ve en altta ayırıcıyla telif satırı korunur.

Açılışın 1–2–3 seçeneklerinde dolu seçili kutu kullanılmaz; ince çerçeveli, hafif lila zeminli sayı ve metin rengi aktif adımı belirtir. Görsel yalnız solmayla değişir, başlıktaki dikey hareket 4 px ile sınırlıdır; çıkış girişten daha kısadır. Otomatik süre ve tıklayarak seçim davranışı korunur.

Anasayfadaki prova anlatımı “pratik yap / practice” olarak güncellendi; İngilizce katılım başlığı “engage participants.” ifadesini kullanır. Başlık, aşamalar, kullanım örnekleri, FAQ ve kapanış aynı dili izler.

Entegrasyon grup başlıkları, ikonla birlikte 14 px / 600 ağırlıkta ve araç kartlarının iç boşluğuna hizalanarak sunulur. Alt grubun başlığı da aynı hizayı izler; dikey bağlantı noktasıyla metin arasında boşluk korunur. Deneme FAQ yanıtı LİNBA’nın yakında kullanıma açılacağını, ilk haberler için bekleme listesini ve ajanları ücretsiz deneyimlemeyi açıklar. Yanıtın sonundaki altı çizili “Şimdi Dene, Ücretsiz!” bağlantısı, ajan deneyimi ve bekleme listesi ekranına gider.

## Açılış öncesi karşılama

`/giris` ve eski `/giris?mod=kayit` bağlantıları, hesap alanları yerine genel bekleme listesi ve “LİNBA ajanlarını deneyimle” seçeneğini gösterir. Solda sade başlık, açıklama ve ajanları deneyimleme düğmesi; sağda e-posta bekleme listesi formu vardır. İzometrik tanıtım bloğu, küçük bekleme listesi etiketi ve tekrar eden ajan rolleri kaldırılmıştır. Alanlar yalnız ince ayırıcı ve boşlukla ayrılır. Bekleme listesi mevcut `public-waitlist` API’sine, deneyim mevcut örnek çalışma alanı akışına bağlanır. Başarı ve hata durumları ayrıdır. “Demo” sözcüğü kullanıcıya gösterilmez. Mevcut kullanıcı girişi küçük bağlantıdan `/giris?mod=giris` yolunda korunur. Katılımcı girişi değişmez. Mobilde iki eylem alanı alt alta, koyu temada ortak tokenlarla gösterilir.
