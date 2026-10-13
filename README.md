# LİNBA prototipi

Sıfırdan geliştirilen Türkçe eğitim platformu prototipi. Mevcut eski prototip ayrı yedek olarak tutulur. Yeni prototipin yapay zekâ katmanı tek model kullanacak şekilde planlanır.

## Bu sürüm

İlk teslimat eğitmen ve katılımcı ekranlarının etkileşimli UX taslağıdır. Eğitmen ekranı hazırlık, canlı soru yönetimi ve rapor alanlarını içerir. Örnek sorular, gruplar ve yanıtlar gösterim verisidir. Yeni soru gönderme ve eğitmenin yanıt paylaşması aynı tarayıcıdaki sekmeler arasında senkronize edilir; farklı cihazlar arasında sunucu bağlantısı bu sürümde yoktur. Canlı model bağlantısı, gerçek doküman indeksleme ve üretim hesap sistemi bu aşamada hazır değildir.

## Yerel geliştirme

```sh
npm install
npm run dev
```

Tarayıcı: `http://localhost:3000`. Kontroller: `npm run typecheck`, `npm run build`.

## Belgeler

- `PRODUCT.md`: ürün ve tasarım ilkeleri.
- `DESIGN.md`: ikinci tasarım keşfinin görsel ilkeleri.
- `docs/GITHUB_REHBERI.md`: proje üzerinden temel GitHub akışı.

Kaynak belge incelemesi ve açık kararlar, geliştirme klasöründeki yerel araştırma notlarıdır.

API anahtarları ve kişisel erişim bilgileri repoya eklenmez; yerel ortam dosyalarında saklanır. Ürün bilgi notları ticari varsayımlar içerdiğinden başlangıç deposu özeldir.
