# LİNBA tanıtım sayfası

## Kararlar

- Ana kayıt çağrısı “Ücretsiz başla”dır. Üst çubuk masaüstünde 68 px, mobilde 64 px; girişin sağında ayrı kayıt bağlantısı vardır. İlk ekranda yinelenen “Nasıl çalışır?” bağlantısı kaldırılmıştır, üst gezinmede korunur.

- Marka korundu: özgün logo, Inter, fuşya eylemler ve lila/mint ayrıntılar.
- Üst çubuk cam yüzeyle sayfada sabit kalır; gezinme logonun yanında, dil ve giriş sağdadır. Tanıtımda tema seçici gösterilmez, mevcut görünüm tercihi korunur. Bölüm bağlantıları sabit çubuğun altında boşluk bırakarak yumuşak kayar; azaltılmış hareket tercihinde doğrudan gider.
- “Katılımcı mısın?” formu ana menünün üzerindeki ince lila şeritte yer alır. Marka öneki, kod alanı ve Katıl düğmesi tek yüzeyde birleşir. Altı rakam doğrulanır ve `/katil?kod=…` adresine aktarılır. Hesabı olmayan katılımcı mevcut giriş/kayıt akışında ilerler; kod sayfa adresinde korunur. Üstteki katılım bağlantısı bu forma gider. Şerit kaydırmada geride kalır, ana menü sabit kalır.
- Dil seçimi sistem select'i yerine tetikleyicisinin altında açılan yerel popover kullanır. Tam dil adları, seçim işareti, klavye yön tuşları, Escape ve dışarı tıklayarak kapatma desteklenir; panel kaydırma ve yeniden boyutlandırmada düğmeyi izler.
- Arka plandaki ince izometrik çizgi deseni, üst görselin ve alt bölümün kenarlarında yumuşakça belirir. Metin çevresinde silikleşir; ortak lila tokenı iki temaya uyum sağlar. Küçük, yerel SVG yalnız dekoratif CSS maskesidir; hareket veya ek bağımlılık içermez.
- Tasarım varyansı 6, hareket yoğunluğu 3, içerik yoğunluğu 2. İki satırlı ana mesaj ve tek izometrik sahne; uzun özellik ızgaraları yok.
- Aşamalar kısa açıklamalı üç sekme ile ortak bir çerçevede değişir. Yön tuşları, Home/End, doğru tab-panel bağlantıları ve azaltılmış hareket desteklenir.
- Dört sık sorulan soru yerel details/summary ile açılır. İlk yanıt açık gelir, tek seferde bir soru açık kalır. Kapanışta ilk adım sunum yüklemek olarak açıklanır; footer temel gezinme bağlantıları sunar.
- Dört şeffaf görsel yerleşik imagegen ile üretildi. Açılış görseli yalnız üst bölümde kullanılır; kavisli kâğıt zeminin sunum sayfasına dönüştüğü bir öğrenme alanında eğitmen ve üç katılımcıyı gösterir. Tam promptlar [LANDING_GORSELLERI.md](LANDING_GORSELLERI.md) içinde. PNG kaynakları Codex görsel dizininde korunur, uygulama `public/landing` altındaki WebP sürümlerini kullanır. Toplam sıkıştırılmış kaynak boyutu yaklaşık 564 KB.

## Yollar ve oturum

- `/`: sunucuda mevcut oturum kontrol edilir; ziyaretçi tanıtımı, oturum açmış kullanıcı çalışma alanını görür.
- `/kesfet`: mevcut oturumdan bağımsız tanıtım önizlemesi.
- `/giris`: giriş; `/giris?mod=kayit`: kayıt. Mevcut Auth bileşeni ve aynı API kullanılır. Giriş/kayıt tamamlanınca sunucu oturumunu okuyacak tam gezinme yapılır.
- `/katil`: mevcut katılımcı yolu korunur.
- `/giris/loading.tsx`: form düzenine uygun iskelet.

## Doğrulama

Tarayıcıda açık/koyu tema, Türkçe/İngilizce, 320/390 px mobil, 768/1024 px tablet ve 1470 px masaüstü ölçüleri; sekmelerde klavye gezinmesi, mobil menü, soru açma ve giriş/kayıt geçişleri kontrol edildi. Yatay taşma yok. Açık temada ana düğme kontrastı 4,60:1, açıklama metni kontrastı 5,73:1. Azaltılmış hareket altında sekme ve soru geçişleri 0 saniye. `npm run test:landing` anonim ve oturumlu yol davranışını gerçek yerel sunucuda doğrular, test hesaplarını temizler. Build, 14 alan testi, 2 bekleme listesi/dil testi ve 1 tanıtım yolu testi geçti.

Lighthouse bu ortamda kurulu bir araç olarak bulunmadığından skor üretilmedi. Görsellerin alanları önceden ayrılır, ilk görsel yüksek öncelikle yüklenir, diğerleri tembel yüklenir; ek animasyon bağımlılığı yoktur. Performans değerlendirmesi yerel geliştirme sunucusuna aittir, üretim Lighthouse ölçümü değildir.
