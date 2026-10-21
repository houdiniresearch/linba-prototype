# LİNBA

## Register

product

## Users

İki hesap tipi: eğitmen ve katılımcı. Eğitmen sunumunu hazırlar, prova eder ve canlı oturumu yönetir. Katılımcı hesapla giriş yapabilir veya isim yazarak hesap açmadan katılabilir. QR ve kod içeren bağlantılardan gelenlerden kod istenmez; doğrudan katılım ekranına gelenler sunum kodunu da girer. Katılımcının kişisel RAG sohbeti ve ayrı Aktiviteler alanı vardır.

## Product Purpose

Sunum merkezli platform. Kullanıcının 13 Ekim 2026 konuşmasındaki kararları önceki ürün taslağının yerine geçer.

## Confirmed Workflow

- Sidebar: Ana sayfa, Eğitimlerim, Raporlar; altta entegrasyonlar, Ayarlar, Çöp kutusu ve Yardım. Ana sayfada AI oluşturma kutusu yok.
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
- AI görevleri ayrıdır: sesli prova konuşması Realtime 2.1, replik seslendirme Realtime 2.1 Mini; soru yanıtlama, persona, gruplama, aktivite ve raporlar şemalı Responses API üzerinden sürümü sabitlenmiş metin modeliyle çalışır. Ortak kanıt denetimi, süre/tekrar sınırları ve içerik içermeyen işlem kayıtları vardır. Ayrıntı: docs/AI_QUALITY.md.

## Brand Personality

15 Ekim 2026'da onaylanan AhaSlides referanslı yaklaşım: beyaz sidebar/üst çubuk, açık gri çalışma alanı, fuşya ana eylemler ve beyaz yazı, mint eğitim başlatma/canlı eğitime dönme ve plan yükseltme butonları ve koyu yazı, açık lila rapor butonu ve fuşya sonuç çubukları, açık pembe seçimler ve fuşya vurgular, lila hafif yüzeyler, okunaklı sans ve hafif yuvarlatılmış kontroller. Sitede kullanılan özgün katlanmış sayfa sembolü ve linba yazısının geometrisi korunur; yalnız renkleri lila–fuşya ve koyu mürekkebe uyarlanır. Alternatif logo sembolleri uygulanmaz. Renk rolleri DESIGN.md ve docs/MARKA_RENKLERI.md'de kayıtlıdır.

## Design Principles

- Sunum bütün akışların ortak bağlamıdır.
- Eğitmen, sunum ve katılımcı görünümünü ayır.
- Kişisel sohbeti diğer katılımcılara açma.
- Kaynak ve hocaya iletim durumlarını görünür tut.
- Gerçek kayıtlarla raporla, bağlantı durumunu doğru göster.

## Accessibility & Inclusion

Türkçe/İngilizce arayüz; görünür odak; klavye/dokunma; azaltılmış hareket; sürüklemeye alternatif taşıma düğmeleri. Katılımcı mobil, eğitmen masaüstü. Dil seçimi sağ üstte, tercih çerezle korunur; eğitim içerikleri çevrilmez.

## Header & Account

Sağ üst sıra: dil seçimi, açık mint Erken erişim butonu, bildirim simgesi ve aşağı oklu 40 px profil avatarı. Profil menüsü ad/e-posta, Erken erişim etiketi, Upgrade alanı, hesap ayarları, plan/bekleme listesi ve çıkış içerir. Hesap ayarları; profil, güvenlik, fatura ve ödeme, genel tercihler bölümlerini içeren bir penceredir. Fatura alanı mevcut Erken erişim planını ve gerçek fatura bulunmadığını gösterir; ödeme servisi bağlı değildir. Upgrade bekleme listesi kaydını açar; kayıt hesaba bağlı ve Supabase Postgres içinde kalıcıdır, tekrar gönderimde güncellenir. Bildirim listesi kullanıcıya ait tamamlanan eğitim raporlarından türetilir. Otomatik e-posta gönderimi henüz bağlı değildir.

## Project

Mevcut Next.js/TypeScript yerel projeyi kullan. Supabase Postgres, private Storage ve pgvector. Mimari ve dağıtım gereksinimleri: docs/SUPABASE.md. SQLite yalnız izole yerel testler ve geçiş yedeği için korunur. GitHub özel: https://github.com/houdiniresearch/linba-prototype.

## Görünüm tercihi

Ürün genelinde Açık / Koyu / Sistem temaları desteklenir. Eğitmen çalışma alanı ve rapor ajanının üst çubuğunda görünüm menüsü vardır; Ayarlar → Genel tercihler içinden de değiştirilebilir. Katılımcı ve giriş ekranlarındaki görünüm menüsü korunur. Tercih tarayıcıda bir yıl saklanır, yenilemede korunur ve tüm ekranlara uygulanır. Yüklenen sunum sayfalarının renkleri değişmez.

