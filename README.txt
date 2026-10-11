AC/DC BİLİŞİM — PREMIUM V2 (GoDaddy Node.js Hosting)

İÇERİK
- Apple esintili kaydırma animasyonları ve mobil uyumlu görünüm
- Yönetim paneli: /admin
- Galeri dosyaları özgün boyutlarıyla public/assets/gallery altında sunucuda saklanır.
- Galerideki fotoğraf/video tıklanınca kesilmeden, orijinal en-boy oranıyla açılır; tarayıcı sekmesi simgesi AC/DC Bilişim logosudur.
- Yükleme sınırı dosya başına 100 MB; GoDaddy planınızın disk/istek limitleri ayrıca geçerlidir.
- Hizmet, metin, fotoğraf ve proje düzenleme
- Teklif talepleri
- /robots.txt ve /sitemap.xml
- Sayfa başlığı/açıklaması ve LocalBusiness (Electrician) yapılandırılmış verisi
- GoDaddy Node.js Hosting için package.json build/start betikleri

YERELDE ÇALIŞTIRMA
1. ZIP'i tamamen çıkar.
2. Node.js 22 LTS kurulu olsun.
3. Terminalde proje klasöründe npm start çalıştır veya start-localhost.bat dosyasını aç.
4. Site: http://localhost:3017
5. Yönetim: http://localhost:3017/admin

YEREL DEMO GİRİŞİ
Kullanıcı: admin
Şifre: acdc1439

CANLIYA ALMADAN ÖNCE GÜVENLİK
Canlı ortamda ACDC_ADMIN_USER ve ACDC_ADMIN_PASS ortam değişkenlerini mutlaka ayarlayın ve güçlü, benzersiz bir parola kullanın. Bu ZIP'teki varsayılan giriş bilgilerini canlı sitede bırakmayın. Yönetim oturumu sunucu tarafında tutulur; oturumlar uygulama yeniden başladığında sona erer.

GODADDY NODE.JS HOSTING
- ZIP'in kökünde package.json ve server.js bulunmalı; ZIP'i açınca bunlar bir alt klasörün içine gizlenmemeli.
- GoDaddy'nin Node.js uygulama ekranından ZIP'i içe aktarın, Preview üzerinde test edin, sonra Publish edin.
- Ortam değişkenleri (production/publish ortamı):
  ACDC_ADMIN_USER = admin (veya seçtiğiniz kullanıcı)
  ACDC_ADMIN_PASS = acdc1439 (canlıda değiştirmeniz önerilir)
  SITE_URL = https://gercek-domaininiz.com (gerçek alan adınız)
- Uygulama GoDaddy'nin verdiği PORT ortam değişkenini kullanır.
- Site durumu ve teklif talepleri public/assets/.acdc-data altında tutulur; sunucu bu dizine HTTP erişimini engeller. GoDaddy'nin kullandığınız planında bu klasörün deployment'lar arasında korunduğunu canlıya almadan önce test edin. Ayrıca periyodik yedek alın.
- Eğer GoDaddy ortamınız public/assets altındaki dosyaları doğrudan CDN ile sunuyorsa, özel verileri bu dizinde tutmayın; harici veritabanı/özel kalıcı depolama kullanın.
- Canlıya geçmeden önce yönetici parolasını ayarlayın, yedek alın ve HTTPS üzerinden test edin.

YÖNETİM PANELİ KAYIT SORUNU
Paneldeki değişiklikler artık önce sunucuya kaydedilir; localStorage yalnızca ikincil önbellektir. Böylece tarayıcı depolama alanı dolu olsa bile sunucu kaydı başarısız olmaz. Kayıt hatası oluşursa panelde hata mesajı görünür.

GOOGLE'DA GÖRÜNME
1. Gerçek domain için Google Search Console'da Domain property oluşturup DNS TXT kaydıyla doğrulayın.
2. Search Console > Sitemaps bölümüne https://gercek-domaininiz.com/sitemap.xml gönderin.
3. URL Denetleme ile ana sayfayı kontrol edin ve dizine eklenmesini isteyin. Bu işlem anında sıralama veya indeks garantisi vermez.
4. Google Business Profile oluşturun/doğrulayın; işletme adı, telefon, hizmet alanı, çalışma saatleri ve kategori gerçek bilgilerle aynı olsun.
5. Sitedeki telefon, firma adı ve hizmet alanı bilgilerini her yerde tutarlı tutun. Sahte adres veya gerçekte verilmeyen hizmet eklemeyin.

NOTLAR
- JSON-LD'de şu an Kırklareli hizmet alanı ve telefon bilgisi var; fiziksel işletme adresi verilmediği için uydurulmadı.
- Gerçek domain SITE_URL olarak ayarlanmalı; aksi hâlde canonical ve sitemap gelen host adına göre oluşturulur.
- Bu sürümün dosya ve API kontrolleri yapıldı; GoDaddy canlı ortamında yayın, DNS ve kalıcı depolama testi kullanıcı hesabında ayrıca yapılmalıdır.


V10 DÜZELTMESİ
- ZIP kökünde package.json, server.js ve index.html bulunur; artık iç klasör içine gizlenmez.
- İçeri alınan gallery görselleri/videoları public/assets/gallery altında korunur.
- Varsayılan admin girişi: admin / acdc1439. GoDaddy ortam değişkenleri tanımlıysa bunlar önceliklidir.
