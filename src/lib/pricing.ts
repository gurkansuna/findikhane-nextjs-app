// Fındık fiyatlandırma modeli
// --------------------------------
// Sitedeki üç ürünün de fiyatı, tek bir "temel fındık fiyatı"ndan (iç fındığın
// TL/kg cinsinden toptan/maliyet fiyatı) otomatik olarak hesaplanır. Fiyatları
// güncellemek için CATALOG'daki price alanlarını tek tek değiştirmeye gerek yok:
// sadece aşağıdaki BASE_FINDIK_PRICE_PER_KG değerini (veya FINDIK_BASE_FIYATI
// ortam değişkenini) güncellemek yeterli; product kartları, sepet ve checkout
// (ödeme) tutarı otomatik olarak yeniden hesaplanır.
//
// Referans (Eylül 2026): TMO resmi alım fiyatı kabuklu fındıkta ~245-255 TL/kg,
// serbest piyasada bölgeye göre ~140-205 TL/kg. Kabuklu→iç fındık dönüşüm oranı
// ~%46 baz alındığında bu, iç fındıkta ~400-450 TL/kg'lık bir toptan maliyete
// karşılık gelir. Aşağıdaki varsayılan değer bu aralığın ortasıdır.
export const BASE_FINDIK_PRICE_PER_KG =
  Number(process.env.FINDIK_BASE_FIYATI) > 0 ? Number(process.env.FINDIK_BASE_FIYATI) : 425;

export type PriceRule = {
  /** Temel fındık fiyatına göre çarpan: kalite/işleme/paketleme farkını yansıtır. */
  multiplier: number;
  /** Çarpanın gerekçesi; kod okuyan biri neden bu katsayı seçildiğini anlasın diye. */
  note: string;
};

export const PRICE_RULES: Record<string, PriceRule> = {
  "giresun-secme": {
    multiplier: 1.76,
    note: "Çiğ, elle ayıklanmış seçme iç fındık (Ordu-Giresun)"
  },
  "tas-firin-kavrulmus": {
    multiplier: 2.12,
    note: "Taş fırında kavrulmuş; kavurmadaki ağırlık kaybı ve ek işçilik/enerji maliyeti"
  },
  "ipek-kivam": {
    multiplier: 1.88,
    note: "Katkısız, %100 fındık ezmesi; öğütme, dolum ve kavanoz maliyeti"
  }
};

/** Perakendede alışıldık ",9" ile biten fiyatlara yuvarlar (749, 899, 799 gibi). */
function roundToPsychologicalPrice(value: number): number {
  return Math.round(value / 10) * 10 - 1;
}

export function computePrice(productId: string): number {
  const rule = PRICE_RULES[productId];
  if (!rule) {
    throw new Error(`"${productId}" için fiyat kuralı tanımlı değil (bkz. src/lib/pricing.ts).`);
  }
  return roundToPsychologicalPrice(BASE_FINDIK_PRICE_PER_KG * rule.multiplier);
}
