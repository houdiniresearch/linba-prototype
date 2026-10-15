# LİNBA

## Register

product

## Users

İki hesap tipi: eğitmen ve katılımcı. Eğitmen sunumunu hazırlar, prova eder ve canlı oturumu yönetir. Katılımcının kişisel RAG sohbeti ve ayrı Aktiviteler alanı vardır.

## Product Purpose

Sunum merkezli platform. Kullanıcının 13 Ekim 2026 konuşmasındaki kararları önceki ürün taslağının yerine geçer.

## Confirmed Workflow

- Sidebar: Ana sayfa, Eğitimlerim, Raporlar; altta Ayarlar ve hesap. Ana sayfada AI oluşturma kutusu yok.
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

15 Ekim 2026'da onaylanan AhaSlides referanslı yaklaşım: beyaz sidebar/üst çubuk, açık gri çalışma alanı, fuşya ana eylemler ve beyaz yazı, mint plan yükseltme butonları ve koyu yazı, açık pembe seçimler ve fuşya vurgular, lila hafif yüzeyler, okunaklı sans ve hafif yuvarlatılmış kontroller. Sitede kullanılan özgün katlanmış sayfa sembolü ve linba yazısının geometrisi korunur; yalnız renkleri lila–fuşya ve koyu mürekkebe uyarlanır. Alternatif logo sembolleri uygulanmaz. Renk rolleri DESIGN.md ve docs/MARKA_RENKLERI.md'de kayıtlıdır.

## Design Principles

- Sunum bütün akışların ortak bağlamıdır.
- Eğitmen, sunum ve katılımcı görünümünü ayır.
- Kişisel sohbeti diğer katılımcılara açma.
- Kaynak ve hocaya iletim durumlarını görünür tut.
- Gerçek kayıtlarla raporla, bağlantı durumunu doğru göster.

## Accessibility & Inclusion

Türkçe/İngilizce arayüz; görünür odak; klavye/dokunma; azaltılmış hareket; sürüklemeye alternatif taşıma düğmeleri. Katılımcı mobil, eğitmen masaüstü. Dil seçimi sağ üstte, tercih çerezle korunur; eğitim içerikleri çevrilmez.

## Header & Account

Sağ üst sıra: dil seçimi, mint Planı yükselt butonu (İngilizce: Upgrade), bildirim simgesi ve profil avatarı. Profil menüsü ad/e-posta, ücretsiz plan etiketi, Upgrade alanı, hesap ayarları, plan/bekleme listesi ve çıkış içerir. Var olmayan faturalama veya ekip yönetimi ekranları eklenmez. Upgrade bekleme listesi kaydını açar; kayıt hesaba bağlı ve SQLite'da kalıcıdır, tekrar gönderimde güncellenir. Bildirim listesi kullanıcıya ait tamamlanan eğitim raporlarından türetilir. Otomatik e-posta gönderimi henüz bağlı değildir.

## Project

Mevcut Next.js/TypeScript yerel projeyi kullan. SQLite ve yerel dosyalar. GitHub özel: https://github.com/houdiniresearch/linba-prototype.
