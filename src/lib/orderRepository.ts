import { Pool } from "pg";
import type { CartLine } from "./validation";

// data/orders.json içindeki tek dosyalı depolamanın yerini alan, PostgreSQL tabanlı
// sipariş deposu. Not: kredi kartı veya T.C. kimlik no burada saklanmaz; sadece
// sepet içeriği, tutar, ödeme durumu ve /admin panelinde siparişi görüp kargoya
// hazırlamak için gereken alıcı ad/telefon/adres/şehir bilgisi tutulur.

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS orders (
    order_id        text PRIMARY KEY,
    created_at      timestamptz NOT NULL,
    completed_at    timestamptz NULL,
    cart            jsonb NOT NULL,
    conversation_id text NOT NULL,
    total           numeric(12,2) NOT NULL,
    payment_status  text NOT NULL,
    token           text NULL,
    payment_id      text NULL,
    buyer_first_name text NULL,
    buyer_last_name  text NULL,
    buyer_email      text NULL,
    buyer_gsm        text NULL,
    buyer_address    text NULL,
    buyer_city       text NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_token ON orders (token) WHERE token IS NOT NULL;
`;

// Bu tablo daha önce alıcı bilgisi olmadan oluşturulmuş olabilir (mevcut
// dağıtımlar). CREATE TABLE IF NOT EXISTS bu durumda yeni sütunları eklemeyeceği
// için, var olan kurulumları da güncellemek üzere ayrıca ALTER TABLE çalıştırıyoruz.
const ADD_BUYER_COLUMNS_SQL = `
  ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS buyer_first_name text NULL,
    ADD COLUMN IF NOT EXISTS buyer_last_name  text NULL,
    ADD COLUMN IF NOT EXISTS buyer_email      text NULL,
    ADD COLUMN IF NOT EXISTS buyer_gsm        text NULL,
    ADD COLUMN IF NOT EXISTS buyer_address    text NULL,
    ADD COLUMN IF NOT EXISTS buyer_city       text NULL;
`;

export type OrderBuyer = {
  firstName: string;
  lastName: string;
  email: string;
  gsmNumber: string;
  address: string;
  city: string;
};

export type OrderRecord = {
  orderId: string;
  createdAt: Date;
  completedAt: Date | null;
  cart: CartLine[];
  conversationId: string;
  total: number;
  paymentStatus: string;
  token: string | null;
  paymentId: string | null;
  /** Bu sipariş alıcı bilgisi eklenmeden önceki bir kayıtsa null olur. */
  buyer: OrderBuyer | null;
};

export type NewOrder = {
  orderId: string;
  createdAt: Date;
  cart: CartLine[];
  conversationId: string;
  total: number;
  paymentStatus: string;
  token?: string | null;
  buyer: OrderBuyer;
};

// Next.js dev modunda hot-reload her istekte modülü yeniden çalıştırabildiği için
// bağlantı havuzu globalThis üzerinde tekilleştiriliyor (aksi halde her reload'da
// yeni bir Pool açılır ve eskisi sızıntıya döner).
const globalForPg = globalThis as unknown as { findikhanePool?: Pool };

function getPool(): Pool {
  if (!globalForPg.findikhanePool) {
    globalForPg.findikhanePool = new Pool({
      connectionString:
        process.env.POSTGRES_CONNECTION_STRING ||
        "postgresql://findikhane:findikhane@localhost:5432/findikhane"
    });
  }
  return globalForPg.findikhanePool;
}

let schemaEnsured = false;

export async function ensureSchema(): Promise<void> {
  if (schemaEnsured) return;
  await getPool().query(CREATE_TABLE_SQL);
  await getPool().query(ADD_BUYER_COLUMNS_SQL);
  schemaEnsured = true;
}

export async function insertOrder(order: NewOrder): Promise<void> {
  await ensureSchema();
  await getPool().query(
    `INSERT INTO orders (
       order_id, created_at, cart, conversation_id, total, payment_status, token,
       buyer_first_name, buyer_last_name, buyer_email, buyer_gsm, buyer_address, buyer_city
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
      order.orderId,
      order.createdAt,
      JSON.stringify(order.cart),
      order.conversationId,
      order.total,
      order.paymentStatus,
      order.token ?? null,
      order.buyer.firstName,
      order.buyer.lastName,
      order.buyer.email,
      order.buyer.gsmNumber,
      order.buyer.address,
      order.buyer.city
    ]
  );
}

