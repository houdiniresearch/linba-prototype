# LİNBA — Ürün arayüzü iş listesi

İnceleme tarihi: 18 Ekim 2026. Amaç: landing page’de ulaşılan görsel özeni ürünün mevcut akışlarına taşımak. Bu belge bir uygulama planıdır; listelenen değişiklikler henüz yapılmadı.

## Sonuç

Ürün aynı marka renklerini kullanıyor ve temel ekran ayrımları doğru. Kalite farkı daha çok bilgi hiyerarşisi, tekrar eden kontroller, metin yoğunluğu, ortak bileşenlerin farklılaşması ve eski ürün dilinden geliyor. Önce ortak arayüz sistemi, ardından ana panel ve eğitim düzenleyici ele alınmalı. Ajanların değerini en güçlü gösterecek sonraki iki alan sesli pratik ve raporlar.

Landing page’in büyük başlıklarını, sürekli dönen animasyonlarını ve desenini bütün çalışma ekranlarına yaymak hedef değil. Taşınacak olan; net hiyerarşi, tutarlı boşluklar, iyi yazılmış metinler, özenli kontroller ve anlaşılır durum geçişleri.

## İnceleme kapsamı ve sınırlar

Canlı olarak incelenenler:

- Eğitmen ana paneli ve eğitim kartları.
- Yeni eğitim oluşturma penceresi.
- Eğitim düzenleyici ve aktivite oluşturma penceresi.
- Pratik hazırlığı ve daha önce oluşturulmuş katılımcı ajanlarının görünümü.
- Yansıtılan ekran / katılımcı önizlemesi.
- Hazırlık durumundaki bir eğitimin doğrudan açılan canlı kontrol görünümü.
- Rapor listesi ve tamamlanmış bir eğitimin raporu.
- Seçili rapora bağlı rapor ajanının başlangıç ekranı.
- Ayarlar.

Kaynak kodundan ayrıca katılımcı sohbeti, etkinlikler, erişim süresi durumları, pratik geri bildirimi ve mobil CSS incelendi.

Bu turda gerçek mikrofon oturumu başlatılmadı, AI çağrısı yapılmadı, yeni eğitim oluşturulmadı ve eğitim başlatılıp bitirilmedi. Katılımcı hesabıyla canlı katılım ve gerçek telefondaki klavye davranışı test edilmedi. Görsel inceleme 1280 × 720 masaüstü ve sistemin koyu temasıyla yapıldı. Tarayıcı viewport değişikliği bu oturumda boyutu değiştirmediği için mobil bulguların uygulama sonrası cihazda doğrulanması gerekiyor. Bu belge işlevsel ya da WCAG uygunluk sertifikası değildir.

Ekran görüntüleri yerel `output/product-review/` klasöründe: `dashboard.png`, `create-training.png`, `editor.png`, `activity-editor.png`, `practice-setup.png`, `practice-agents.png`, `preview.png`, `live-control.png`, `report-list.png`, `report-detail.png`, `report-agent.png`, `settings.png`.

## Korunacaklar

- Mevcut logo, Inter ve lila / fuşya / mint renk rolleri.
- Eğitmen kontrolü, yansıtılan sunum ve katılımcı ekranının ayrılması.
- Yüklenen sunum sayfalarının içerik ve renklerinin korunması.
- Sohbet ve etkinliklerin ayrı tutulması; kişisel yanıtların diğer katılımcılara açılmaması.
- Kaynak slayt bağlantıları ve yanıt bulunamadığında eğitmene iletim.
- Otomatik kayıt bilgisi, mevcut iskeletler, hata / yeniden deneme ve azaltılmış hareket desteği.
- Rapor ajanındaki rapor listesi + seçili rapora ait sohbet yapısı. Her rapor ayrı konuşma olarak kalmalı.
- Süresi eğitmenin belirlediği eğitim sonrası erişim.

## Öncelikli işler

P1: kullanıcıya yanlış durum gösterebilen veya ana görevi zorlaştıran işler. P2: ekranın anlaşılırlığı ve görsel tutarlılığı. P3: temel yapı oturduktan sonraki ince işçilik.

### UI-01 — Ortak arayüz bileşenleri ve ölçüler [P1, ilk iş]

