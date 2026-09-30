import crypto from "node:crypto";

// /admin panelinin basit oturum sistemi. Ayrı bir kullanıcı/parola tablosu veya
// üçüncü parti bir auth kütüphanesi yok; tek bir yönetici hesabı ortam
// değişkenlerinden (ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_SESSION_SECRET) okunuyor.
// Oturum, süresi damgalı ve HMAC ile imzalanmış bir çerez olarak tutuluyor; bu sayede
// sunucu tarafında ayrı bir "sessions" tablosu tutmaya gerek kalmıyor ve çerez
// kopyalansa bile süresi dolunca veya imza tutmayınca geçersiz sayılıyor.

export const ADMIN_SESSION_COOKIE = "fh_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 saat

export type AdminCredentials = {
  username: string;
  password: string;
};

export function getAdminCredentials(): AdminCredentials | null {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return null;
  return { username, password };
}

export function isAdminConfigured(): boolean {
  return Boolean(getAdminCredentials() && process.env.ADMIN_SESSION_SECRET);
}

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET tanımlı değil. /admin panelini kullanmadan önce bu ortam değişkenini ayarlayın."
    );
  }
  return secret;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

/** Zamanlama saldırılarına karşı sabit süreli string karşılaştırma. */
export function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    // Uzunluk farklıysa yine de sabit süreli bir karşılaştırma çalıştırıyoruz ki
    // "uzunluk yanlış" ile "içerik yanlış" arasındaki zamanlama farkı küçülsün.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export function createSessionToken(): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = String(expiresAt);
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  let expected: string;
  try {
    expected = sign(payload);
  } catch {
    return false;
  }

  if (!timingSafeStringEqual(signature, expected)) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
  return true;
}
