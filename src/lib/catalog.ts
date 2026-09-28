// Ürün kataloğu: fiyat sunucuda sabittir; istemciden gelen fiyat asla güvenilmez.
// .NET portundaki Catalog/ProductCatalog.cs ile birebir aynı veriler.
// Fiyatlar artık src/lib/pricing.ts'teki temel fındık fiyatından otomatik hesaplanır;
// güncel piyasaya göre fiyat ayarlamak için o dosyadaki BASE_FINDIK_PRICE_PER_KG
// (veya FINDIK_BASE_FIYATI ortam değişkenini) güncellemeniz yeterlidir.

import crypto from "node:crypto";
import { computePrice } from "./pricing";

export type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
};

export const CATALOG: Record<string, Product> = {
  "giresun-secme": {
    id: "giresun-secme",
    name: "Ordu ve Giresun Seçme",
    price: computePrice("giresun-secme"),
    category: "Çiğ iç fındık"
  },
  "tas-firin-kavrulmus": {
    id: "tas-firin-kavrulmus",
    name: "Taş Fırın Kavrulmuş",
    price: computePrice("tas-firin-kavrulmus"),
    category: "Kavrulmuş iç fındık"
  },
  "ipek-kivam": {
    id: "ipek-kivam",
    name: "İpek Kıvam",
    price: computePrice("ipek-kivam"),
    category: "Katkısız fındık ezmesi"
  }
};

export function getProduct(id: string): Product | undefined {
  return Object.prototype.hasOwnProperty.call(CATALOG, id) ? CATALOG[id] : undefined;
}

// Fiyatlar değiştiğinde (temel fındık fiyatı ya da bir ürünün çarpanı) bu değer de
// değişir. page.tsx bunu /script.js'in URL'sine ekliyor (?v=...); böylece tarayıcı
// veya aradaki bir CDN/nginx script.js'i ne kadar agresif önbelleğe alırsa alsın,
// fiyat değiştiğinde URL de değiştiği için eski (fiyatı farklı hesaplayan) sürüm asla
// yeniden kullanılmaz; sepet her zaman sayfadaki güncel fiyatla aynı script.js'i okur.
export const CATALOG_VERSION = crypto
  .createHash("md5")
  .update(JSON.stringify(Object.fromEntries(Object.values(CATALOG).map((p) => [p.id, p.price]))))
  .digest("hex")
  .slice(0, 8);
