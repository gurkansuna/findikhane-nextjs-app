import { listOrders, type OrderRecord } from "@/lib/orderRepository";
import { money } from "@/lib/money";

const PAGE_SIZE = 25;

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  SUCCESS: { label: "Başarılı", className: "admin-badge-success" },
  FAILURE: { label: "Başarısız", className: "admin-badge-failure" },
  PENDING: { label: "Bekliyor", className: "admin-badge-pending" }
};

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Istanbul"
});

type AdminOrdersPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const { q, page: pageParam } = await searchParams;
  const search = q?.trim() || "";
  const page = Math.max(1, Number(pageParam) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  let orders: OrderRecord[] = [];
  let total = 0;
  let loadError: string | null = null;
  try {
    const result = await listOrders({ limit: PAGE_SIZE, offset, search: search || undefined });
    orders = result.orders;
    total = result.total;
  } catch (error) {
    console.error("Sipariş listesi yüklenemedi", error);
    loadError = "Sipariş listesi şu anda yüklenemiyor (veritabanına bağlanılamadı). Lütfen daha sonra tekrar deneyin.";
  }
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="admin-dashboard">
      <header className="admin-dashboard-header">
        <div>
          <p className="admin-eyebrow">fındıkhane</p>
          <h1>Siparişler</h1>
          <p className="admin-dashboard-subtitle">
            Toplam {total} sipariş{search ? ` · "${search}" için filtrelendi` : ""}
          </p>
        </div>
        <form action="/api/admin/logout" method="post">
          <button className="text-link admin-logout-button" type="submit">
            Çıkış yap
          </button>
        </form>
      </header>

      <form className="admin-search" method="get">
        <input
          type="search"
          name="q"
          placeholder="Sipariş no veya alıcı adıyla ara…"
          defaultValue={search}
          aria-label="Sipariş ara"
        />
        <button className="button button-primary" type="submit">
          Ara
        </button>
      </form>

      {loadError ? (
        <p className="admin-empty admin-error">{loadError}</p>
      ) : orders.length === 0 ? (
        <p className="admin-empty">
          {search ? "Aramanızla eşleşen sipariş bulunamadı." : "Henüz hiç sipariş yok."}
        </p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sipariş No</th>
                <th>Tarih</th>
                <th>Alıcı</th>
                <th>İletişim</th>
                <th>Teslimat</th>
                <th>Ürünler</th>
                <th>Tutar</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const status = STATUS_LABELS[order.paymentStatus] ?? {
                  label: order.paymentStatus,
                  className: "admin-badge-pending"
                };
                return (
                  <tr key={order.orderId}>
                    <td className="admin-mono">{order.orderId}</td>
                    <td>{dateFormatter.format(order.createdAt)}</td>
                    <td>
                      {order.buyer ? `${order.buyer.firstName} ${order.buyer.lastName}` : (
                        <span className="admin-muted">— (eski kayıt)</span>
                      )}
                    </td>
                    <td>
                      {order.buyer ? (
                        <>
                          <div>{order.buyer.gsmNumber}</div>
                          <div className="admin-muted">{order.buyer.email}</div>
                        </>
                      ) : (
                        <span className="admin-muted">—</span>
                      )}
                    </td>
                    <td>
                      {order.buyer ? (
                        <>
                          <div>{order.buyer.city}</div>
                          <div className="admin-muted admin-address">{order.buyer.address}</div>
                        </>
                      ) : (
                        <span className="admin-muted">—</span>
                      )}
                    </td>
                    <td>
                      <ul className="admin-cart-list">
                        {order.cart.map((line) => (
                          <li key={line.id}>
                            {line.name} × {line.quantity}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="admin-mono">₺{money(order.total)}</td>
                    <td>
                      <span className={`admin-badge ${status.className}`}>{status.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <nav className="admin-pagination" aria-label="Sayfalar">
          {page > 1 ? (
            <a href={`/admin?${new URLSearchParams({ ...(search ? { q: search } : {}), page: String(page - 1) })}`}>
              ← Önceki
            </a>
          ) : (
            <span className="admin-pagination-disabled">← Önceki</span>
          )}
          <span>
            Sayfa {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <a href={`/admin?${new URLSearchParams({ ...(search ? { q: search } : {}), page: String(page + 1) })}`}>
              Sonraki →
            </a>
          ) : (
            <span className="admin-pagination-disabled">Sonraki →</span>
          )}
        </nav>
      ) : null}
    </main>
  );
}
