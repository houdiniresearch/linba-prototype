# Arkadaşa yayınlama notları

Güncel çalışma kopyasının üretim derlemesi ve son önbellek düzenlemelerine ait 9 odaklı kontrol geçti. Bu, Vercel'de canlı doğrulama yapıldığı anlamına gelmez. Yayın için bu belgeyi içeren güncel `main` commitini kullan.

Bu değişiklik **PPTX dönüştürmeyi** uygulamayla birlikte paketler. Vercel erişimi geliştiricide olmak zorunda değildir. Yayını yapan arkadaşın kendi Vercel hesabından bu depoyu kullanır. Bilgisayarında Docker kurması gerekmez; Vercel `Dockerfile.vercel` dosyasını bulup Linux imajını kendi oluşturur.

## Yayınlama

1. Güncel dosyaların tamamını depoya aktar. `Dockerfile.vercel`, `.dockerignore`, `next.config.ts` ve `lib/pptx-document.ts` mutlaka dahil olsun. `.env.local`, `.linba`, yedekler veya anahtarları Git'e gönderme.
2. Vercel'de depoyu import et. [Container Runtime](https://vercel.com/docs/functions/runtimes/container) kullanılmalı; sıradan Next.js fonksiyon paketi LibreOffice içermez. Vercel `Dockerfile.vercel` dosyasını otomatik algılar ve trafiği container'a yönlendirir. Mevcut proje eski Next.js ayarına sabitlenmişse container algılamasını doğrula.
3. Vercel **Settings → Functions → Function Regions** bölümünde uygulamayı Supabase'in bulunduğu **Singapur** bölgesinde çalıştır. Bölge henüz bir `vercel.json` dosyasıyla sabitlenmiş değil; yayınlayan kişi ayarı kontrol etmeli. [Bölge ayarı belgesi](https://vercel.com/docs/functions/configuring-functions/region).
4. Aşağıdaki ortam değişkenlerini Vercel'in sunucu ortamına ekle. Gerçek değerler sahibinin ayrıca ileteceği `.env.vercel` dosyasında bulunur; dosyayı Vercel ortam değişkenlerine aktar. Bu dosya Git dışında tutulur; anahtarları ekran görüntüsüne veya bu belgeye koyma.

| Değişken                 | Değer                                      |
| ------------------------ | ------------------------------------------ |
| `PORT`                   | `3000`                                     |
| `LINBA_DATABASE`         | `supabase`                                 |
| `LINBA_HTTPS`            | `true`                                     |
| `SUPABASE_URL`           | `https://wrkdfhbytobjwedcdczo.supabase.co` |
| `SUPABASE_SECRET_KEY`    | Mevcut projenin sunucu anahtarı            |
| `OPENAI_API_KEY`         | Mevcut OpenAI proje anahtarı               |
| `OPENAI_TEXT_MODEL`      | `gpt-5.4-mini-2026-03-17`                  |
| `OPENAI_VOICE_MODEL`     | `gpt-realtime-2.1`                         |
| `OPENAI_SPEECH_MODEL`    | `gpt-realtime-2.1-mini`                    |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small`                   |

`LINBA_CONTAINER=true` imaj içinde ayarlanır. `LINBA_SOFFICE_BINARY` normalde gerekmez; LibreOffice imaja kurulur. Model/key alanlarını `NEXT_PUBLIC_` ile tanımlama. Build sırasında gerçek Supabase/OpenAI anahtarları gerekmez; Docker build context ortam dosyalarını dışarıda tutar.

5. Önce bir preview yayınla. Deneyim hesabında PDF ve PPTX yükle: slaytların açılmasını, kaynak metni ve indeksleme tamamlandıktan sonra bir kaynaklı yanıtı kontrol et. Örnek sunum geçişini, ekip oluşturup başka sayfaya dönünce ekip bilgisinin korunmasını ve mikrofonlu provayı da kısa şekilde kontrol et. Ardından mevcut domain/yayın sürecini uygula.

## Nasıl çalışıyor?

Node 24 + Debian + LibreOffice Impress ve Arial/Calibri/Cambria için uyumlu fontlar aynı pakette bulunur. PPTX, kullanıcıya özgü geçici Office profiliyle PDF'ye dönüştürülür; PDF ve PNG slaytlar mevcut Node işleyicisinden geçer. Hem orijinal PPTX hem PDF ve slaytlar private Supabase Storage'a yazılır. Metinler mevcut embedding/pgvector akışına girer. Dönüştürme 80 saniyeyle sınırlıdır; geçici profiller işlem sonunda temizlenir. Python, Poppler komutu, ek dönüştürme servisi hesabı veya yeni API anahtarı gerekmez.

PPTX animasyonları/video oynatımı PDF'ye aktarılmaz; slaytların statik görünümü kullanılır. Özel fontların birebir görünümü için fontun çalışma ortamında bulunması gerekir.

## Doğrulama durumu

İlk Linux container imajı yerelde başarıyla derlendi ve test sunucusu başlatıldı. Sonrasında yerel gerçek dönüştürme kontrolünde platforma özgü zorlanmış görüntüleme ayarı kaldırıldı; iki örnek PPTX eş zamanlı dönüştürüldü ve her birinin 8 slaytı, Türkçe kaynak metni, PDF/PNG çıktısı ve geçici profil temizliği doğrulandı. TypeScript kontrolü geçti. Son düzeltmeyi içeren Linux imajının yeniden derlenmesi ve gerçek yükleme kontrolü hâlâ gereklidir. Otomatik onay sisteminin kullanım sınırı nedeniyle container içindeki son gerçek yükleme/dönüştürme ve Supabase indeksleme kontrolü henüz tamamlanmadı; Vercel'e dağıtım da yapılmadı. Bu adımları tamamlamadan canlı doğrulama yapılmış sayma.

Yerel test imajı için `docker build -f Dockerfile.vercel -t linba-pptx-qa:local .`; çalışma zamanı ortam değişkenlerini yalnız `docker run --env-file .env.local` ile geçir. Yeni PPTX yükleme entegrasyonu `LINBA_TEST_UPLOAD_FORMAT=pptx LINBA_TEST_VERIFY_INDEX=1 LINBA_TEST_URL=http://127.0.0.1:3003 npm run test:supabase:upload` ile çalıştırılabilir. Bu opt-in kontrol yalnız örnek sunumu indeksler; metin veya ses modeli çağırmaz ve kendi test kayıtlarını temizler.
