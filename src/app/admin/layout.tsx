import type { Metadata } from "next";

// /admin altındaki hiçbir sayfa arama motorlarında indekslenmemeli.
export const metadata: Metadata = {
  title: "Fındıkhane | Yönetim Paneli",
  robots: { index: false, follow: false }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-shell">{children}</div>;
}
