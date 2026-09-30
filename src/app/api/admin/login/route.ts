import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  createSessionToken,
  getAdminCredentials,
  isAdminConfigured,
  timingSafeStringEqual
} from "@/lib/adminAuth";

function loginRedirect(request: NextRequest, error?: string): NextResponse {
  const url = new URL("/admin/login", request.url);
  if (error) url.searchParams.set("error", error);
  // 303: formun POST'unu, sonraki isteği GET'e çevirerek yönlendirir (PRG deseni).
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAdminConfigured()) {
    return loginRedirect(request, "Yönetici paneli henüz yapılandırılmadı.");
  }

  let username = "";
  let password = "";
  try {
    const form = await request.formData();
    username = String(form.get("username") ?? "");
    password = String(form.get("password") ?? "");
  } catch {
    return loginRedirect(request, "Geçersiz istek.");
  }

  const credentials = getAdminCredentials();
  const ok =
    credentials !== null &&
    timingSafeStringEqual(username, credentials.username) &&
    timingSafeStringEqual(password, credentials.password);

  if (!ok) {
    return loginRedirect(request, "Kullanıcı adı veya şifre hatalı.");
  }

  const response = NextResponse.redirect(new URL("/admin", request.url), { status: 303 });
  response.cookies.set(ADMIN_SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 60 * 60 * 12
  });
  return response;
}