export async function setOrderToken(orderId: string, token: string): Promise<void> {
  await ensureSchema();
  await getPool().query("UPDATE orders SET token = $1 WHERE order_id = $2", [token, orderId]);
}

const SELECT_COLUMNS = `
  order_id, created_at, completed_at, cart, conversation_id, total, payment_status, token, payment_id,
  buyer_first_name, buyer_last_name, buyer_email, buyer_gsm, buyer_address, buyer_city
`;

export async function findOrderByToken(token: string): Promise<OrderRecord | null> {
  await ensureSchema();
  const { rows } = await getPool().query(
    `SELECT ${SELECT_COLUMNS} FROM orders WHERE token = $1 LIMIT 1`,
    [token]
  );
  if (rows.length === 0) return null;
  return mapRow(rows[0]);
}

export async function completeOrderPayment(orderId: string, completed: boolean, paymentId: string | null): Promise<void> {
  await ensureSchema();
  await getPool().query(
    `UPDATE orders
     SET payment_status = $1, payment_id = $2, completed_at = $3
     WHERE order_id = $4`,
    [completed ? "SUCCESS" : "FAILURE", paymentId ?? null, new Date(), orderId]
  );
}

export type ListOrdersParams = {
  limit: number;
  offset: number;
  /** Sipariş no, alıcı adı veya soyadına göre serbest arama (opsiyonel). */
  search?: string;
};

export type ListOrdersResult = {
  orders: OrderRecord[];
  total: number;
};

// /admin panelindeki sipariş listesi. Arama verilmişse sipariş no'da veya
// alıcı ad/soyadında eşleşme arar.
export async function listOrders({ limit, offset, search }: ListOrdersParams): Promise<ListOrdersResult> {
  await ensureSchema();
  const pool = getPool();
  const trimmedSearch = search?.trim();
  const like = trimmedSearch ? `%${trimmedSearch}%` : null;
  const whereClause = like
    ? "WHERE order_id ILIKE $1 OR buyer_first_name ILIKE $1 OR buyer_last_name ILIKE $1"
    : "";

  const listQuery = like
    ? `SELECT ${SELECT_COLUMNS} FROM orders ${whereClause} ORDER BY created_at DESC LIMIT $2 OFFSET $3`
    : `SELECT ${SELECT_COLUMNS} FROM orders ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
  const listParams = like ? [like, limit, offset] : [limit, offset];

  const countQuery = `SELECT COUNT(*)::int AS count FROM orders ${whereClause}`;
  const countParams = like ? [like] : [];

  const [{ rows }, { rows: countRows }] = await Promise.all([
    pool.query(listQuery, listParams),
    pool.query(countQuery, countParams)
  ]);

  return {
    orders: rows.map(mapRow),
    total: countRows[0]?.count ?? 0
  };
}

function mapRow(row: Record<string, unknown>): OrderRecord {
  const buyerFirstName = row.buyer_first_name as string | null;
  const buyer: OrderBuyer | null = buyerFirstName
    ? {
        firstName: buyerFirstName,
        lastName: (row.buyer_last_name as string) ?? "",
        email: (row.buyer_email as string) ?? "",
        gsmNumber: (row.buyer_gsm as string) ?? "",
        address: (row.buyer_address as string) ?? "",
        city: (row.buyer_city as string) ?? ""
      }
    : null;

  return {
    orderId: row.order_id as string,
    createdAt: row.created_at as Date,
    completedAt: (row.completed_at as Date | null) ?? null,
    cart: row.cart as CartLine[],
    conversationId: row.conversation_id as string,
    total: Number(row.total),
    paymentStatus: row.payment_status as string,
    token: (row.token as string | null) ?? null,
    paymentId: (row.payment_id as string | null) ?? null,
    buyer
  };
}
