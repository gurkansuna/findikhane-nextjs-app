import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/adminAuth";

// /admin altındaki (login hariç) tüm sayfaları koruyan giriş kontrolü. (protected)
// bir route group olduğu için URL'de görünmez; /admin doğrudan bu grubun içindeki
// page.tsx'e denk gelir.
export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!verifySessionToken(token)) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
