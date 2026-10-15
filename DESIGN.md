---
name: LİNBA — Lila, fuşya ve mint
description: 15 Ekim 2026'da onaylanan beyaz ağırlıklı, lila–fuşya kimliği fuşya ana eylemler ve mint eğitim başlatma ve plan yükseltme.
colors:
  primary: "oklch(0.5943 0.2394 3.26)"
  primary-foreground: "oklch(1 0 0)"
  accent: "oklch(0.531 0.214 3.02)"
  accent-soft: "oklch(0.9673 0.0167 343.61)"
  brand-lilac: "oklch(0.7044 0.1301 304.43)"
  brand-fuchsia: "oklch(0.6021 0.2426 3.28)"
  background: "oklch(1 0 0)"
  workspace: "oklch(0.9797 0.0026 286.35)"
  ink: "oklch(0.2616 0.0223 284.75)"
  muted: "oklch(0.5117 0.022 285.6)"
  border: "oklch(0.9294 0.0067 286.27)"
typography:
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.55
rounded:
  control: "8px"
  panel: "12px"
---

# LİNBA görsel sistem

## Overview

Kullanıcının paylaştığı beş AhaSlides ekranı görsel sözleşmedir. Ana sayfa/raporda beyaz üst çubuk ve sol gezinme; düzenleyicide sol slayt önizlemeleri, geniş açık gri sahne, sağ bağlamsal araçlar. Önceki keşifler geçersiz. LİNBA markası ve Türkçe işlevleri kullanılır.

## Colors

Beyaz ana yüzeyler ve açık gri sahne baskındır. Fuşya ana eylem butonlarında beyaz yazıyla kullanılır; Eğitimi başlat, Canlı eğitime dön ve Planı yükselt butonları mint zemin ve koyu yeşil yazıyla ayrılır. Raporu aç butonu ve tamamlanan eğitim etiketleri açık lila, rapor sonuç çubukları açık pembe üzerinde fuşyadır. Seçimler açık pembe, etkileşimli metin ve odak çizgileri okunaklı koyu fuşyadır. Lila logo, avatarlar ve hafif yardımcı yüzeylerde yer alır. Parlak fuşya logo/marka detayları içindir; küçük metinde daha koyu erişilebilir tonu kullanılır. Durum renkleri mevcut anlamlarını korur. Tam palet ve kullanım rolleri docs/MARKA_RENKLERI.md'dedir.

## Logo

Mevcut katlanmış sayfa sembolü, linba harfleri, boşlukları ve oranları korunur. İlk sembol parçası lila, ikinci parçası ve i noktası fuşya, yazı koyu mürekkeptir. Yeni logo alternatifleri bu kararla uygulanmaz. Ortak Logo bileşeni tüm ürün yüzeylerine aynı dosyayı taşır. Sekme simgesinde aynı özgün sembol kullanılır.

## Typography

Referanstaki okunaklı sans; yerel Inter. Gövde/form 16 px, ikincil 13–14 px, başlık 24–28 px. Türkçe karakter ve uzun metin.

## Elevation

İnce sınırlar, hafif köşeler. Gölge yalnız menü/diyalogda. Koyu sidebar ve dekoratif gradient yok.

## Components

Mevcut Phosphor ikon ailesi ve Radix. Aktif slayt fuşya odak çizgisi ve açık pembe seçimle, sahne gerçek sunum görüntüsüyle gösterilir. Kayıt, yükleme, hata, süre sonu, AI bağlantısı ve sesli prova durumları açık.

## Do's and Don'ts

- Ana sayfaya AI oluşturma kutusu ekleme.
- Materyal/provayı ayrı ana menü yapma.
- Kaynaksız yanıtı hocaya ilet; sahte ölçüm gösterme.
- Sunum ekranına özel soru/sohbet koyma.
- Mikrofonu kullanıcı başlatsın; oturum kapanınca durdur.

## Tema

Açık, Koyu ve Sistem seçenekleri ortak görünüm menüsündedir. İlk tercih Sistem'dir; kullanıcı seçimi bir yıl süreli linba_theme çerezinde saklanır ve sunucu ilk HTML'ye uygular. Sistem seçimi işletim sistemindeki değişiklikleri CSS color-scheme ile anında izler; tema için sayfa yüklenirken JavaScript beklenmez. Koyu temada nötr yüzeyler hafif lila tonlu kömür, ana metin kırık beyaz, yardımcı metin açık gridir. Fuşya ve mint dolgulu eylemler aynı kalır; etkileşimli metinler koyu zeminde daha açık ton kullanır. Sunum görselleri dönüştürülmez. Logonun yalnız yazısı koyu temada açılır; özgün sembol, fuşya nokta ve geometri korunur.

