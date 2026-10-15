# LİNBA tanıtım sayfası

## Kararlar

- Marka korundu: özgün logo, Inter, fuşya eylemler ve lila/mint ayrıntılar.
- Tasarım varyansı 6, hareket yoğunluğu 3, içerik yoğunluğu 2. İki satırlı ana mesaj ve tek izometrik sahne; uzun özellik ızgaraları yok.
- Aşamalar tek sekmeli alanda değişir. Yön tuşları, Home/End, doğru tab-panel bağlantıları ve azaltılmış hareket desteklenir.
- Dört sık sorulan soru yerel details/summary ile açılır.
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
