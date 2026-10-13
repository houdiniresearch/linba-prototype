---
name: LİNBA — Tasarım keşfi 2
description: Grafit eğitim çerçevesi, beyaz çalışma yüzeyi ve kobalt eylem rengi.
colors:
  primary: "oklch(0.505 0.19 260)"
  primary-hover: "oklch(0.45 0.19 260)"
  primary-soft: "oklch(0.944 0.025 260)"
  primary-ink: "oklch(0.40 0.16 260)"
  background: "oklch(0.979 0.002 260)"
  white: "oklch(1 0 0)"
  surface: "oklch(0.956 0.004 260)"
  ink: "oklch(0.235 0.016 260)"
  muted: "oklch(0.475 0.018 260)"
  border: "oklch(0.899 0.008 260)"
  sidebar: "oklch(0.205 0.013 260)"
  sidebar-muted: "oklch(0.73 0.012 260)"
typography:
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "14px"
    lineHeight: 1.85
  title:
    fontSize: "30px"
    fontWeight: 620
    letterSpacing: "-0.035em"
rounded:
  button: "7px"
  workspace: "12px"
spacing:
  small: "8px"
  medium: "16px"
  large: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.white}"
    rounded: "{rounded.button}"
    height: "42px"
---

# LİNBA görsel sistem taslağı

## Overview

Bu sürüm, kullanıcının ilk taslakların renk, tipografi, yerleşim ve genel karakterini reddetmesinin ardından hazırlanmıştır. Yeni yön henüz kabul edilmiş final tasarım değildir.

Fiziksel kullanım: aydınlık bir sınıfta bilgisayarından canlı soru yönetirken katılımcılara odaklanmak isteyen eğitmen; telefonda kısa bir soru gönderen katılımcı. Çalışma yüzeyi beyaz, eğitim bağlamı grafit yan çerçevedir. Satırlar soru akışını, bölünmüş yüzey seçili sorunun ayrıntısını taşır. Ayrı ayrı kartlardan çok aynı çalışma alanının bölümleri kullanılır.

## Colors

Kobalt ana eylem ve seçime ayrılır. Grafit eğitim çerçevesi kalıcı program bağlamını taşır. Renk sınırlı kullanılır; durumlar metin ve ikonla birlikte sunulur. İlk keşfin turuncu paleti bırakılmıştır. OKLCH kaynak formattır.

## Typography

Tek sistem sans ailesi. Temel görev metni 14–15 px, yan bilgi 11–12 px, başlık 25–30 px. Ürün düğmeleri ve veri metinleri gösterişli display font kullanmaz. Türkçe karakterler desteklenir. Dar ekranda başlıkların ve kullanıcı sorularının taşması engellenir.

## Elevation

Yerleşim yüzey tonu ve ince ayırıcılarla kurulur. Kart gölgeleri kullanılmaz. Diyaloglar tam sayfa örtü üzerinde açılır; iç içe panellerden kaçınılır.

## Components

Tek ikon ailesi: Phosphor. Diyalog: Radix. Soru satırı seçimi; kaynak bölümünü açma; yanıt paylaşma; konuyu ele alındı olarak işaretleme; bekleyen filtresi; örnek etkinlik; hazırlık profili ve rapor. Katılımcı soruları 500 karakterle sınırlandırılır; boş / kısa girdide bağlamsal hata ve korunan metin.

Eğitmen düzeni geniş ekranda yan çerçeve + soru listesi / yanıt bölümü. 960 px altında soru listesi yanıtın üstüne, 650 px altında eğitim aşamaları yatay üst bölüme taşınır. Katılımcı alanı 460 px ile sınırlandırılır, 390 px telefon görünümünde kontrol edilir. En küçük gerçek görev hedefleri rahat dokunulabilir boyuttadır.

## Do's and Don'ts

- Gerçek örnek sayımlarını kullan; örnek veriyi canlı ölçüm gibi sunma.
- Soruyu, yanıtı ve kaynak referansını birlikte tut.
- Boş, paylaşıldı ve kaynak açıldı durumlarını belirgin göster.
- Klavye odağını, diyalog kapatmayı ve azaltılmış hareketi koru.
- Kutu sayısını dekorasyon için artırma; her eyleme bir ana vurgu ver.
- Aynı tarayıcıdaki senkronizasyonu farklı cihazlar arasında canlı kullanım olarak tanıtma.
