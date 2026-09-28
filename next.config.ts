import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker imajını küçük tutmak için gerekli tüm dosyaları .next/standalone altında toplar.
  output: "standalone",
  async headers() {
    return [
      {
        // script.js fiyat mantığını #catalog-data'dan (sayfadaki güncel CATALOG) okuyor.
        // Tarayıcı script.js'i uzun süre önbellekte tutarsa, fiyat güncellendiğinde
        // kullanıcı eski JS mantığıyla çalışan bir sayfa görebilir (ürün kartı ile
        // sepetin farklı görünmesine yol açar). Her istekte sunucuya doğrulatıyoruz;
        // içerik değişmediyse tarayıcı yine de 304 alıp önbelleği kullanır, ekstra
        // indirme maliyeti yok.
        source: "/script.js",
        headers: [{ key: "Cache-Control", value: "no-cache, must-revalidate" }]
      }
    ];
  }
};

export default nextConfig;
