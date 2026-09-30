import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/adminAuth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.redirect(new URL("/admin/login", request.url), { status: 303 });
  response.cookies.delete({ name: ADMIN_SESSION_COOKIE, path: "/admin" });
  return response;
}