## Rapor sohbet alanı

AhaSlides rapor asistanı referansı: bağımsız yeni sekme, solda rapor listesi, üstte seçili eğitim, ortada sade konuşma ve altta sabit mesaj alanı. Boş durumda kısa karşılama ve dört gerçek soru önerisi. Yeni sohbet düğmesi yerine raporlar seçilir; seçili rapor açık pembe vurgulanır. Asistan yanıtları geniş metin alanında, eğitmen mesajları sağa hizalı nötr yüzeyde yer alır. Kaynaklar açık lila bağlantılardır. Tema tokenları ve özgün logo kullanılır. Mobilde sol liste menüye dönüşür.

## Yükleme durumları

İlk sayfa/veri yüklemesinde içerik düzenine uygun gri iskeletler kullanılır: eğitmen paneli, eğitim kartları, rapor tablosu ve detayı, düzenleyici, prova, önizleme, yansıtma, katılımcı ve rapor sohbeti. Ortak bileşenler components/skeletons.tsx içindedir; Next loading.tsx sınırları ile istemci veri bekleme durumları aynı bileşenleri kullanır. Sonuç boş olduğu doğrulanmadan boş durum gösterilmez. Arka plan yenilemesi mevcut içeriği kaldırmaz. Görsellerin oranı yüklenmeden ayrılır; görsel gelene kadar kendi yerinde iskelet görünür.

İskeletler sahte veri veya tıklanabilir sahte kontrol içermez. Ekran okuyucu için tek yüklenme durumu duyurulur, dekoratif parçalar gizlenir. Hareket tercihi azaltıldığında animasyon kapalıdır. Yapay bekleme süresi yoktur. Veri hatasında iskelet durur, hata ve yeniden deneme gösterilir. Sunum işleme, eğitimi bitirme ve model yanıtı üretme gibi işlemlerde açıklayıcı durum mesajları korunur.

## Tanıtım sayfası

Üst çubuk kaydırmada sabittir; kullanıcının isteğiyle yarı saydam, arkasını bulanıklaştıran cam yüzey kullanılır. Logo ve gezinme solda, dil ve giriş sağdadır. Bu yüzeyde görünüm menüsü yoktur. Bölüm bağlantıları yumuşak kayar, azaltılmış harekette anlık gider; başlıklar sabit çubuğun altında kalmaz. İlk ekranda sade bir katılım kodu formu bulunur; mint Katıl düğmesi fuşya hesap oluşturma eyleminden ayrılır.

Arka planda özgün izometrik görsellerin açılarını sürdüren ince lila çizgi deseni kullanılır. Desen görsellerin çevresinde ve bölüm kenarlarında belirir, metin çevresinde silikleşir. Mobilde yoğunluğu azaltılır. CSS maskesi dekoratiftir; tıklamaları engellemez, hareket içermez ve ürün ekranlarına taşınmaz.

Markayı koruyan, düşük yoğunluklu tasarım. Tasarım varyansı 6, hareket 3, görsel yoğunluk 2: ilk ekranda solda iki satırlı mesaj, sağda tek izometrik sahne. Yalnızca sekme seçimi ve soru açılışında hareket var. Genel font Inter, yüzeyler mevcut açık/koyu tokenlar; fuşya kayıt eylemleri, görsellerde sınırlı lila/mint ayrıntılar. Gölgeler raster nesnelerin fiziksel derinliği ve mevcut menülerle sınırlı.

Açılışa özel WebP sahnede katlanmış sunum sayfası, eğitmen ve üç katılımcı bir öğrenme alanı oluşturur. Bu görsel altta tekrarlanmaz. Üç ayrı destek görseli hazırlık, canlı eğitim ve eğitim sonrası aşamalarını anlatır; yazılar HTML'dir. İkinci bölüm aynı alanda üç erişilebilir sekmeyle değişir. Aşamalar, kısa açıklamalı sekmeler ve ortak görsel yüzeyiyle tek çerçevede sunulur. Devamında ilk yanıtı açık, tek seferde bir sorunun açıldığı dört soru ve sunumla başlamayı vurgulayan kapanış çağrısı vardır. Alt gezinme temel ürün bağlantılarını tekrar erişilebilir kılar. Küçük ekranda başlık, görsel ve bölüm içeriği tek sütuna geçer; gezinme yerel popover menüsüne dönüşür. Sahte müşteri referansları, ölçümler veya fiyatlandırma kullanılmaz.
