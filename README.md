# Fındıkhane — Next.js (App Router) sürümü

Bu klasör, `src/Findikhane.Api` altındaki .NET sürümüyle aynı işlevleri gören bir Next.js (App Router, TypeScript) implementasyonudur. `node-app/` ve `nuxt-app/` klasörleriyle birlikte, aynı ürünün üç ayrı JavaScript/TypeScript çatısındaki yazımını oluşturur.

## Kapsam

- Ürün kataloğu, sepet doğrulaması (T.C. kimlik no, e-posta, GSM), sipariş oluşturma ve iyzico Checkout Form entegrasyonu .NET sürümüyle birebir aynı davranışı taşıyacak şekilde port edildi (`src/lib/`).
- `POST /api/checkout` ve `POST /payment/callback` uçları Route Handler olarak (`src/app/api/checkout/route.ts`, `src/app/payment/callback/route.ts`) tanımlı — ikinci uç kasıtlı olarak `/api` öneki almıyor, orijinal `server.js` ile aynı URL.
- Siparişler PostgreSQL'de saklanır (`src/lib/orderRepository.ts`).
- Vitrin sayfası (`src/app/page.tsx`) orijinal `wwwroot/index.html` ile aynı içerik ve tasarımı taşır; sepet/checkout etkileşimi de React state'ine taşınmadan, orijinal `public/script.js` dosyası aynen kullanılarak çalışır (DOM'u doğrudan yöneten kod, davranış farkı riski almamak için portlanmadı).

## Yerel çalıştırma

```bash
cp .env.example .env   # değerleri doldurun
npm install
npm run dev
```

PostgreSQL'e ihtiyaç var; yoksa hızlıca `docker compose up postgres` ile ayağa kaldırabilirsiniz.

## Docker ile çalıştırma

```bash
docker compose up --build
```

`docker-compose.yml`, uygulamayı (standalone Next.js build) ve bir PostgreSQL 16 konteynerini birlikte ayağa kaldırır.

## Ortam değişkenleri

`.env.example` dosyasına bakın: `PORT`, `POSTGRES_CONNECTION_STRING`, `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, `IYZICO_BASE_URL`, `PUBLIC_BASE_URL`. Yönetim paneli için ayrıca `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`
(rastgele, uzun bir dize; oturum çerezini imzalamak için kullanılır) gerekir.

## Yönetim paneli (/admin)

`/admin` altında, tek bir yönetici hesabıyla korunan bir sipariş listesi paneli
var (`/admin/login` giriş ekranı, `/admin` sipariş listesi). Sipariş no, tarih,
alıcı adı/telefon/adres, sepet içeriği, tutar ve ödeme durumunu gösterir; sipariş
no veya alıcı adına göre arama ve sayfalama içerir.

- Kullanılacak kullanıcı adı/şifre `ADMIN_USERNAME` / `ADMIN_PASSWORD` ortam
  değişkenlerinden okunur; bu ikisi ve `ADMIN_SESSION_SECRET` tanımlı değilse
  panel "henüz yapılandırılmadı" diyerek girişi reddeder.
- Oturum, süresi 12 saat sonra dolan, HMAC ile imzalanmış bir HttpOnly çerezle
  tutulur; ayrı bir kullanıcı/oturum tablosu yoktur.
- T.C. kimlik no hiçbir zaman veritabanına yazılmaz; sadece iyzico'ya gönderilir.
  Alıcı adı, telefonu, adresi ve şehri ise sipariş kaydına (`orders` tablosu)
  eklenmiştir — bu, kişisel veri saklamak anlamına geldiğinden KVKK kapsamında
  saklama süresi/erişim/silme sorumluluğu doğurur.


### Fındık fiyatlarını güncelleme

Ürün fiyatları elle tek tek girilmiyor; `src/lib/pricing.ts`'teki tek bir temel fındık
fiyatından (TL/kg) otomatik hesaplanıyor (bkz. `CATALOG`, `src/lib/catalog.ts`). Güncel
piyasaya göre fiyat ayarlamak için iki yol var:

- `FINDIK_BASE_FIYATI` ortam değişkenini ayarlayın (örn. `docker-compose.yml`'de veya
  dağıtım ortamınızda) — kod değişikliği gerekmez.
- Ya da `src/lib/pricing.ts` içindeki `BASE_FINDIK_PRICE_PER_KG` varsayılanını güncelleyip
  deploy edin.

Her iki durumda da ürün kartları, sepet ve checkout (iyzico'ya giden) tutarı otomatik
olarak yeni fiyata göre yeniden hesaplanır; üç yerde ayrı ayrı güncelleme yapmaya gerek yoktur.