**Bulgu:** Landing, ana panel, düzenleyici ve rapor ajanında başlık, üst çubuk ve kontrol yoğunlukları farklılaşıyor. `ui.tsx` içinde ortak bileşenler var; fakat birçok varyant ekran CSS’i içinde ayrı tanımlanmış.

**Yapılacaklar:**

- [ ] Butonlarda primary / secondary / quiet / danger / loading durumlarını ortaklaştır.
- [ ] Sayfa başlığı, bölüm başlığı, açıklama ve meta metin ölçeğini belirle. Çalışma ekranlarında 14–16 px gövde, 12–13 px yardımcı bilgi başlangıç noktası olsun; gerçek slayt küçük resimleri bu kuralın dışında.
- [ ] Boşluk, kontrol yüksekliği, köşe, çerçeve ve odak stillerini ortak tokenlara bağla.
- [ ] Üst çubuklarda geri dönüş, ekran adı, kayıt / bağlantı durumu ve ana eylemin konumunu standardize et.
- [ ] Aktif sidebar / sekme / filtre durumlarını hem görsel hem semantik olarak tutarlı yap.
- [ ] Ortak modal, boş durum ve işlem ilerlemesi görünümünü aynı standarda getir.

**Tamamlanma ölçütü:** Aynı işlevli iki kontrol farklı ekranda farklı görünmüyor; fare, klavye, yüklenme ve disabled durumları tanımlı. Açık / koyu temada ana görev rahatça okunuyor.

**Dosyalar:** `components/ui.tsx`, `components/header-actions.tsx`, `app/globals.css`, `components/skeletons.tsx`, `components/operation-progress.tsx`.

### UI-02 — Ajan odaklı ürün dili [P1, UI-01 ile birlikte]

**Bulgu:** Landing pratik, katılım ve değerlendirme ajanlarını anlatırken ürün hâlâ “Bir sunum”, “Sesli prova”, “Dokümanla öğrenme”, “LİNBA asistan”, “Rapor asistanı” gibi farklı adlar kullanıyor. Ayarlarda model adı ve pratikte token / USD maliyeti son kullanıcı deneyimine taşınıyor.

**Yapılacaklar:**

- [ ] Eylem adında “Pratik yap / Practice”; rol adlarında “Yapay zekâ katılımcı ajanları”, “Öğrenme ajanı”, “Rapor ajanı” kullan.
- [ ] Yapay zekâ katılımcı ajanlarını gerçek katılımcılardan açıkça ayır.
- [ ] Sidebar’daki tekrarlı tanıtım kutusunu kaldır veya daha kısa, işe yarayan bir alana çevir.
- [ ] Dosya yükleme, sunum ve kaynak slayt sözcüklerini gerekli teknik bağlamlarda koru; her yerde körlemesine değiştirme.
- [ ] Model / token / ham API maliyeti bilgilerini gerekiyorsa gelişmiş teknik görünümde tut. Ürün planı ve kullanıcı kotasıyla API maliyetini birbirine karıştırma.
- [ ] Türkçe ve İngilizce metinleri aynı anda kontrol et; eğitimin kendi içeriğini çevirmeye çalışma.

**Tamamlanma ölçütü:** Kullanıcı hangi ajanın ne yaptığını her ekranda aynı kelimelerle anlıyor; ürün altyapısını öğrenmek zorunda kalmıyor.

**Dosyalar:** `components/dashboard.tsx`, `components/editor.tsx`, `components/rehearsal.tsx`, `components/participant.tsx`, `components/report-assistant.tsx`, `lib/translations.ts`.

### UI-03 — Ana panel ve eğitim kartları [P2, ilk referans ekran]

**Bulgu:** Bütün kartlar aynı dekoratif kapağı taşıyor; eğitim adı hem kapakta hem kart gövdesinde tekrarlanıyor. “PDF veya PPTX” satırı, sidebar tanıtımı ve alttaki üçlü rehber aynı başlangıç mesajını çoğaltıyor.

**Yapılacaklar:**