## Rapor asistanı

Raporlar ve rapor detayından yeni sekmede açılır. Solda yalnız eğitmene ait tamamlanmış eğitim raporları vardır; her rapor ayrı ve kalıcı bir sohbeti temsil eder. Sorular ve aktivite sonuçları üzerinden konuşulur. Ajan ekranındaki Raporu aç düğmesi ve sohbet kaynakları raporu aynı ekranın sağ panelinde açar; sohbet ve taslak korunur. Mobilde panel tam genişlikte açılır. Ortak şemalı metin üretimi ve bağımsız kanıt denetimi kullanılır; başarısız yanıtlar geçmişe kaydedilmez. Başka rapora geçmek o konuşmayı açar; raporlar arası kıyaslama yoktur. Detay ve testler docs/RAPOR_ASISTANI.md'dedir.

## Yükleme deneyimi

Sayfa ve veri bekleme durumlarında gerçek ekranın düzenini izleyen iskeletler gösterilir; veri geldiğinde içerikle yer değiştirir. Eğitim/rapor listeleri sonuç gelmeden boş sayılmaz. Oturum doğrulanmadan eğitim listesi istenmez. Arka plandaki veri yenilemeleri mevcut içeriği korur. Sunum görselleri yüklenirken oranları ayrılır; hata varsa sonsuz iskelet yerine hata durumu görünür. Açık/koyu tema ve azaltılmış hareket tercihi desteklenir.

## Tanıtım sayfası

Eğitim akışının altında PowerPoint, Microsoft Teams, Google Slides, Zoom ve ChatGPT planlanan entegrasyonlar olarak sunulur. Entegrasyonlar ayrı açılır menüde listelenir. Bekleme listesi düğmesi doğrudan genel LİNBA kayıt penceresini açar; hesap gerekmez ve kayıtlar entegrasyona göre ayrılmaz. Entegrasyonlardan gelen kayıtlar da aynı genel listeye yazılır. Gerçek entegrasyon bağlantısı kurulmaz; Supabase içinde e-posta başına tek kayıt saklanır.

Oturum açmamış kullanıcı `/` adresinde izometrik görsellerle ürün akışını anlatan landing page görür; oturum açmış kullanıcı aynı adreste çalışma alanına girer. `/explore` tanıtıma her zaman erişim sağlar. Açılış öncesi karşılama ve bekleme listesi `/login`, beta hesabı girişi `/login?mode=signin` adresindedir. Var olan hesabın oturumu varsa giriş adresleri çalışma alanına döner. Katılımcı bağlantısı `/join` adresindedir. Eski Türkçe yollar ve parametreler İngilizce karşılıklarına yönlenir. Görünüm ve TR/EN dil seçimi ortak tercihlerle çalışır.

Tanıtımda “Senin eğitimine göre” bölümü kurumsal eğitmen, öğretim görevlisi, bağımsız eğitimci ve eğitim kurumları için dört seçilebilir kullanım senaryosu sunar. Örnekler sırasıyla prova, açık uçlu yazılı yanıtların yapay zekâ analizini, eğitim sonrası kaynaklı sohbeti ve kurumun rapor asistanıyla öğrencilerin zorlandığı konuları incelemesini kodla çizilmiş kısa animasyonlarla gösterir. Bu tanıtım sahneleri temsili içeriktir; mevcut confusion-spike ve katılım/değerlendirme grafikleri korunur, görünür geliştirme önizlemesi etiketi eklenmez.

## Ürün ana sayfasında keşif alanı

Eğitmen ana sayfasında son eğitimlerin sağında LİNBA'ya ait üç görselli yenilik gösterilir: pratik ajanı, aktiviteler ve sohbetin yanındaki rapor paneli. İçerik altı saniyede bir döner; nokta düğmeleriyle doğrudan seçilebilir. Ok, sayısal sayaç, sahte yayın tarihi veya değerlendirme puanı yoktur. Odak, hover, gizli sekme, açık keşif pencereleri ve azaltılmış hareket otomatik dönüşü durdurur. Tümünü gör aynı yenilikleri ayrıntılarıyla açar. Tek taslak varsa çalışma alanı/pratik düğmesi onu açar; birden fazla taslak varsa eğitim seçme penceresi açılır. Taslak yoksa eğitim oluşturma formu açılır ve istenen editör/pratik hedefi korunur. Raporlar düğmesi gerçek rapor listesine gider. Sosyal düğmeler mevcut tanıtım sayfasındaki gibi şimdilik devre dışıdır. Görüşünü paylaş formu kategori ve en fazla 2.000 karakterlik metni hesapla ilişkilendirerek Supabase feedback kayıtlarına kaydeder; e-posta veya dış servis gönderimi yapmaz.

## Training library and account settings — 19 October 2026

