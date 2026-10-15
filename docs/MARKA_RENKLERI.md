# LİNBA renk kimliği

15 Ekim 2026'da kullanıcı tarafından onaylandı. Beyaz ağırlıklı AhaSlides referansının renk dağılımı ürüne uygulanır. Mevcut logonun şekli ve yazısı korunur.

| Rol               | HEX     | Kullanım                                         |
| ----------------- | ------- | ------------------------------------------------ |
| Ana yüzey         | #FFFFFF | Üst çubuk, sidebar, içerik                       |
| Çalışma yüzeyi    | #F8F8FA | Düzenleyici sahnesi ve yardımcı alanlar          |
| Mürekkep          | #23232F | Başlık, gövde ve logo yazısı                     |
| İkincil metin     | #656573 | Açıklamalar ve yer tutucular                     |
| Ayırıcı           | #E7E7EC | Tablo satırları ve yapısal çizgiler              |
| Marka lila        | #B28AE1 | Logonun ilk parçası, hafif marka detayları       |
| Açık lila         | #F3EEF9 | Avatar, prova ve yardımcı yüzeyler               |
| Lila metin        | #634085 | Açık lila üzerinde okunaklı metin                |
| Marka fuşya       | #E90072 | Logonun ikinci parçası ve i noktası              |
| Etkileşim fuşyası | #C50060 | Bağlantı, seçili ikon ve odak çizgisi            |
| Fuşya hover       | #AB0055 | Metin etkileşimlerinin koyu tonu                 |
| Açık pembe        | #FDF0F7 | Seçili gezinme ve seçenekler                     |
| Eylem mint        | #42E8C7 | Eğitimi başlat, Canlı eğitime dön, Planı yükselt |
| Mint hover        | #30D7B6 | Mint eylemlerin üzerine gelme hali               |
| Mint üzeri yazı   | #123C34 | Mint butonun yazı ve ikonları                    |

CSS tanımları OKLCH biçimindedir; yukarıdaki HEX değerlerinin yuvarlanmış karşılıklarıdır. Başarı, hata ve uyarı renkleri marka vurgularından ayrı durum anlamlarını taşır. Logo haricinde tüm kontroller aynı semantik renk değişkenlerini kullanır.

Kontrol edilen metin kontrastları: ikincil metin/beyaz 5,73:1; etkileşim fuşyası/açık pembe 5,36:1; koyu yazı/mint 7,90:1; beyaz yazı/ana eylem fuşyası 4,60:1. Parlak marka fuşyası küçük metinde beyaz üzerine kullanılmaz. Kullanıcı tercihiyle dolgulu butonlarda görünür çerçeve kullanılmaz; hover dolgu değişimi ve klavye odak çizgisi korunur.

Ana eylemler (oluştur, kaydet, gönder): #E50070 fuşya zemin, #FFFFFF yazı; hover #CC0064. Eğitimi başlat, Canlı eğitime dön ve Planı yükselt: #42E8C7 mint zemin, #123C34 yazı. Raporu aç ve tamamlanan eğitim etiketleri açık lila/koyu lila; sonuç çubukları açık pembe zemin üzerinde fuşyadır. Bu dağılım 15 Ekim 2026 tarihli son kullanıcı kararıdır.

## Logo dosyaları

- `public/brand/linba-logo.webp`: önceki logonun korunmuş kaynak silüeti.
- `public/brand/linba-logo-color.svg`: aynı alfa maskesini kullanan renkli logo. Bu SVG'nin içinde mevcut raster alfa maskesi bulunur; yeni bir vektör çizim değildir.
- `app/icon.svg`: aynı sembolden sekme simgesi.
- `scripts/build-brand-assets.mjs`: alfa maskesine renk katmanlarını uygular. `node scripts/build-brand-assets.mjs` ile yeniden üretilebilir. Kaynağa karşı alfa karşılaştırması şeklin değişmediğini doğrular; ilk kontrolde piksel başına fark 0/255'tir.

Renk taslağı: `output/imagegen/brand-palettes/05-lila-fusya-mint-rapor.png`. Taslaktaki rapor verileri temsiliydi; gerçek ürün kendi eğitim kayıtlarını gösterir.