- [ ] Sayfayı tek baskın “Yeni eğitim” eylemi ve eğitimlerine devam etme ihtiyacı etrafında düzenle.
- [ ] Kartlarda mümkünse gerçek ilk slayt küçük resmi kullan; yoksa sakin ve tutarlı bir yedek görünüm göster.
- [ ] İsim, durum, tarih ve uygun sonraki eylemi net sırala. Taslak için “Hazırlamaya devam et”, tamamlanan için rapora erişim gibi duruma uygun yollar düşün.
- [ ] Tekrarlı başlık ve süslemeleri azalt; uzun isimleri ve farklı sayıda kartı kontrol et.
- [ ] İlk kullanım rehberini boş durumda göster; her dönüşte aynı üç adımı tekrar ettirme.
- [ ] Beta dönemindeki “Planı yükselt” eyleminin ana görevle rekabetini azalt; mevcut bekleme listesi işlevini yanlış bir ödeme akışı gibi sunma.

**Tamamlanma ölçütü:** Kullanıcı ilk bakışta yeni eğitim başlatma ve mevcut eğitime devam etme yollarını ayırabiliyor. Boş / tek / çok kayıt durumlarında aynı düzen çalışıyor.

**Dosyalar:** `components/dashboard.tsx:456`, `components/dashboard.tsx:709`, `components/header-actions.tsx`, `app/globals.css`.

### UI-04 — Eğitim oluşturma [P2]

**Bulgu:** Dosya seçimi, ad, erişim süresi ve otomatik yanıt ayarı tek uzun formda aynı ağırlıkta. Bu ayarların sonraki akışta neyi etkilediği uzun yardımcı metinlerle açıklanıyor.

**Yapılacaklar:**

- [ ] Dosya seçimi ve eğitim adını ana içerik; öğrenme ajanı erişimi ve canlı yanıtı ikincil ayarlar olarak grupla.
- [ ] Seçilen dosyayı adı, türü ve değiştir eylemiyle kompakt göster.
- [ ] Süre için anlaşılır varsayılanı koru; 0 gün davranışını seçime yakın açıkla.
- [ ] Yükleme → işleme → hazır durumlarının görünümünü ortak işlem bileşenleriyle iyileştir.
- [ ] Hatalarda kullanıcının dosya / ad / tercihlerini koru; yeniden deneme yolunu belirgin tut.

**Tamamlanma ölçütü:** Dosya seçtikten sonra ne yapılacağı açık; 0 gün, dosya limiti ve işlem hataları anlaşılır.

**Dosyalar:** `components/dashboard.tsx:32`, `components/operation-progress.tsx`.

### UI-05 — Eğitim düzenleyici ve etkinlik oluşturma [P1]

**Bulgu:** “Aktivite ekle” aynı görünümde sol üstte, slayt akışının altında, sahne altında ve sağ panelde tekrarlanıyor. Sağ panelde açıklamalar ve ayarlar birbirine yakın ağırlıkta. Aktivite seçenekleri çok satırlı tek textarea ile düzenleniyor.

**Yapılacaklar:**

- [ ] Ana ekleme noktası ve bağlamsal ekleme yolunu belirle; gereksiz tekrarları kaldır.
- [ ] Sunum / etkinlik ayrımını küçük resim ve sıra içinde daha anlaşılır yap.
- [ ] Sağ paneli seçili öğenin gerçek işiyle sınırla; genel açıklamaları azalt.
- [ ] Etkinlik türü seçimi → içerik → önizleme / akışa ekleme sırasını netleştir.
- [ ] Anket seçeneklerini ayrı satırlar ve anlaşılır ekle / çıkar kontrolleriyle düzenle.
- [ ] AI ile üretimin hangi slaydı kullandığını ve sonucun eğitmen tarafından düzenlenebildiğini belirginleştir.
- [ ] Otomatik kayıt, kaydediliyor ve kayıt hatası durumlarını aynı yerde göster.

**Tamamlanma ölçütü:** Kaynak slayt korunarak etkinlik eklenebiliyor, düzenlenebiliyor ve taşınabiliyor; kullanıcı sıradaki adımı aramıyor.

**Dosyalar:** `components/editor.tsx:31`, `components/editor.tsx:471`, `components/slides.tsx`, `app/globals.css`.

### UI-06 — Sesli pratik ve ajanlar [P1]

**Bulgu:** Kitle tanımı ekranı anlaşılır bir başlangıca sahip. Ancak oluşturulmuş ajanlarda iki uzun paragraf, ses türü, ses adı ve dinleme düğmeleri her ajan için açık. Hazırlık / oturum / geri bildirim aynı sayfa içinde farklı yoğunluklarda sunuluyor. Kullanım ve tahmini ücret bölümü teknik ayrıntı taşıyor.

