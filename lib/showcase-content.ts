import type { Activity } from "./types";

export type ShowcaseSlide = {
  title: string;
  subtitle?: string;
  layout: "cover" | "table" | "statement" | "chart" | "closing";
  headers?: string[];
  rows?: string[][];
  quote?: string;
  labels?: string[];
  values?: number[];
  note?: string;
  speaker: string;
};
export type ShowcaseDefinition = {
  key: "customer" | "market";
  name: string;
  theme: "light" | "dark";
  participants: number;
  durationMinutes: number;
  slides: ShowcaseSlide[];
  activities: {
    afterPage: number;
    activity: Activity;
    answers: string[];
    distribution?: number[];
  }[];
  questions: {
    topic: string;
    title: string;
    text: string;
    answer?: string;
    source: number;
    review?: boolean;
  }[];
  recommendations: string[];
  summary: string;
  sources: string[];
};

export const showcaseDefinitions: ShowcaseDefinition[] = [
  {
    key: "customer",
    name: "Müşteriyi Anlamak",
    theme: "light",
    participants: 20,
    durationMinutes: 42,
    sources: [
      "https://www.ycombinator.com/blog/practical-design-user-observation/",
    ],
    slides: [
      {
        title: "Müşteriyi\nAnlamak",
        subtitle: "Daha iyi sorularla gerçek ihtiyaçları keşfetmek",
        layout: "cover",
        speaker:
          "Bu atölyede bir fikri anlatmak yerine müşterinin son yaşadığı durumu inceleyeceğiz. Katılımcılardan kendi ürünleri için bir müşteri problemi seçmelerini iste.",
      },
      {
        title: "Varsayım ve kanıt",
        subtitle:
          "Bir fikre verilen olumlu tepki, satın alma davranışıyla aynı şey değildir.",
        layout: "table",
        headers: [
          "Duyduğumuz ifade",
          "Henüz bilmediğimiz",
          "Arayacağımız kanıt",
        ],
        rows: [
          [
            "‘Böyle bir araç güzel olur.’",
            "Problem ne kadar sık yaşanıyor?",
            "Son yaşanan olay ve iş akışı",
          ],
          [
            "‘Ekibimiz çok zaman kaybediyor.’",
            "Hangi işte, ne kadar?",
            "Somut bir işin süresi ve etkisi",
          ],
          [
            "‘Buna bütçe ayırabiliriz.’",
            "Kararı kim, nasıl veriyor?",
            "Benzer bir satın almanın hikâyesi",
          ],
        ],
        speaker:
          "Her satırda görüşün yerine hangi davranışı gözlemleyebileceğimizi tartış. Katılımcıların bir ifadeyi hemen talep kanıtı kabul etmesini engelle.",
      },
      {
        title: "Geçmiş davranışı sor",
        subtitle:
          "Görüşme, ürününü onaylatmak için değil müşterinin dünyasını anlamak içindir.",
        layout: "table",
        headers: ["Yönlendiren soru", "Daha iyi bir soru"],
        rows: [
          ["Bu uygulamayı kullanır mıydın?", "Bu işi en son nasıl yaptın?"],
          [
            "Otomasyon size zaman kazandırır mı?",
            "Son seferde en çok nerede zorlandın?",
          ],
          [
            "Aylık ödeme yapar mıydın?",
            "Bu problem için daha önce ne denedin?",
          ],
        ],
        speaker:
          "Bir gönüllüyle iki soruyu sırayla dene. İkinci sorunun hangi ayrıntıları açığa çıkardığını sor. Notları katılımcının kendi kelimeleriyle al.",
      },
      {
        title: "Müşteri problemini somutlaştır",
        layout: "statement",
        quote:
          "‘Her cuma farklı dosyalardaki müşteri notlarını birleştiriyorum. Geçen hafta bir isteği gözden kaçırdık.’",
        subtitle:
          "Bağlam: haftalık takip  ·  Davranış: dosyaları birleştirmek  ·  Etki: kaçan müşteri isteği",
        note: "Kurgusal müşteri görüşmesinden örnek alıntı.",
        speaker:
          "Problem cümlesini çözümün adını kullanmadan kurdur. Kimin, hangi durumda, hangi işi yaparken zorlandığını ve bunun sonucunu ayır.",
      },
      {
        title: "Görüşme notlarında örüntü ara",
        subtitle: "Aynı müşteri grubuyla yapılan 8 kurgusal görüşmenin özeti.",
        layout: "chart",
        labels: [
          "Notları farklı dosyalarda tutma",
          "Haftalık birleştirme işi",
          "Takip edilemeyen müşteri isteği",
          "Yeni bir araç için bütçe araştırma",
        ],
        values: [8, 6, 5, 3],
        note: "Örnek atölye verileri. Sayılar 8 görüşmede konuyu dile getiren kişi sayısıdır; pazar oranı değildir.",
        speaker:
          "Bir konunun sık geçmesini genellenebilir pazar oranı olarak yorumlama. Benzer davranışları grupla, farklı müşteri gruplarını ayrı tut.",
      },
      {
        title: "Bir haftalık doğrulama denemesi",
        subtitle: "Denemeden önce hangi gözlemin kararını değiştireceğini yaz.",
        layout: "table",
        headers: ["Varsayım", "Deneme", "Karar için aranan gözlem"],
        rows: [
          [
            "Haftalık takip işi önemli bir yük.",
            "Aynı segmentten 5 kişiyle son iş akışını incele.",
            "Tekrarlayan iş ve somut bir kayıp anlatılıyor mu?",
          ],
          [
            "Tek yerde takip etmek işe yarar.",
            "2 ekiple basit bir takip tablosu dene.",
            "Ekip bir hafta boyunca kendiliğinden kullanıyor mu?",
          ],
          [
            "Sorun için kaynak ayrılıyor.",
            "Mevcut çözümün satın alma sürecini sor.",
            "Karar sahibi, ayrılan süre ve bütçe netleşiyor mu?",
          ],
        ],
        note: "Bunlar bu vaka için tasarlanmış örnek deneylerdir; evrensel başarı eşikleri değildir.",
        speaker:
          "Katılımcılardan tek bir varsayım seçmelerini iste. Sonuç olumsuz çıkarsa neyi değiştireceklerini denemeden önce tanımlasınlar.",
      },
      {
        title: "Bugünkü alternatifi anlamak",
        subtitle: "Rakip her zaman başka bir yazılım değildir.",
        layout: "table",
        headers: [
          "Mevcut alternatif",
          "Neden tercih ediliyor?",
          "Değişmenin maliyeti",
        ],
        rows: [
          [
            "Paylaşılan hesap tablosu",
            "Herkes biliyor, hemen açılıyor.",
            "Eski notları taşımak ve alışkanlığı değiştirmek",
          ],
          [
            "E-posta ve mesajlaşma",
            "Ekibin mevcut iletişim kanalı",
            "Sohbetten düzenli takibe geçmek",
          ],
          [
            "İşi ertelemek",
            "Sorun henüz öncelikli görünmüyor.",
            "Başka bir işe ayrılan zaman",
          ],
        ],
        speaker:
          "Ürün rakiplerini listelemeden önce müşterinin bugün yaptığı işi sor. Hiçbir şey yapmamanın da bir alternatif olduğunu açıklat.",
      },
      {
        title: "Bir sonraki müşteri görüşmen",
        layout: "closing",
        subtitle:
          "Bir müşteri seç. Son yaşadığı durumu sor. Kararını değiştirecek kanıtı not et.",
        quote: "Görüşmeden bir övgüyle değil, yeni bir ayrıntıyla çık.",
        note: "Atölye çıktısı: bir problem cümlesi, üç görüşme sorusu ve bir deneme planı.",
        speaker:
          "Her katılımcı bir sonraki görüşmede soracağı ilk soruyu paylaşsın. Açık uçlu soruya gelen yanıtları birlikte okuyarak kapanış yap.",
      },
    ],
    activities: [
      {
        afterPage: 2,
        activity: {
          type: "poll",
          question:
            "Hangisi müşteri ihtiyacı hakkında daha güçlü bir kanıt sunar?",
          options: [
            "Fikrimi beğendiğini söylemesi",
            "Geçen hafta aynı problem için bir çözüm denemesi",
            "Sunumumu sonuna kadar dinlemesi",
            "Ürünün rengini beğenmesi",
          ],
        },
        distribution: [3, 13, 2, 1],
        answers: [],
      },
      {
        afterPage: 4,
        activity: {
          type: "open",
          question:
            "Bir müşteri problemini; kişi, durum ve etkisiyle birlikte tek cümlede yaz.",
          options: [],
        },
        answers: [
          "Küçük bir ajanstaki proje yöneticisi, cuma günü dağınık müşteri notlarını birleştirirken önemli geri bildirimleri kaçırıyor.",
          "Bir atölye eğitmeni, ders sonrası aynı soruları farklı kanallardan aldığı için geri dönüşleri takip edemiyor.",
          "Bir destek ekip lideri, haftalık iş dağıtımında farklı tablolara baktığı için bazı taleplere geç dönüyor.",
          "Bir satış temsilcisi, toplantı notlarını CRM'e aktarırken bir sonraki adımı unutuyor.",
          "Bir program koordinatörü, oturumların farklı dosyalardaki geri bildirimlerini birleştirirken güncel durumu göremiyor.",
          "Bir operasyon sorumlusu, vardiya değişiminde açık kalan işleri mesajlardan ararken zaman kaybediyor.",
          "Bir müşteri başarı yöneticisi, yenileme görüşmesinden önce eski talepleri ararken müşterinin son şikâyetini bulamıyor.",
          "Bir girişim kurucusu, kullanıcı görüşmelerinin notlarını ayrı defterlerde tuttuğu için ortak ihtiyaçları karşılaştıramıyor.",
          "Bir satış lideri, pazartesi toplantısında güncel olmayan tablodan ilerlediği için yanlış müşteriye öncelik veriyor.",
          "Bir teknik destek uzmanı, vardiyayı devralırken talebin son durumunu öğrenmek için aynı soruları yeniden soruyor.",
          "Bir eğitim koordinatörü, dersin ardından farklı formlara gelen yorumları birleştirirken hangi konunun tekrar edilmesi gerektiğini göremiyor.",
          "Bir proje danışmanı, haftalık raporu hazırlarken müşteri kararlarının hangi toplantıda alındığını bulmakta zorlanıyor.",
          "Küçük bir e-ticaret ekibi, kampanya sırasında gelen iadeleri farklı kanallardan takip ettiği için aynı müşteriye iki kere dönüyor.",
          "Bir ürün araştırmacısı, görüşme alıntılarını bağlamından ayrı tuttuğunda hangi ihtiyacın hangi segmente ait olduğunu karıştırıyor.",
          "Bir ekip yöneticisi, cuma günü tamamlanmayan işleri toplarken kimin dönüş yapacağını belirleyemiyor.",
          "Bir atölye katılımcısı, sunum sonrasında kaynağı farklı mesajlarda aradığı için öğrendiği adımı uygulamayı erteliyor.",
          "Bir tasarımcı, müşteri revizyonlarını ayrı mesajlardan toplarken onaylanan son sürümü yanlış anlıyor.",
        ],
      },
      {
        afterPage: 6,
        activity: {
          type: "scenario",
          question:
            "Müşteri ‘Güzel fikir, kesin kullanırım’ dedi. Somut bir ihtiyacı anlamak için sıradaki sorun ne olur?",
          options: [],
        },
        answers: [
          "Bu ihtiyacı en son ne zaman yaşadın, o gün nasıl çözdün?",
          "Geçen hafta bu işi yaparken yaşadığın son sorunu anlatır mısın?",
          "Şu an kullandığın yöntemi bana bir örnek üzerinden gösterebilir misin?",
          "Bu sorunu çözmek için daha önce ne denedin ve neden bıraktın?",
          "Bu iş aksadığında ekibinde ne oluyor, son örneğini hatırlıyor musun?",
          "Benzer bir araç aramaya en son ne zaman başladın? O gün ne olmuştu?",
          "Az önce bahsettiğin işi en son yaptığında hangi adım en uzun sürdü?",
          "Şu anki çözümün hangi kısmı işine yarıyor, hangi kısmını değiştirmek isterdin?",
          "Bana son müşteriden gelen isteği nasıl takip ettiğini gösterebilir misin?",
          "Geçen ay bu sorun yüzünden kaçırdığınız somut bir iş oldu mu?",
          "Bu ihtiyacı ekipte ilk kim fark etti ve sonrasında ne yaptınız?",
          "Daha önce başka bir çözümü bıraktınız mı? Bırakmanıza ne neden oldu?",
          "Bu işi bugün hiç değiştirmeden sürdürürsen en çok hangi durum seni zorlar?",
          "Son kez bu sorunu yaşadığında yardım istemen gerekti mi, kimden istedin?",
          "Şu anda bu iş için ayırdığınız zamanı nasıl takip ediyorsunuz?",
        ],
      },
    ],
    questions: [
      {
        topic: "evidence",
        title: "Olumlu yorum ve davranış kanıtı",
        text: "Müşteri fikri çok beğendiyse bunu talep kanıtı sayamaz mıyız?",
        answer:
          "Olumlu yorum bir başlangıçtır. İhtiyacın gücünü anlamak için son yaşanan problemi, denenen çözümü ve sonuçlarını sor.",
        source: 2,
      },
      {
        topic: "evidence",
        title: "Olumlu yorum ve davranış kanıtı",
        text: "Kullanırım demesi ile gerçekten çözüm denemesi arasındaki fark ne?",
        answer:
          "Kullanırım geleceğe dönük bir niyettir. Daha önce zaman veya kaynak ayırdığı bir çözüm, geçmiş davranışı gösterir.",
        source: 2,
      },
      {
        topic: "evidence",
        title: "Olumlu yorum ve davranış kanıtı",
        text: "Ürünü anlatmadan ihtiyacı nasıl konuşabilirim?",
        answer:
          "Ürün fikrinden önce müşterinin işi en son nasıl yaptığını ve nerede zorlandığını sorabilirsin.",
        source: 3,
      },
      {
        topic: "evidence",
        title: "Olumlu yorum ve davranış kanıtı",
        text: "Ne zaman problem kanıtının yeterli olduğuna karar vermeliyim?",
        review: true,
        source: 6,
      },
      {
        topic: "interview",
        title: "Görüşme sorularını kurmak",
        text: "Görüşmede kendi fikrimi hiç anlatmayacak mıyım?",
        answer:
          "Önce geçmiş davranışı ve iş akışını anlamaya odaklan. Fikrini erken anlatmak yanıtları yönlendirebilir.",
        source: 3,
      },
      {
        topic: "interview",
        title: "Görüşme sorularını kurmak",
        text: "Herkesin aynı soruları yanıtlaması gerekiyor mu?",
        answer:
          "Temel araştırma sorunu aynı tutabilirsin; anlatılan son olayın ayrıntılarını açmak için takip soruları sor.",
        source: 3,
      },
      {
        topic: "patterns",
        title: "Görüşmelerde örüntüler",
        text: "8 görüşmenin sonucu bütün pazara genellenebilir mi?",
        answer:
          "Hayır. Örnekteki sayılar yalnızca bu 8 kurgusal görüşmenin özeti. Bir pazar oranı olarak yorumlanmamalı.",
        source: 5,
      },
      {
        topic: "experiment",
        title: "Doğrulama denemesi",
        text: "Denememiz işe yaramazsa fikri tamamen bırakmalı mıyız?",
        answer:
          "Önce hangi varsayımın desteklenmediğini ayır. Müşteri grubunu, problem tanımını veya denemeyi bu gözleme göre yeniden değerlendir.",
        source: 6,
      },
      {
        topic: "alternative",
        title: "Mevcut alternatifler",
        text: "Excel kullanan bir ekibi rakip kullanıcısı sayabilir miyiz?",
        answer:
          "Hesap tablosu müşterinin bugün aynı işi yaptığı bir alternatif olabilir. Neden onu seçtiğini ve değişmenin maliyetini anlamak gerekir.",
        source: 7,
      },
    ],
    summary:
      "Katılımcılar problem cümlelerinde kişi, bağlam ve etkiyi birlikte kullanarak somut örnekler yazdı. Sorular en çok olumlu yorum ile davranış kanıtı arasındaki ayrımda yoğunlaştı. Senaryo yanıtlarında son yaşanan olayı ve mevcut çözümü sormaya yönelik ifadeler öne çıktı. Bir sonraki oturumda hangi kanıtla karar verileceğine ilişkin örnek bir görüşme birlikte incelenebilir.",
    recommendations: [
      "Olumlu yorum ve davranış kanıtını, katılımcıların yazdığı iki farklı örnek üzerinden karşılaştır.",
      "Problem cümlelerinde eksik kalan etkiyi bir takip sorusuyla açtır.",
      "Bir sonraki oturuma herkesin tek varsayım ve gözlem ölçütüyle gelmesini iste.",
    ],
  },
  {
    key: "market",
    name: "Pazar Analizi",
    theme: "dark",
    participants: 24,
    durationMinutes: 51,
    sources: ["https://www.sba.gov/counseling/plan-your-business/"],
    slides: [
      {
        title: "Pazar\nAnalizi",
        subtitle: "Pazar büyüklüğünden ilk müşteri segmentine",
        layout: "cover",
        speaker:
          "Kurgusal bir B2B destek yazılımı vakası üzerinden pazar sınırlarını, segment önceliğini ve ilk müşteri hedefini inceleyeceğiz.",
      },
      {
        title: "Pazarın sınırını tanımla",
        subtitle:
          "Ürün: destek taleplerini tek yerde takip eden bir B2B yazılımı.",
        layout: "table",
        headers: ["Sınır", "Bu vakadaki seçim", "Doğrulanacak nokta"],
        rows: [
          [
            "Müşteri",
            "10–50 kişilik destek ekipleri",
            "Talep hacmi ve tekrar eden iş yükü",
          ],
          [
            "Coğrafya",
            "İlk aşamada Türkiye",
            "Satış ve hizmet sunma kapasitesi",
          ],
          [
            "Satın alma",
            "Ekip yöneticisi ve operasyon sorumlusu",
            "Karar süreci ve mevcut bütçe",
          ],
        ],
        note: "Kurgusal vaka: kapsam bir araştırma varsayımıdır, doğrulanmış pazar verisi değildir.",
        speaker:
          "Bir sektör adının tek başına hedef pazar tanımı olmadığını vurgula. Kullanıcı, karar verici ve hizmet verilebilen alanı ayrı sor.",
      },
      {
        title: "TAM, SAM ve SOM",
        subtitle: "Aynı pazarı üç farklı kapsamda düşünmek.",
        layout: "table",
        headers: [
          "Kapsam",
          "Müşteri sayısı varsayımı",
          "Yıllık gelir karşılığı",
        ],
        rows: [
          ["TAM · toplam ilgili pazar", "20.000 şirket", "360 milyon TL"],
          ["SAM · hizmet verebildiğimiz alan", "6.000 şirket", "108 milyon TL"],
          ["SOM · ilk yıl müşteri hedefi", "120 şirket", "2,16 milyon TL"],
        ],
        note: "Tamamı kurgusal varsayımdır. Örnek hesap: şirket sayısı × 18.000 TL yıllık ücret. SOM, kapasite ve satış planıyla ayrıca sınanmalıdır.",
        speaker:
          "120 şirketin 6.000 içindeki ilk yıl hedefi olduğunu açıkla. TAM ile SOM'u toplama. Fiyatın ve şirket sayılarının yalnızca örnek varsayım olduğunu belirt.",
      },
      {
        title: "İlk müşteri segmentini seç",
        subtitle:
          "Pazarın tamamına aynı anda ulaşmaya çalışmak yerine karşılaştırılabilir bir karar ver.",
        layout: "table",
        headers: ["Segment", "İhtiyaç ve erişim", "Öncelik gerekçesi"],
        rows: [
          [
            "E-ticaret destek ekipleri",
            "Yoğun talepler, erişilebilir ekip yöneticileri",
            "İlk görüşmeler için odak",
          ],
          [
            "Büyük kurumsal çağrı merkezleri",
            "Yüksek hacim, uzun entegrasyon süreci",
            "Daha sonraki araştırma grubu",
          ],
          [
            "Tek kişilik işletmeler",
            "Daha düşük hacim, farklı bütçe",
            "Bu vaka için öncelik dışı",
          ],
        ],
        note: "Örnek segment değerlendirmesi; saha görüşmeleriyle doğrulanmalıdır.",
        speaker:
          "En büyük müşterinin her zaman ilk müşteri olmadığını tartıştır. Sorunun sıklığı, erişim ve hizmet sunabilme kapasitesini birlikte ele al.",
      },
      {
        title: "Rakipler ve bugünkü alternatifler",
        subtitle:
          "Müşterinin bugün işi nasıl tamamladığını da rekabet analizine dahil et.",
        layout: "table",
        headers: [
          "Alternatif",
          "Müşteriye sunduğu değer",
          "Araştıracağımız sınır",
        ],
        rows: [
          [
            "Genel amaçlı destek yazılımı",
            "Hazır takip ve ekip iş akışları",
            "Kurulum ve kullanım karmaşıklığı",
          ],
          [
            "E-posta ve hesap tablosu",
            "Bilinen araçlar, düşük geçiş ihtiyacı",
            "Talep sayısı arttığında takip yükü",
          ],
          [
            "Dışarıdan operasyon desteği",
            "İşi ekip dışında tamamlama",
            "Maliyet ve bilgi aktarımı",
          ],
        ],
        speaker:
          "Kurgusal ürün adları veya doğrulanmamış fiyatlar kullanmadan alternatifleri işlevlerine göre karşılaştır. Doğrudan rakibin yanında dolaylı alternatifi de sor.",
      },
      {
        title: "İlk 30 müşteri için satış varsayımı",
        subtitle:
          "İlk yıl hedefi: 120 müşteri. İlk çeyrek için örnek bir erişim hesabı.",
        layout: "chart",
        labels: [
          "Erişilen şirket",
          "Görüşme yapılan şirket",
          "Pilot başlatan şirket",
          "Ücretli müşteriye dönüşen",
        ],
        values: [2500, 250, 100, 30],
        note: "Kurgusal satış hunisi. Oranlar tahmin değil, test edilecek plan varsayımlarıdır; ilk yıl hedefi bu sonuçla doğrulanmış sayılmaz.",
        speaker:
          "Her aşamanın bir öncekinin alt kümesi olduğunu göster. 30 müşteriye ulaşmak için hangi oranların gerçekleşmesi gerektiğini katılımcılara hesaplat.",
      },
      {
        title: "Varsayımları verilerle sınamak",
        subtitle:
          "Her kritik sayının kaynağını ve onu değiştirecek gözlemi yaz.",
        layout: "table",
        headers: ["Varsayım", "Araştırma yolu", "Kararı etkileyen bulgu"],
        rows: [
          [
            "6.000 şirkete hizmet verebiliriz.",
            "Şirket listesi ve segment taraması",
            "Hedef tanımına gerçekten uyan şirket sayısı",
          ],
          [
            "Pilot için ihtiyaç yeterince güçlü.",
            "Müşteri görüşmesi ve pilot daveti",
            "Pilotun başlayıp başlamaması ve kullanılan iş akışı",
          ],
          [
            "Satış planı kapasiteyle uyumlu.",
            "İlk görüşmeler ve satış süresi kaydı",
            "Görüşme sayısı, dönüşüm ve ekip kapasitesi",
          ],
        ],
        speaker:
          "Bir pazar raporunun sayısını doğrudan satış potansiyeli kabul etme. İlk müşteri planını gerçek erişim ve kapasite kayıtlarıyla sınamayı vurgula.",
      },
      {
        title: "Analizin sonunda verilecek karar",
        layout: "closing",
        quote:
          "İlk araştırma odağımız:\n10–50 kişilik e-ticaret destek ekipleri.",
        subtitle:
          "Önce bu segmentin talep takibini incele. Pilot talebini ölç. Satış varsayımını gözlemle güncelle.",
        note: "Atölye çıktısı: bir segment seçimi, kaynakları belirtilmiş pazar hesabı ve ilk müşteri denemesi.",
        speaker:
          "Katılımcılardan kendi ürünleri için ilk araştıracakları segmenti ve bu kararı değiştirecek bir bulguyu yazmalarını iste.",
      },
    ],
    activities: [
      {
        afterPage: 3,
        activity: {
          type: "poll",
          question:
            "Bu vakada ilk yıl ulaşmayı hedeflediğimiz müşteri sayısı hangisi?",
          options: [
            "TAM: 20.000 şirket",
            "SAM: 6.000 şirket",
            "SOM: 120 şirket",
            "Üç sayının toplamı",
          ],
        },
        distribution: [2, 4, 16, 1],
        answers: [],
      },
      {
        afterPage: 5,
        activity: {
          type: "open",
          question:
            "Bu ürün için müşterinin bugün kullandığı en güçlü alternatif ne olabilir? Neden?",
          options: [],
        },
        answers: [
          "E-posta ve hesap tablosu; ekip alıştığı için geçiş maliyeti düşük görünüyor.",
          "Mevcut destek yazılımı; iş akışları ve eski kayıtlar zaten orada.",
          "Manuel takip; küçük bir ekip için yeni araç öğrenmekten daha kolay olabilir.",
          "Dışarıdan operasyon desteği; ekip yazılım yerine işi tamamen devretmeyi seçebilir.",
          "Mesajlaşma grubu; herkesin zaten kullandığı bir kanal ve hızlı başlıyor.",
          "İşi ertelemek; talep hacmi düşükse ekip sorunu öncelikli görmeyebilir.",
          "Paylaşılan gelen kutusu; herkes mevcut müşterilerin geçmişine aynı yerden ulaşabiliyor.",
          "CRM içindeki görevler; şirket zaten ödediği sistemden çıkmak istemeyebilir.",
          "Bir ekip liderinin manuel dağıtımı; ekip küçükken kişisel koordinasyon yeterli görülebilir.",
          "Hazır bir e-ticaret eklentisi; sipariş bilgileriyle destek talebi zaten birlikte görünüyor olabilir.",
          "Telefonla takip; müşteriler sorunu doğrudan tanıdıkları kişiye anlatmayı tercih edebilir.",
          "Mevcut sistemin iç otomasyonu; yeni bir ürün almadan kural eklemek daha kolay gelebilir.",
          "İçeride geliştirilmiş basit bir araç; iş akışı şirkete özel olduğu için ekip onu bırakmak istemeyebilir.",
          "Ajans desteği; yoğun dönemlerde ekip yerine dış kaynak kapasitesi artırılabilir.",
          "Ortak bir proje panosu; talepler satış ve operasyon görevleriyle aynı yerde yönetiliyor olabilir.",
          "Müşteriye kendi başına yanıt bulduracak bir yardım merkezi; destek talebi sayısını azaltabilir.",
          "Şablon yanıtlar ve bir dosya; sık gelen sorularda ekip ayrı bir takip sistemine gerek duymayabilir.",
          "Şirketin zaten kullandığı çağrı merkezi sistemi; eğitim ve entegrasyon maliyeti nedeniyle güçlü bir alternatif.",
          "Sadece öncelikli müşterilere dönüş yapmak; ekip kapasitesini böyle yönetiyor olabilir.",
          "Ek bir çalışan; yönetici yazılım yerine insan kaynağıyla sorunu çözmeye çalışabilir.",
          "Platformun kendi mesaj kutusu; işletme müşterinin bulunduğu kanaldan ayrılmak istemeyebilir.",
        ],
      },
      {
        afterPage: 7,
        activity: {
          type: "scenario",
          question:
            "İlk 10 görüşmede ekiplerin çoğu mevcut aracını değiştirmek istemiyor. Pazar varsayımını sınamak için sıradaki adımın ne olur?",
          options: [],
        },
        answers: [
          "Değişmek istememe nedenini ve mevcut aracın hangi işi iyi yaptığını son örnek üzerinden araştırırım.",
          "Yüksek talep hacmi yaşayan daha dar bir segmentte aynı görüşmeleri tekrarlarım.",
          "Geçiş maliyetini anlamak için verilerin nasıl taşındığını ve kararı kimin verdiğini sorarım.",
          "Satış varsayımını günceller, pilotun çözmesi gereken somut sorunu yeniden tanımlarım.",
          "Yeni ürün sunmak yerine mevcut iş akışında hangi noktada sorun oluştuğunu gözlemlerim.",
          "Kimin kullanıcı, kimin satın alma kararı veren kişi olduğunu ayırıp iki rolle ayrı görüşürüm.",
          "Aynı ekiplerin eski bir aracı en son neden değiştirdiğini araştırırım.",
          "Önce görüşülen 10 şirketin hedef segment tanımına gerçekten uyup uymadığına bakarım.",
          "Ürünü anlatmayı durdurup son yoğun destek gününü adım adım tarif etmelerini isterim.",
          "Yeni araca geçmenin maliyetini veri aktarımı, öğrenme süresi ve entegrasyon olarak ayrı incelerim.",
          "Pilot davetini belirli bir iş yüküne indirger, bütün sistemi değiştirmeyi talep etmem.",
          "Mevcut araçtan memnun olanlarla sorun yaşayanları ayırıp farklarını karşılaştırırım.",
          "Aynı segmentte yeniden görüşme planlar, ilk bulguyu tüm pazara genellemem.",
          "Ücretli satış hedefini korumak yerine ilk görüşme bulgularına göre dönüşüm varsayımını yeniden yazarım.",
          "Mevcut çözümü bırakmak istemeyen ekiplerde henüz çözülemeyen tek bir işi bulmaya çalışırım.",
          "Karar vericinin bu sorun için gerçekten zaman veya bütçe ayırıp ayırmadığını sorarım.",
          "Kurulum istemeyen küçük bir deneme önerir, denemeye katılımı ayrı bir gözlem olarak kaydederim.",
          "Problemin sıklığını son haftanın talepleri üzerinden saydırır, yalnızca genel memnuniyet yanıtına bakmam.",
          "Hedef segmenti daraltmanın yeterli olup olmadığını anlamak için erişim kanalı ve satış süresini de kaydederim.",
        ],
      },
    ],
    questions: [
      {
        topic: "scope",
        title: "SAM ve SOM arasındaki fark",
        text: "6.000 şirkete hizmet verebiliyorsak SOM neden 120?",
        answer:
          "6.000 şirket hizmet verebildiğimiz pazar alanı varsayımıdır. 120, satış kapasitesi ve erişim planıyla sınanacak ilk yıl müşteri hedefidir.",
        source: 3,
      },
      {
        topic: "scope",
        title: "SAM ve SOM arasındaki fark",
        text: "SOM'u her zaman SAM'ın sabit bir yüzdesi olarak mı hesaplarız?",
        answer:
          "Bu vakada SOM, ilk yıl müşteri hedefidir. Yalnız sabit bir yüzde seçmek yerine satış kanalı, dönüşüm ve ekip kapasitesiyle sınanmalıdır.",
        source: 3,
      },
      {
        topic: "scope",
        title: "SAM ve SOM arasındaki fark",
        text: "120 şirket yıllık hedef mi yoksa bütün pazar mı?",
        answer:
          "120 şirket ilk yıl için hedeflenen müşteri sayısıdır; toplam pazar değildir.",
        source: 3,
      },
      {
        topic: "scope",
        title: "SAM ve SOM arasındaki fark",
        text: "Bir pilot satış hedefinin yeterince gerçekçi olduğunu nasıl anlarız?",
        review: true,
        source: 6,
      },
      {
        topic: "scope",
        title: "SAM ve SOM arasındaki fark",
        text: "TAM ve SAM gelirlerini birbirine eklemeli miyiz?",
        answer:
          "Hayır. Bunlar aynı pazarın farklı kapsamlardaki hesaplarıdır. SAM, tanımladığın ilgili pazarın hizmet verebildiğin alanını ele alır.",
        source: 3,
      },
      {
        topic: "segment",
        title: "İlk müşteri segmenti",
        text: "Neden daha büyük çağrı merkezleriyle başlamıyoruz?",
        answer:
          "Bu vaka, ilk görüşmeler için erişim ve hizmet sunma kapasitesine odaklanır. Büyük merkezlerin uzun entegrasyon süreci ayrıca araştırılmalıdır.",
        source: 4,
      },
      {
        topic: "segment",
        title: "İlk müşteri segmenti",
        text: "Segmentleri aynı ölçütlerle değerlendirmek neden gerekli?",
        answer:
          "İhtiyaç, erişim ve hizmet verebilme kapasitesi farklı segmentler arasında karşılaştırılabilir bir öncelik kararı vermeyi sağlar.",
        source: 4,
      },
      {
        topic: "alternative",
        title: "Dolaylı alternatifler",
        text: "Hesap tablosu da rakip sayılır mı?",
        answer:
          "Müşteri aynı işi hesap tablosuyla yapıyorsa bu mevcut bir alternatiftir. Değişmenin maliyeti ve sağladığı değeri incelemek gerekir.",
        source: 5,
      },
      {
        topic: "alternative",
        title: "Dolaylı alternatifler",
        text: "Hiçbir şey yapmamak neden alternatif?",
        answer:
          "Müşteri sorunu henüz öncelikli görmeyebilir. Araç değiştirmek yerine mevcut durumu sürdürmek de bir tercihtir.",
        source: 5,
      },
      {
        topic: "funnel",
        title: "Satış hunisi varsayımları",
        text: "2.500 şirkete erişmek 30 satışı garanti eder mi?",
        answer:
          "Hayır. Hunideki sayılar bu vaka için test edilecek varsayımlardır. Görüşme, pilot ve ücretli dönüşüm kayıtlarıyla güncellenmelidir.",
        source: 6,
      },
      {
        topic: "source",
        title: "Pazar verisinin kaynağı",
        text: "Sunumdaki 20.000 şirket gerçek bir pazar araştırmasından mı?",
        answer:
          "Hayır. Sunumdaki şirket sayıları ve yıllık ücret, yöntemi göstermek için kullanılan kurgusal vaka varsayımlarıdır.",
        source: 3,
      },
      {
        topic: "source",
        title: "Pazar verisinin kaynağı",
        text: "Görüşme bulguları ile şirket sayısını aynı kaynakla mı doğrulamalıyız?",
        answer:
          "Farklı araştırma yolları kullanılır. Şirket sayısı için segment taraması, ihtiyaç için müşteri görüşmesi ve davranış gözlemi gerekir.",
        source: 7,
      },
    ],
    summary:
      "Katılımcı soruları SAM ile SOM arasındaki ayrımda yoğunlaştı. Anket yanıtlarının çoğu ilk yıl hedefini SOM ile ilişkilendirdi; diğer seçenekler aynı ayrımın yeniden açıklanabileceğini gösteriyor. Açık uçlu yanıtlarda mevcut destek yazılımının yanında hesap tablosu, mesajlaşma ve işi erteleme gibi dolaylı alternatifler de yer aldı. Senaryo yanıtlarında geçiş maliyetini araştırma ve daha dar segmentle deneme önerileri öne çıktı.",
    recommendations: [
      "SAM ile SOM'u aynı müşteri listesi üzerinde göster; hizmet verilebilen alan ile ilk yıl hedefini ayrı işaretle.",
      "Dolaylı alternatifleri katılımcıların açık uçlu yanıtlarından iki örnekle tartış.",
      "Satış hunisinde en belirsiz oranı seçtirip onu sınayacak küçük bir pilot planı yazdır.",
    ],
  },
];