See [WORKSPACE_LIBRARY.md](docs/WORKSPACE_LIBRARY.md) for reusable sessions, user-owned training folders, Istanbul calendar filters, recoverable Trash, private slide notes and account settings. Logout is only in the profile menu. Product integration marks moved into the sidebar and open the account waitlist.

## Ongoing UI quality

For future UI/UX work, inspect the existing product first, research relevant patterns in authoritative design-system and usability sources, and verify the actual interaction in the browser. Preserve LİNBA’s established identity. A passing test or build alone does not establish visual quality. Favor clear task hierarchy, progressive disclosure, accessible state and focus behavior, restrained selection colors and responsive layouts over generic decoration.

## Activity drafts and participant sources — 19 October 2026

Activity editing protects unsaved content on dismissal and reviews AI suggestions before replacing existing text. Source citations open a question-specific side panel on desktop and a modal drawer on mobile, preserving the conversation position and composer draft. See [EDITOR_PARTICIPANT_REFINEMENT.md](docs/EDITOR_PARTICIPANT_REFINEMENT.md) for behavior and validation.

## Live training reliability — 19 October 2026

Live instructor, participant and projection surfaces retain the last confirmed state during interrupted updates, with automatic/manual reconnection. Participant answers stay attached to their activities while the page is open; only confirmed submissions enter reports. See [LIVE_EXPERIENCE.md](docs/LIVE_EXPERIENCE.md) for behavior, storage limits and validation.

## Session history and report clarity — 19 October 2026

The library groups each reusable training under one card with an accessible session picker. Reports retain independent session records and expose date/time context in the list, detail and report agent. Browser-tab library filters survive editor round-trips. See [SESSION_REPORT_REFINEMENT.md](docs/SESSION_REPORT_REFINEMENT.md).

## Entry, folders and shared modal quality — 19 October 2026

The accepted landing design is preserved after rolling back its rejected redesign. Product library organisation uses Folder/Klasör in both locales, while existing storage and API identifiers remain compatible. New training keeps the selected folder, validates it on the server and opens the created editor or requested practice room. Multiple drafts require an explicit choice from Home updates. Beta sign-in and participant registration have distinct account context; experience access limitations are stated before entry and before signing out. Modal backdrops use a shared 6 px blur; Settings, creation, feedback and mobile source/report/navigation drawers use the same treatment. Desktop source/report panels remain usable side by side. See [ACTIVATION_QUALITY.md](docs/ACTIVATION_QUALITY.md).

## Access duration and personal greeting — 20 October 2026

New presentation and presentation settings share a themed duration menu: close with the presentation, 1, 3, 7, 14 or 30 days. Existing non-preset durations up to 30 days remain selectable. The API rejects durations above 30 days; legacy records are capped at 30 days for access checks and display. Access still starts when the presentation ends. There is no numeric entry field.

Home greets the viewer using their device's local time: morning 05:00–09:59, Hello / Merhaba 10:00–16:59, evening 17:00–21:59, night 22:00–04:59. The greeting refreshes every minute and on focus/visibility changes. TR and EN are supported; report timestamp timezones remain unchanged. Account surfaces use Early access rather than Free or Experience account. The editor's team avatars are 40 px, with a 28 px invitation ring inside its larger click target.

## Report detail and presentation reuse — 21 October 2026

Report detail uses actual Overview / Questions and answers / Activity results tabs rather than stacking all sections. Summary and learning signals share one overview surface; empty reports show the branded empty state. Evidence links select the owning panel in both the standalone report and Ask Linba's side panel.

A presentation remains reusable after completion. Opening it automatically resumes its working draft (or live use), creating one draft from the latest completed version only when needed. Activity editing, practice and Present are available normally. Completed, Use presentation again and Open report are removed from the presentation workspace. Prior reports keep their original records and remain in Reports. Automatic workspace preparation preserves the presentation's creator and creation date and does not duplicate its library card.

## Live instructor sidebar — 21 October 2026

Live overview gives priority to actual question-concentration alerts and saved activity results. Quiet states remain compact. The results picker defaults to following the presentation; manually chosen activity results remain selected across slide changes. Participant response coverage and poll answer shares are shown separately. Questions retain their topic filter and follow-up actions. The Agents tab is informational only: Learning, Engagement and Assessment descriptions, without agent selection, commands or activity controls.

## Practice and report completion — 21 October 2026

Practice participant information is a single natural paragraph, with no voice settings, approach details or leading fiction labels. Creation copy uses Prova ajanların yaratılıyor. The internal conversation budget is 90 seconds and is not advertised in the UI; completion uses the existing feedback flow.

New activities are Multiple choice, True/false and Open question. Scenario, Roleplay and Devil’s advocate are Coming soon. Existing scenario content remains compatible. Ending a presentation opens its report immediately; AI sections show a persisted preparing state, refresh automatically and offer a retry after failures while recorded data remains available.