**Yapılacaklar:**

- [ ] Hazırlık → pratik → geri bildirim aşamalarını durumla açıklayan tutarlı bir düzen kur; dekoratif otomatik sayfa geçişi ekleme.
- [ ] Kitle tarifini görünür ve düzenlenebilir bir özet olarak tut.
- [ ] Her ajan için ad, kısa profil ve beklenen soru yaklaşımını öne çıkar; uzun biyografi ve ses ayarını açılır ayrıntıya al.
- [ ] Konuşan ajan, dinleme / düşünme / bağlantı durumu ve mikrofon kontrolünü tek odakta topla.
- [ ] Ana kontrolü uzun içerikler arasında kaybolmayacak şekilde yerleştir.
- [ ] Geri bildirimi eğitmenin anlatım netliği, temposu, verdiği yanıtlar ve sonraki pratik önerileri olarak düzenle; öğrenci başarısıyla karıştırma.

**Tamamlanma ölçütü:** Kullanıcı gerçek kişilere değil kitleyi temsil eden AI ajanlarına konuştuğunu, mikrofonun durumunu ve geri bildirimin neyi değerlendirdiğini anlıyor.

**Dosyalar:** `components/rehearsal.tsx:581`, `components/rehearsal.tsx:802`, `components/rehearsal.tsx:853`, `components/rehearsal.tsx:913`.

### UI-07 — Canlı kontrol ve gerçek durum tutarlılığı [P1]

**Doğrulanan bulgu:** Hazırlık durumundaki bir eğitimin `/canli` adresi doğrudan açıldığında üstte “Hazırlanıyor” yazarken sahnede “Katılımcılar bu slaytı görüyor” ve “AI otomatik yanıtlıyor” yazıyor. Bu turda eğitim başlatılmadı.

**Yapılacaklar:**

- [ ] Görünümü URL’ye göre değil gerçek eğitim durumuna göre kur; taslakta canlı göstergeleri gösterme.
- [ ] Canlılık, katılımcı sayısı, ajan yanıt durumu ve eğitmene iletilen sorular için açık bir durum özeti tasarla.
- [ ] Yansıtma, katılım paylaşımı ve eğitimi bitirme eylemlerini birbirinden net ayır.
- [ ] Eğitmene iletilen soru ile AI tarafından yanıtlanan soruyu renk dışında metin ve ikonla da ayır.
- [ ] Uzun soru listesi, boş liste, bağlantı kesintisi ve eğitim sonu durumlarını kontrol et.

**Tamamlanma ölçütü:** Taslak eğitim canlı gibi görünmüyor; eğitmen o anda neyin yayında olduğunu ve hangi soruya müdahale etmesi gerektiğini anlayabiliyor.

**Dosyalar:** `app/egitim/[id]/canli/page.tsx`, `components/editor.tsx:477`, `components/editor.tsx:521`, `components/editor.tsx` içindeki `QuestionPanel`.

### UI-08 — Katılımcı sohbeti ve eğitim sonrası erişim [P1]

**Bulgu:** Sohbet / etkinlik ayrımı ve kişisel yanıtlar doğru. Kaynak kodunda erişim süresi bitince sohbet kapatılıyor; fakat giriş metni hâlâ “Eğitmen eğitimi başlattığında…” diyebiliyor. Bu, süre sonunu bekleme durumuyla karıştırıyor.

**Yapılacaklar:**

- [ ] Bekleme, canlı, eğitim sonrası açık ve erişimi sona ermiş durumlar için ayrı metin / görünüm kur.
- [ ] “Öğrenme ajanı” kimliğini, özel sohbeti ve kaynaklı yanıtı sade biçimde anlat.
- [ ] Kaynak slaydı mesaj akışını bozmayacak, mobilde kapatması kolay bir görünümde aç.
- [ ] Etkinlik geldiğinde neden sekme değiştiğini belirt; önceki sohbet ve yazılan metin korunmalı.
- [ ] Gönderiliyor, yanıt hazırlanıyor, eğitmene iletildi ve cevaplandı durumlarını tutarlı göster.
- [ ] Gerçek telefonda klavye açılırken yazma alanı, sekmeler, yanıt gönderimi ve güvenli alt boşluğu doğrula.

