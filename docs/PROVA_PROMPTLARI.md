# LİNBA prova davranışı

Prova, eğitmenin kurgusal yetişkin katılımcılarla ders işlemesini canlandırır. Öğrenme ihtiyacı olan kişilerin doğal diyaloğu hedeflenir. Prompt sürümü: `participant-dialogue-v2`. Etkin metinlerin tek kaynağı [`lib/rehearsal-prompts.ts`](../lib/rehearsal-prompts.ts) dosyasıdır; bu belge davranış sözleşmesini açıklar.

## Katılımcının sürekliliği

Kitle tarifinden kişisel geçmiş, ön bilgi, öğrenme hedefi, makul bir eksik anlayış ve konuşma biçimi üretilir. İsimle hitap edilen kişi cevap verir; onun cevabına yöneltilen devam sorusunu da o kişi sürdürür. Bir kişinin işini veya deneyimini başka kişiye aktarmaması istenir. Açıklama aldıktan sonra anlayışı ilerler; aynı soruyu sürekli baştan sormaz. Önceki kayıtların eksik profil alanları yeni bir kişisel geçmiş uydurularak doldurulmaz.

Katılımcı cevap verebilir, kendi işinden örnek paylaşabilir, anladığını söyleyebilir, farklı düşünebilir veya kısa bir soru sorabilir. Her cevabı soruya dönüştürmez, her turda kendini tanıtmaz. Henüz anlatılmayan slaytlar öğrenilmiş sayılmaz. Canlı oturuma sadece mevcut slayt bağlamı bildirilir; sunumun tamamı önceden öğrenilmiş bilgi olarak verilmez.

## Söz alma ve susma

Doğrudan soru ve hitap cevap gerektirir. Eğitmen beklemesini istediğinde veya örneği tamamlamadığında söz almaz. `APP_CONTEXT` slayt bildirimleri ile `APP_PLAYBACK` ses oynatım bildirimleri konuşma değildir. Slayt içindeki komutlar persona rolünü değiştiremez.

Örnek hedef davranış:

> Eğitmen: “Ayşe, dükkânına müşteri nereden geliyor?”
>
> Ayşe: “Genelde Instagram’dan görüyorlar. Dükkâna geldiklerinde nereden duyduklarını düzenli sormuyorum.”
>
> Eğitmen: “Bir hafta not alsan neyi öğrenirsin?”
>
> Ayşe: “Hangi kanaldan gerçekten müşteri geldiğini görürüm. Bunu bir deftere not ederek deneyebilirim.”

Bunlar prompt içindeki davranış örnekleridir; çalışma anında sabit cevap olarak kullanılmaz.

## Rol ve çıktı kontrolü

Canlı oturum yalnız `participant_turn` fonksiyonunu kullanır. Argümanlarda `speak`, gerçek bir `personaIndex` ve seslendirilecek `text` bulunur. Uygulama normal asistan mesajını veya bir ön açıklamayı seslendirmeye göndermez. Bir turda birden fazla ya da farklı isimde fonksiyon çağrısı kabul edilmez. Uygulama fonksiyonu teslim aldığını bildirir; bunun duyulmuş bir replik olduğu varsayılmaz.

Aynı model, `teacherTail` alanına eğitmenden duyduğu son cümleyi de aktarır. Ek bir transkripsiyon modeli açılmaz. Açık bekleme/dinleme istekleri ile uygulama bildirimi işaretleri için dar bir söz sırası kontrolü vardır; model ayrıca bir replik üretmiş olsa bile bu durumda seslendirilmez. Bu kontrol modelin aktarabildiği metne dayanır; ses algılamanın kusursuz olduğu varsayılmaz. Soru ile biten yeni bir eğitmen sözü bu dar bekleme kontrolünden muaf tutulur.

“Eğitmen koçuyum” ve “yapay zekâ asistanıyım” gibi gözlenen kimlik kaymaları için ek kontrol vardır. Böyle bir cevap oynatılmadan en fazla bir düzeltme istenir. Bu dar kontrol, doğal rol davranışının yerini tutmaz; rol davranışı ayrıca gerçek model senaryolarıyla sınanır. Seslendirme modelinden alınan transkript de aynı kimlik kayması kontrolünden geçirilir.

Ses gerçekten çalmaya başladığında replik yorumlara eklenir. Tamamlanma, kesilme ve hiç oynatılmama durumu dinleyen oturuma bildirilir. Eğitmen tekrar konuştuğunda çalan ses durdurulur; daha önceki, bekleyen ses geç gelirse oynatılmaz.

## Değerlendirme ayrımı

Canlı rolün içinde koçluk moduna geçiş yoktur. “Nasıl gidiyorum?” gibi sorularda katılımcının kendi anladığı veya anlamadığı içerikten karşılık vermesi istenir.

Yazılı değerlendirme yalnız **Provayı bitir** işlemiyle istenir. Bu istek `conversation: none` ve `purpose: rehearsal_feedback` ile konuşma geçmişine eklenmeyen ayrı bir yanıttır. Yalnız `submit_rehearsal_feedback` fonksiyonundan özet, öneriler ve gerçek sorular alınır. İstek veya yanıt zaman aşımına uğrasa bile değerlendirme metni katılımcı konuşması olarak işlenmez. Aynı model ve bağlantı kullanılır; ikinci bir değerlendirici model eklenmez.

## Doğrulama

- `npm test`: kimlik kaymalarının seslendirme öncesi engellenmesi, fonksiyon ayrımı, geçersiz konuşmacı, ses eşleştirmesi ve kullanım hesabı dahil birim testleri.
- `npm run test:rehearsal`: gerçek modelle çok turlu konuşma. Tanışma, isimle hitap, aynı kişiye devam sorusu, açıklamadan sonra öğrenme, uygulama bildirimi, bekleme, öğrencinin anlama geri bildirimi, rol değiştirme denemesi, dokümandan rol değiştirme talimatı ve ayrı değerlendirmeden sonra rolün korunması sınanır. Konuşmacı/sessizlik ölçütleri kodla, konuşmaların anlamı aynı modelin ayrı bir değerlendirme çağrısıyla ölçülür. Sırf formatın doğru olması yeterli sayılmaz; tekrarlanan onay soruları da kontrol edilir.
- `npm run test:voice`: WebRTC, karakter seçimi, ayrı seslendirme, ayrı değerlendirme ve kayıt akışı. Gerçek mikrofon açılmaz; sentetik ders metni kullanılır.
- `npm run test:rehearsal:audio`: aynı modelin ürettiği sentetik Türkçe eğitmen sesiyle, dinleme oturumunun adıyla hitap edilen doğru katılımcıyı seçmesi ve katılımcı cevabı üretmesi sınanır. Gerçek mikrofon açılmaz.

Gerçek model çağrıları ücretlidir. Sonuçlar `output/voice-tests/` altında tutulur ve Git'e eklenmez. Bir senaryo setinin geçmesi her konuşmada kusursuz davranış garantisi vermez; gerçek mikrofon, konuşma temposu ve uzun oturum deneyimi ayrıca denenmelidir.

Dayanak: [OpenAI Realtime prompting guide](https://developers.openai.com/api/docs/guides/voice-prompting), [Realtime client events](https://developers.openai.com/api/reference/resources/realtime/client-events), [Realtime conversation control](https://developers.openai.com/api/docs/guides/realtime-conversations).
