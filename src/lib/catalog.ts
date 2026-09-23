// Ürün kataloğu: fiyat sunucuda sabittir; istemciden gelen fiyat asla güvenilmez.
// .NET portundaki Catalog/ProductCatalog.cs ile birebir aynı veriler.
// Fiyatlar artık src/lib/pricing.ts'teki temel fındık fiyatından otomatik hesaplanır;
// güncel piyasaya göre fiyat ayarlamak için o dosyadaki BASE_FINDIK_PRICE_PER_KG
// (veya FINDIK_BASE_FIYATI ortam değişkenini) güncellemeniz yeterlidir.

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