**Tamamlanma ölçütü:** Katılımcı şu an ne yapabildiğini ve eğitim bitince ne zamana kadar soru sorabileceğini biliyor; erişim bitişi yanlış bir bekleme mesajına dönüşmüyor.

**Dosyalar:** `components/participant.tsx:225`, `components/participant.tsx:268`, `components/participant.tsx:288`, `components/participant.tsx:363`, `components/participant.tsx:379`.

### UI-09 — Rapor listesi ve rapor ayrıntısı [P1]

**Bulgu:** Mevcut rapor ekranı sayılar, uzun özet paragrafı, soru grupları ve etkinlik sonuçları sunuyor; kurumun / eğitmenin çıkaracağı karar ikinci planda. İncelenen örnekte eğitim dışı bir kuantum sorusu, önerilerde ayrı eğitim planlama tavsiyesine de dönüşmüş.

**Yapılacaklar:**

- [ ] Rapor başında “Öne çıkan öğrenme ihtiyaçları” ve “Sonraki eğitimde geliştirilebilecekler” gibi kısa, veriye bağlı bölümler oluştur.
- [ ] Toplam sayıları bağlam olarak kullan; yalnız sayılardan başarı, kavrama veya davranış skoru türetme.
- [ ] Konu grupları ve etkinlik sonuçlarından kaynak kayıtlarına kolay geçiş sağla.
- [ ] Kapsam dışı soruları ana öğrenme ihtiyaçlarından ayır; tek bir ilgisiz soruyu otomatik öneriye dönüştürme. Bu iş görsel düzenin yanında rapor üretim mantığı kontrolü de gerektirir.
- [ ] Rapor listesindeki tarih ve erişim bilgisini sadeleştir; gerçek veri varsa katılım / soru özetini taranabilir göster.
- [ ] Rapor ajanına geçişi ana eylemlerden biri yap.

**Tamamlanma ölçütü:** Rapor “kaç kayıt var?” yanında “neye dikkat etmeliyim?” sorusuna da yanıt veriyor; her yorumun dayanağı görülebiliyor.

**Dosyalar:** `components/dashboard.tsx:171`, `components/dashboard.tsx:580`, `lib/report-chat.ts`, rapor üretim kodu.

### UI-10 — Rapor ajanı [P2, UI-09 ile birlikte]

**Bulgu:** Ayrı rapor listesi, seçili rapor bağlamı, önerilen sorular ve kaynaklara dönüş altyapısı hazır; bu ekran ürünün güçlü temellerinden biri. İsimlendirme ve başlangıç soruları landing’deki kurum anlatımıyla tam örtüşmüyor.

**Yapılacaklar:**

- [ ] “Rapor asistanı” adını ortak ajan diline taşı.
- [ ] “Öğrenciler en çok nerede zorlandı?”, “Sonraki eğitimde neyi iyileştirebiliriz?” gibi somut öneriler kullan; seçili raporun kapsamını koru.
- [ ] Kaynak gösterimini kısa ve tıklanabilir tut; kaynak kayıt ile ajan yorumu görsel olarak ayrışsın.
- [ ] Uzun yanıtları kısa başlıklar ve taranabilir paragraflarla sun; varsa mevcut konuşma geçmişini koru.
- [ ] Henüz raporu olmayan kullanıcıya neden boş olduğunu ve nasıl rapor oluşacağını göster.

**Tamamlanma ölçütü:** Kullanıcı hangi raporu konuştuğunu, cevabın dayanağını ve öneriden sonra nereye gideceğini anlıyor. Raporlar arası kıyaslama yapılmış gibi görünmüyor.

**Dosyalar:** `components/report-assistant.tsx`, `lib/report-chat.ts`.

### UI-11 — Mobil ve erişilebilirlik geçişi [P1, tüm ekranların kabul koşulu]

**Kaynak bulguları:** Dar ekran düzenleyici butonları 35 px yüksekliğe ve 10 px metne iniyor; sağ araç paneli gizleniyor. Mobil menü 30 px genişlikte. Önizlemedeki sekme metinleri 11 px, açıklama notu 9 px; bunlar gerçek katılımcı ekranının ölçüleriyle karıştırılmamalı.

**Yapılacaklar:**

