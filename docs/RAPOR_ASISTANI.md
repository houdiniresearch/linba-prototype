# Rapor asistanı

Raporlar sayfasındaki Rapor asistanı bağlantısı yeni sekmede `/rapor-asistani` adresini açar. Rapor detayındaki bağlantı `?rapor=<eğitim kimliği>` ile doğrudan ilgili konuşmayı açar. Soldaki listede eğitmene ait tamamlanmış eğitimler bulunur; her eğitim tek ve kalıcı bir sohbeti temsil eder. Yeni sohbet oluşturma düğmesi yoktur. İsim, tarih ve saat raporları ayırt etmeye yardımcı olur. Mobilde liste açılır bir paneldir; Escape, dış alan veya rapor seçimiyle kapanır.

## Veri ve model

- Yapılandırılmış mevcut model bağlantısı `modelJson` üzerinden kullanılır; ikinci model, embedding servisi veya ayrı sağlayıcı eklenmez.
- Her mesajda seçili eğitimin güncel katılımcı, soru ve aktivite kayıtlarından yeni bir bağlam hazırlanır. Eski otomatik rapor özeti sayısal doğruluk kaynağı sayılmaz.
- Toplamlar ve anket dağılımları sunucuda tüm kayıtlardan hesaplanır. Model yüzde başarı, tamamlanma veya öğrenme gelişimi uydurmaması için açıkça yönlendirilir. Görüş anketi sınav gibi değerlendirilmez.
- Metin ayrıntıları bağlamı sınırlamak için son 60 soru / 80 aktivite yanıtından, sırasıyla 24.000 / 18.000 karakter bütçesi içinde alınır. Kapsama bilgisi modele aktarılır; toplamlar değişmez. En fazla 60 aktivite, 20 soru grubu ve etkileşim sayısına göre sıralanan ilk 100 katılımcı ayrıntısı sağlanır.
- Önceki konuşmanın son 10 soru/yanıt çifti modele aktarılır; arayüzde tüm kayıtlı geçmiş görünür. Geçmişteki asistan yanıtları kanıt sayılmaz.
- Kaynaklar yalnız sunucunun izin verdiği rapor özeti, sorular ve aktivite sonuçları bölümlerine bağlanır. Modelin ürettiği bilinmeyen kaynak kimlikleri ayıklanır.
- Başka bir raporun verileri aynı isteğe eklenmez. Raporlar arası karşılaştırma bu sürümün kapsamı değildir.

Prompt: `lib/report-chat.ts` içindeki `REPORT_CHAT_PROMPT`. Rol, kaynak verileri ve çıktı biçimi açıkça ayrılır; rapor ve katılımcı metinlerinin talimat olarak izlenmemesi belirtilir. Yaklaşım için [OpenAI prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering) dokümantasyonu incelendi.

## API ve kayıt

- `GET /api/report-assistant`: mevcut eğitmene ait tamamlanmış raporların listesi.
- `GET /api/report-assistant/:id`: o rapora ait kalıcı mesaj çiftleri, varsa hazırlanmakta olan yanıt ve model bağlantı durumu.
- `POST /api/report-assistant/:id`: `message`, `requestId`, `previousTurnId`, `locale` alır. Eğitmen rolü, sahiplik, tamamlanmış eğitim, aynı kaynak isteği ve girdi boyutu sunucuda doğrulanır.
- Sohbet çiftleri SQLite `report-turn` kayıtlarında eğitim ve eğitmen kimliğiyle saklanır. Tamamlanmayan/başarısız yanıtlar geçmişe eklenmez.
- Aynı `requestId` ile yeniden deneme ikinci model çağrısı veya mesaj oluşturmaz. Aynı rapora eşzamanlı farklı yazımlar reddedilir; eski sekmenin son mesajı güncel değilse yeniden okuma istenir. Farklı raporlar birbirinden bağımsızdır.
- Hazırlanmakta olan yanıt bilgisi çalışan sunucu belleğindedir. Sunucu yeniden başlarsa tamamlanmış konuşmalar korunur, henüz tamamlanmamış istek yeniden gönderilmelidir.
- API hatasında kullanıcının yazdığı soru yeniden mesaj alanına yerleştirilir. Rapor geçişleri başka konuşmanın yanıtını aktif sohbete taşımaz.

## Doğrulama

`npm run test:report-assistant`: izole geçici veritabanında sahiplik/rol, rapor ayrımı, tam toplamlar ve sınırlı bağlam, kalıcı kayıt, idempotent tekrar, eşzamanlı istek, eski sekme ve hata sonrası yeniden deneme.

`npm run test:report-assistant:integration`: çalışan yerel sunucuda geçici hesaplarla kimlik doğrulama, sahiplik, durum, kaynak kontrolü ve girdi sınırları. `LINBA_TEST_AI=true` eklenirse mevcut API bağlantısıyla iki gerçek model yanıtı, takip sorusu, kalıcılık ve tekrar da doğrulanır. Sadece bu testin oluşturduğu hesap/kayıtlar temizlenir. Kullanıcının mevcut eğitimlerine mesaj yazılmaz.
