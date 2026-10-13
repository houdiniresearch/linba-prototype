# LİNBA ile GitHub'a başlangıç

Hesap: `houdiniresearch`. Yeni depo adı: `linba-prototype`. Görünürlük: özel. Bu rehber depo oluşturulduğunda gerçek bağlantıyla tamamlanacaktır.

## Dört kavram

- **Depo (repository):** kodumuzun ve değişiklik geçmişinin bulunduğu proje alanı.
- **Commit:** ne değiştiğini açıklayan bir kayıt. Dosyayı kaydetmek otomatik commit oluşturmaz.
- **Branch:** bir özelliği ana sürümden ayrı geliştirdiğimiz dal.
- **Push:** bilgisayardaki commit'leri GitHub'a gönderme. Commit tek başına GitHub'a yükleme değildir.

## Bizim çalışma düzenimiz

İlk proje iskeleti `main` dalında oluşturulur. Sonraki özellikler, örneğin `feature/material-upload`, ayrı dalda geliştirilir. Değişiklik çalıştırılır ve kontrol edilir. GitHub'da bir pull request (PR) açılır; bu sayfa neyin değiştiğini gösterir. İncelenen değişiklik `main` ile birleştirilir (merge).

Her teslimatta değişen davranış, yapılan kontroller ve varsa eksikler kısa biçimde açıklanır. Kullanıcının Git komutlarını ezberlemesi gerekmez; işlemler proje üzerinde adım adım anlatılır.

## Sunuma hazırlık

Jüriye göstereceğimiz sürümü etiketleyerek belirli commit'i saklayacağız. Böylece sonraki değişiklikler gösterim sürümünü belirsizleştirmez. Depoyu özel tutmak ile canlı siteyi yayımlamak farklı işlemlerdir; GitHub'a kod yüklemek tek başına çalışan web sitesi oluşturmaz.

## Giriş

GitHub CLI bağlantısı tarayıcıyla yapılır:

```sh
gh auth login --hostname github.com --git-protocol https --web
```

Giriş kullanıcı tarafından kendi tarayıcısında tamamlanır. Şifre veya API anahtarı sohbet içine yazılmaz. Ortam dosyaları `.gitignore` ile depodan dışlanır.