- [ ] Kontrolleri küçültmek yerine ikincil işlemleri menüye / çekmeceye taşı.
- [ ] Gizlenen eğitim ayarları ve aktivite düzenleme işlemlerine dar ekranda alternatif erişim sağla.
- [ ] Dokunma alanları için 44 × 44 px ürün hedefi kullan; görsel simge bu alanın içinde daha küçük kalabilir.
- [ ] Sekmelerin aktif durumunu semantik olarak belirt; klavye odağını ve modal dönüşünü kontrol et.
- [ ] 390 px telefon, 768 px tablet ve masaüstü; Türkçe / İngilizce; açık / koyu tema senaryolarını doğrula.
- [ ] Azaltılmış hareket tercihini koru; çalışma ekranlarında sürekli dekoratif animasyon kullanma.

**Tamamlanma ölçütü:** Ana işlemler dar ekranda gizlenmiyor; klavye ve dokunmayla tamamlanabiliyor. Bu turdaki kod bulguları gerçek cihazda yeniden doğrulanmış oluyor.

**Dosyalar:** `app/globals.css` mobil blokları, `components/editor.tsx`, `components/participant.tsx`, `components/report-assistant.tsx`.

### UI-12 — Ayarlar, profil ve durum ekranları [P2 / P3]

- [ ] Son kullanıcı ayarlarını hesap, görünüm / dil ve ürün erişimi olarak anlaşılır biçimde grupla.
- [ ] Model adı / API bağlantısı gibi teknik ayrıntıyı gerekli kullanıcıya ve uygun ayrıntı seviyesinde göster.
- [ ] Boş, işlemde, bağlantı kesildi, başarısız ve tamamlandı durumlarını ortaklaştır.
- [ ] Yükleme sırasında sonuç yokmuş gibi görünmeyi önleyen mevcut iskeletleri koru; yeni yerleşimlerle eşleştir.
- [ ] Formun içinde yapılan işi açıklayan kısa geçişler kullan; kullanıcıyı bekleten dekoratif sayfa girişleri ekleme.
- [ ] Deseni giriş / karşılama gibi sakin yüzeylerle sınırla; yoğun sohbet, rapor veya slaytın arkasına zorla ekleme.

## Önerilen uygulama sırası

1. **UI-01 + UI-02:** Ortak bileşen / ürün dili kararları. Henüz bütün sayfaları aynı anda değiştirme.
2. **UI-03:** Ana paneli referans ekran olarak bitir ve görsel standardı onayla.
3. **UI-04 + UI-05:** Eğitim oluşturma → düzenleyici → etkinlik akışı.
4. **UI-06:** Kitle tanımı → ajanlar → sesli pratik → performans geri bildirimi.
5. **UI-09 + UI-10:** Rapor → rapor ajanı; mevcut verinin değerini görünür kıl.
6. **UI-07 + UI-08:** Canlı kontrol ve katılımcının bekleme / canlı / eğitim sonrası durumları.
7. **UI-11 + UI-12:** Her aşamada doğrulanan mobil / tema / erişilebilirlik işlerini son ortak kontrolde tamamla.

UI-07’deki yanlış canlı durum metni ve UI-08’deki süre sonu metni, ilgili ekranın görsel yenilemesini beklemeden erken düzeltilebilir.

## İlk çalışma oturumunun sınırı

Yalnız ortak bileşenler, dil ve ana panelle başlamak en sağlıklı adım. Bir ana panel ekranında tipografi, butonlar, boşluklar, kartlar ve üst çubuk onaylandıktan sonra aynı standardı diğer ekranlara yayalım. Mikrofon, model, sunum işleme ve rapor iş mantığını bu ilk görsel çalışmayla birlikte yeniden yazmayalım.

## Genel kabul kontrolü

- [ ] Mevcut kayıtlar, kaynaklar, izinler ve kişisel sohbet sınırları korunuyor.
- [ ] Ana görev için tek baskın eylem var; durumlar gerçek veriyi yansıtıyor.
- [ ] Türkçe ve İngilizce metinler taşmıyor ve aynı ürünü anlatıyor.
- [ ] Açık / koyu temada metin, seçim, uyarı ve pasif kontroller okunuyor.
- [ ] Mobilde klavye, sekmeler, panel erişimi ve kaynak açma / kapama test edildi.
- [ ] Yeni yerleşimin boş, dolu, yükleniyor, hata ve erişim sonu durumları görüldü.
- [ ] Uygun mevcut testler ve tip kontrolü geçti; değişen ana akış tarayıcıda doğrulandı.
