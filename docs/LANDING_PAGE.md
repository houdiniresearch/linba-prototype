# LİNBA tanıtım sayfası

## Kararlar

- Ana kayıt çağrısı “Ücretsiz başla”dır. Üst çubuk masaüstünde 68 px, mobilde 64 px; girişin sağında ayrı kayıt bağlantısı vardır. İlk ekranda yinelenen “Nasıl çalışır?” bağlantısı kaldırılmıştır, üst gezinmede korunur.

- Marka korundu: özgün logo, Inter, fuşya eylemler ve lila/mint ayrıntılar.
- Üst çubuk cam yüzeyle sayfada sabit kalır; gezinme logonun yanında, dil ve giriş sağdadır. Tanıtımda tema seçici gösterilmez, mevcut görünüm tercihi korunur. Bölüm bağlantıları sabit çubuğun altında boşluk bırakarak yumuşak kayar; azaltılmış hareket tercihinde doğrudan gider.
- “Katılımcı mısın?” formu ana menünün üzerindeki ince lila şeritte yer alır. Kod alanı ve Katıl düğmesi tek yüzeyde birleşir; önek kullanılmaz. Form ortalanır, şerit masaüstünde yaklaşık 45 px yüksekliğindedir. Odakta yalnız kutunun ince sınırı renk değiştirir, giriş alanına halka veya gölge eklenmez. Altı rakam doğrulanır ve `/katil?kod=…` adresine aktarılır. Hesabı olmayan katılımcı mevcut giriş/kayıt akışında ilerler; kod sayfa adresinde korunur. Üst/alt gezinmede ve mobil menüde “Entegrasyonlar” araç seçimini altında açar. Ayrı “Bekleme listesine katıl” düğmesi doğrudan genel kayıt penceresini açar; sayfa kaydırılmaz. Menü klavye ve Escape destekler, ekran kenarlarında konumu düzeltilir. Katılım formu üst şeritte kalır. Şerit kaydırmada geride kalır, ana menü sabit kalır.
- Dil seçimi sistem select'i yerine tetikleyicisinin altında açılan yerel popover kullanır. Tam dil adları, seçim işareti, klavye yön tuşları, Escape ve dışarı tıklayarak kapatma desteklenir; panel kaydırma ve yeniden boyutlandırmada düğmeyi izler.
- Arka plandaki ince izometrik çizgi deseni, üst görselin ve alt bölümün kenarlarında yumuşakça belirir. Metin çevresinde silikleşir; ortak lila tokenı iki temaya uyum sağlar. Küçük, yerel SVG yalnız dekoratif CSS maskesidir; hareket veya ek bağımlılık içermez.
- Tasarım varyansı 6, hareket yoğunluğu 3, içerik yoğunluğu 2. İki satırlı ana mesaj ve tek izometrik sahne; uzun özellik ızgaraları yok.
- Aşamalar referanstaki gibi üst üste gelen üç büyük karttır; metin ve izometrik görsel aynı kartla birlikte hareket eder. Geniş/yeterince yüksek ekranda kartlar sırayla sabitlenir, sonraki kart alttan gelip öncekinin üzerine oturur. Arkadaki kart kaydırma ilerlemesine bağlı olarak en fazla %6 küçülür ve temanın zemin rengiyle %60 oranında silikleşir; alttaki diğer kartın yazıları içinden görünmez. Yukarı kaydırma hareketi tersine çevirir. İlk/son kart açık lila–pembe, orta kart açık minttir. Yerel sticky yerleşimi, yalnız bölüm görünürken çalışan IntersectionObserver + tek requestAnimationFrame güncellemesi kullanılır; harici animasyon bağımlılığı yoktur. Metinlerin tümü normal belge sırasındadır. Mobil, kısa ekran, JavaScript kapalı veya azaltılmış hareket tercihinde kartlar üst üste binmeden sırayla gösterilir. Sunucu ve ilk istemci çıktısı aynıdır; geliştirilmiş görünüm yalnız hydration sonrasında etkinleşir.
- Sekiz sık sorulan soru yerel details/summary ile açılır. Sorular tam genişlikte, 18 px / 500 ağırlıkta başlıklarla (mobilde 17 px) ve ince ayırıcılarla sunulur. Başlangıçta kapalıdır, tek seferde bir soru açık kalır. İçerik LİNBA, dosyalar, prova, aktiviteler, katılım, asistan, eğitim sonrası ve planlanan entegrasyonları kapsar. Kapanışta ilk adım sunum yüklemek olarak açıklanır; footer temel gezinme bağlantıları sunar.
- Kartların ardından beş planlanan entegrasyon sade bir logo sırasıyla sunulur. Her düğme hesabı olmayan ziyaretçilerin de kullanabildiği genel LİNBA bekleme listesi formunu açar; kayıtlar kalıcıdır ve entegrasyona göre ayrılmaz. Pencerenin üstünde özgün LİNBA logosu, 36 px (mobilde 32 px) bağlantı simgesi ve seçilen aracın logosu ortalanarak yer alır. Detaylar [ENTEGRASYONLAR.md](ENTEGRASYONLAR.md) içinde. Akış başlığı ve eğitim öncesi/sırası/sonrası etiketleri ikonlarla öne çıkarılır; aşama yazıları masaüstünde 20 px, mobilde 18 px'tir.
- Dört şeffaf görsel yerleşik imagegen ile üretildi. Açılış görseli yalnız üst bölümde kullanılır; kavisli kâğıt zeminin sunum sayfasına dönüştüğü bir öğrenme alanında eğitmen ve üç katılımcıyı gösterir. Tam promptlar [LANDING_GORSELLERI.md](LANDING_GORSELLERI.md) içinde. PNG kaynakları Codex görsel dizininde korunur, uygulama `public/landing` altındaki WebP sürümlerini kullanır. Toplam sıkıştırılmış kaynak boyutu yaklaşık 564 KB.

