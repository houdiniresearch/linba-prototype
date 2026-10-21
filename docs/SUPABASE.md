# Supabase altyapısı — 21 Ekim 2026

Proje: `Linba_V2` (`wrkdfhbytobjwedcdczo`), CLI hesabı `houdinidev7@gmail.com`.

## Kalıcı veriler ve erişim

`LINBA_DATABASE=supabase` uygulama deposunu Postgres'e geçirir. Kullanıcılar, mevcut parola hash'leri, oturumlar, ekipler, klasörler, sunumlar, katılımcılar, sorular, yanıtlar ve raporlar `linba_records` tablosunda saklanır. Bu sürüm Supabase Auth'a ayrı bir kullanıcı göçü yapmaz; mevcut HttpOnly ana/katılımcı oturumları ve Next.js erişim denetimleri korunur.

Tablolarda RLS açıktır; anon/authenticated rollere doğrudan erişim verilmez. Sunucu anahtarı yalnız sunucudadır. `linba_mutate_records` birden fazla kaydı atomik günceller; sürüm denetimi eski bir sekmenin yeni değişiklikleri ezmesini ve silinmiş kaydı geri oluşturmasını engeller. Okuma önbelleği yalnız tek API isteği içinde, en fazla bir saniye yaşar.

Orijinaller ve slayt görselleri private `linba-presentations` Storage alanındadır. Tarayıcı görselleri yetki denetimli Next.js rotasından alır; Storage alanı herkese açık değildir. Projeksiyon bağlantıları mevcut sınırlı görüntüleme anahtarını kullanır.

## Yeni sunum işleme

1. `POST /api/uploads` sunucu tarafından doğrulanan dosya adı/boyutu için kişiye bağlı yükleme kaydı ve imzalı Storage URL'si oluşturur.
2. Tarayıcı dosyayı doğrudan private Storage'a yollar. Böylece 30 MB dosya Next.js/Vercel istek gövdesine konmaz.
3. `POST /api/courses` yalnız yükleme kimliğini ve form ayarlarını alır. Sahiplik, süre, gerçek boyut ve dosya imzası denetlenir. Tekrar gönderim aynı sunumu döndürür.
4. PDF'nin metni ve 1600 px slayt görselleri Node.js içinde `pdfjs-dist`/`@napi-rs/canvas` ile oluşturulur. Orijinal ve görseller Storage'a yazıldıktan sonra sunum yayımlanır.
5. Metin slayt numarası korunarak 2400 karakterlik, 240 karakter örtüşmeli parçalara ayrılır. OpenAI `text-embedding-3-small` ile 1536 boyutlu vektörler oluşturulur. Metin ve vektörler `linba_document_chunks` tablosuna birlikte yayımlanır.

`linba_documents` içerik hash'i, model, ayrıştırıcı sürümü, üretim kimliği, durum, deneme sayısı ve kontrollü hata kodu tutar. Aynı metnin kopyalarında mevcut vektörler yeniden kullanılır. Eski bir iş yeni üretimin üzerine yazamaz. Yarım kalan işler sunum yeniden açıldığında kurtarılır; otomatik deneme sayısı sınırlıdır. Yetkili kullanıcı `POST /api/courses/:id/index` ile yeniden deneyebilir. Ayrı sürekli kuyruk işçisi henüz yoktur; işler Next.js `after` ile çalışır.

Arama, SQL içinde önce sunum ve güncel içerik hash'ine göre sınırlandırılır; ardından pgvector benzerliği ile anahtar sözcük sonuçları RRF ile birleştirilir. Öğrenme ajanı kaynak alıntılarını ve bağımsız kanıt kontrolünü korur. Görüntüden oluşan metinsiz PDF'ler için OCR henüz bağlı değildir.

## Ortam ve Vercel

Sunucuda gerekenler: `LINBA_DATABASE=supabase`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, mevcut `OPENAI_API_KEY` ve `.env.example` içindeki model ayarları. Anahtarları `NEXT_PUBLIC_` ile yayımlama. HTTPS dağıtımında `LINBA_HTTPS=true` kullan. Node 24 veya uyumlu daha yeni bir çalışma zamanı gerekir. Supabase modunda yerel disk yalnız `/tmp/linba` geçici işlem alanıdır. Vercel'de açık Supabase yapılandırması yoksa uygulama geçici SQLite'a sessizce düşmez.

PDF yolu Python/Poppler/LibreOffice gerektirmez. PPTX yolu artık Python/Poppler yerine doğrudan LibreOffice Impress ile PDF oluşturup aynı Node PDF işleyicisine bağlanır. `Dockerfile.vercel`, LibreOffice ve gerekli fontları uygulamayla birlikte paketler. Vercel yayını container runtime ile yapılmalıdır; sıradan Next.js fonksiyon paketinde LibreOffice bulunmaz. Yayını başka bir hesap sahibi yapabilir; gerekli adımlar ve henüz tamamlanmayan doğrulama açıkça [VERCEL_HANDOFF.md](VERCEL_HANDOFF.md) içinde kayıtlıdır.

## Geçiş ve doğrulama

`npm run migrate:supabase -- --apply` önce online SQLite yedeği alır, kaynak görsellerini doğrular, mevcut farklı hedef kaydını ezmeden aktarır, private dosyaları kopyalar ve indeksler. `--skip-assets` daha önce aktarılmış sunumların dosyalarını atlar; yeni sunumları yine kopyalar. Özet `.linba/supabase-migration.json`, yedekler `.linba/backups` içindedir ve Git'e dahil edilmez. Sağlayıcı değişimi ancak tüm indeksler hazır ve kaynak parmak izi aynıysa yapılır. Geçişten sonra SQLite yedeğine dönmek buluta sonradan yazılan verileri içermez; körlemesine geri dönme.

- `npm run typecheck` ve `npm run build`
- `npm run test:document-index`: parça kapsamı, kaynak numaraları ve embedding biçimi; ücretli API çağrısı yok.
- `npm run test:supabase`: gerçek hedefte sentetik kayıtlarla atomiklik, sürüm çakışması, özel dosyalar, üretim yarışı ve sunumlar arası arama izolasyonu; sonunda kendi kayıtlarını temizler.
- `LINBA_TEST_URL=http://127.0.0.1:3002 npm run test:supabase:upload`: üretim derlemesi, doğrudan yükleme, PDF metni/görselleri, sahiplik ve tekrar gönderim. Test sunucusunu `OPENAI_API_KEY=''` ile başlat; bu test ücretli AI çağrısı yapmaz.
- `npm run test:participant-join:integration`: aynı Supabase ortamını kullanan çalışan API üzerinde katılımcı oturumları ve özel geçmiş. Dosyalar ve test kayıtları temizlenir.

Son doğrulama: aktif sağlayıcı Supabase'e çevrildi. Üretim derlemesi ve 111 çevrimdışı test geçti. Gerçek private PDF yüklemesi, orijinal/slayt kalıcılığı, yeniden gönderim, otomatik hazır pgvector indeksi, iki kaynaklı öğrenme yanıtı, özel selamlaşma/kapsam dışı yanıtlar ve eğitmen analitiğinden ayrılmaları çalışan API üzerinde doğrulandı. Katılımcı oturum/erişim entegrasyonu ve Supabase atomiklik/izolasyon kontrolleri de geçti. Geçici test kullanıcıları, sunumları ve dosyaları temizlendi. Vercel dağıtımı yapılmadı.