## Yollar ve oturum

- `/`: sunucuda mevcut oturum kontrol edilir; ziyaretçi tanıtımı, oturum açmış kullanıcı çalışma alanını görür.
- `/kesfet`: mevcut oturumdan bağımsız tanıtım önizlemesi.
- `/giris`: giriş; `/giris?mod=kayit`: kayıt. Mevcut Auth bileşeni ve aynı API kullanılır. Giriş/kayıt tamamlanınca sunucu oturumunu okuyacak tam gezinme yapılır.
- `/katil`: mevcut katılımcı yolu korunur.
- `/giris/loading.tsx`: form düzenine uygun iskelet.

## Doğrulama

Tarayıcıda açık/koyu tema, Türkçe/İngilizce, 320/390 px mobil, 768/1024 px tablet ve 1470 px masaüstü ölçüleri; kaydırmada ileri/geri kart yığılması, mobil menü, soru açma ve giriş/kayıt geçişleri kontrol edildi. Yatay taşma yok. Açık temada ana düğme kontrastı 4,60:1, açıklama metni kontrastı 5,73:1. Azaltılmış hareket altında kart yığılması yerine doğal üç aşamalı akış kullanılır; soru geçişi animasyonsuzdur. `npm run test:landing` anonim ve oturumlu yol davranışını gerçek yerel sunucuda doğrular, test hesaplarını temizler. Build, 14 alan testi, 2 bekleme listesi/dil testi ve 1 tanıtım yolu testi geçti.

Lighthouse bu ortamda kurulu bir araç olarak bulunmadığından skor üretilmedi. Görsellerin alanları önceden ayrılır, ilk görsel yüksek öncelikle yüklenir, diğerleri tembel yüklenir; ek animasyon bağımlılığı yoktur. Performans değerlendirmesi yerel geliştirme sunucusuna aittir, üretim Lighthouse ölçümü değildir.

## Kimler için?

`components/landing-audience.tsx` ve kendi CSS dosyası, kartların ardından üç kullanım senaryosu sunar. Kurumsal eğitmen sesli prova, öğretim görevlisi ders içi aktivite, bağımsız eğitimci eğitim sonrası kaynaklı sohbet örneğini seçer. Küçük ürün gösterimleri temsili içeriktir ve görünür “Örnek senaryo” etiketi taşır. Sekmeler manuel ve klavye ile seçilir; hareket duraklatılabilir. Animasyon ekran dışında ve tarayıcı sekmesi gizliyken durur, azaltılmış hareket tercihinde tüm içerik statik gösterilir. Telefon/grafik katmanları küçük ekranda metinleri kapatmaz.
