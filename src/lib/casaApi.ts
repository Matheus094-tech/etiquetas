/** Cliente Casa Nexo com Neon Managed Better Auth + Neon Data API.
 *  Usa somente a URL HTTPS pública; NUNCA inclua a connection string PostgreSQL no Vite.
 */
import { createClient } from "@neon/neon-js/supabase";

export const NEON_URL = (import.meta.env.VITE_NEON_URL ?? "").replace(/\/$/, "");
export const casaConfigured = Boolean(NEON_URL);
const client = createClient(NEON_URL || "https://ep-placeholder.c-2.sa-east-1.aws.neon.tech/unused");
const DATA_URL = NEON_URL.replace(".c-2.", ".apirest.c-2.");

export type Session = {
  access_token: string;
  expires_at: number;
  user: { id: string; email?: string };
};

export type House = { id: string; name: string; created_at: string };
export type Location = {
  id: string; house_id: string; name: string; kind: string; parent_id: string | null;
};
export type Product = {
  id: string; house_id: string; name: string; brand: string | null;
  category: string | null; barcode: string | null; package_description: string | null;
  reorder_at: number; photo_path: string | null; notes: string | null;
};
export type StockLot = {
  id: string; house_id: string; product_id: string; location_id: string | null;
  quantity: number; expires_on: string | null; purchased_on: string | null;
};
export type InventoryItem = Product & { lots: StockLot[]; total: number };


let session: Session | null = null;
const listeners = new Set<(value: Session | null) => void>();
export function getSession() { return session; }
export function onSessionChange(callback: (current: Session | null) => void) {
  listeners.add(callback);
  return () => { listeners.delete(callback); };
}
function setSession(next: Session | null) {
  session = next;
  for (const callback of listeners) callback(next);
}
function fromAuthSession(raw: unknown): Session | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  const u = s.user as Record<string, unknown> | undefined;
  if (!u?.id || typeof u.id !== "string") return null;
  const accessToken = s.access_token;
  if (typeof accessToken !== "string" || !accessToken) return null;
  return {
    access_token: accessToken,
    expires_at: typeof s.expires_at === "number" ? s.expires_at * 1000 : Date.now() + 13 * 60_000,
    user: { id: u.id, email: typeof u.email === "string" ? u.email : undefined },
  };
}
export async function restoreSession() {
  if (!casaConfigured) { setSession(null); return; }
  try {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    setSession(fromAuthSession(data.session));
  } catch {
    setSession(null);
  }
}
export async function login(email: string, password: string) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  const logged = fromAuthSession(data.session);
  if (!logged) {
    await restoreSession();
    if (!session) throw new Error("Não foi possível obter sessão do Neon.");
  } else setSession(logged);
}
export async function logout() {
  try { await client.auth.signOut(); }
  finally { setSession(null); }
}
/** Com identidades técnicas sem e-mail real, a recuperação precisa de fluxo
 * administrativo no Neon Auth. Não oferecer alteração local insegura.
 */
export async function changePassword(_currentPassword: string, _nextPassword: string): Promise<void> {
  void _currentPassword; void _nextPassword;
  throw new Error("Troca de senha ainda indisponível no Neon. Solicite uma redefinição administrativa.");
}
async function token(): Promise<string> {
  const { data, error } = await client.auth.getSession();
  if (error || !data.session) { setSession(null); throw new Error("Sua sessão expirou. Entre novamente."); }
  const next = fromAuthSession(data.session);
  if (!next) throw new Error("Sessão sem token de autorização.");
  setSession(next);
  return next.access_token;
}
export async function apiRequest<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE", path: string, body?: unknown
): Promise<T> {
  const bearer = await token();
  const res = await fetch(`${DATA_URL}/rest/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${bearer}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      Prefer: "return=representation",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const raw = await res.text();
  let json: unknown;
  try { json = raw ? JSON.parse(raw) : null; } catch { json = raw; }
  if (!res.ok) {
    const message = json && typeof json === "object" ? (json as Record<string, unknown>).message : null;
    throw new Error(typeof message === "string" ? message : `Erro HTTP ${res.status}`);
  }
  return json as T;
}
function params(values: Record<string, string>) {
  return new URLSearchParams(values).toString();
}
export async function getHouses() {
  return apiRequest<House[]>("GET", "houses?" + params({
    select: "id,name,created_at", order: "created_at.asc",
  }));
}
export async function createHouse(name: string) {
  const user = getSession()?.user;
  if (!user) throw new Error("Entre na sua conta.");
  const rows = await apiRequest<House[]>("POST", "houses", {
    name: name.trim(), created_by: user.id,
  });
  if (!rows[0]) throw new Error("Não foi possível criar a Casa.");
  return rows[0];
}
export async function createInvite(houseId: string) {
  return apiRequest<string>("POST", "rpc/create_house_invite", { p_house_id: houseId });
}
export async function redeemInvite(token: string) {
  return apiRequest<string>("POST", "rpc/redeem_house_invite", { p_token: token.trim() });
}
export async function getLocations(houseId: string) {
  return apiRequest<Location[]>("GET", "storage_locations?" + params({
    select: "id,house_id,name,kind,parent_id",
    house_id: `eq.${houseId}`, order: "name.asc",
  }));
}
export async function createLocation(houseId: string, name: string, kind: string, parentId: string | null) {
  return apiRequest<Location[]>("POST", "storage_locations", {
    house_id: houseId, name: name.trim(), kind, parent_id: parentId,
  });
}
export async function getInventory(houseId: string): Promise<InventoryItem[]> {
  const [products, lots] = await Promise.all([
    apiRequest<Product[]>("GET", "products?" + params({
      select: "id,house_id,name,brand,category,barcode,package_description,reorder_at,photo_path,notes",
      house_id: `eq.${houseId}`, order: "name.asc",
    })),
    apiRequest<StockLot[]>("GET", "stock_lots?" + params({
      select: "id,house_id,product_id,location_id,quantity,expires_on,purchased_on",
      house_id: `eq.${houseId}`,
    })),
  ]);
  return products.map((p) => {
    const productLots = lots.filter((lot) => lot.product_id === p.id);
    return {
      ...p, lots: productLots,
      total: productLots.reduce((sum, lot) => sum + Number(lot.quantity), 0),
    };
  });
}
export async function createProduct(data: {
  houseId: string; name: string; brand: string; category: string;
  packageDescription: string; reorderAt: number; quantity: number;
  locationId: string | null; expiresOn: string | null;
}): Promise<{ product: Product; lot: StockLot }> {
  const products = await apiRequest<Product[]>("POST", "products", {
    house_id: data.houseId, name: data.name.trim(), brand: data.brand.trim() || null,
    category: data.category.trim() || null,
    package_description: data.packageDescription.trim() || null,
    reorder_at: data.reorderAt,
    created_by: getSession()?.user.id,
  });
  const product = products[0];
  if (!product) throw new Error("Produto não cadastrado.");
  const lots = await apiRequest<StockLot[]>("POST", "stock_lots", {
    house_id: data.houseId, product_id: product.id, location_id: data.locationId,
    quantity: 0, expires_on: data.expiresOn,
  });
  const lot = lots[0];
  if (!lot) throw new Error("Produto cadastrado, mas sem lote de estoque.");
  if (data.quantity > 0) {
    await changeStock(lot.id, data.quantity, "ajuste");
    lot.quantity = data.quantity;
  }
  return { product, lot };
}
export async function changeStock(lotId: string, delta: number, reason: "compra" | "consumo" | "ajuste" | "descarte") {
  if (!Number.isFinite(delta) || delta === 0) throw new Error("Quantidade inválida.");
  return apiRequest<number>("POST", "rpc/change_stock", {
    p_lot_id: lotId, p_delta: delta, p_reason: reason,
  });
}

export async function uploadProductPhoto(_houseId: string, _productId: string, _file: File): Promise<string> {
  void _houseId; void _productId; void _file;
  throw new Error("Fotos indisponíveis nesta etapa da migração. Nenhum arquivo foi enviado.");
}
export async function signedProductPhoto(_path: string): Promise<string> {
  void _path;
  throw new Error("Fotos aguardam armazenamento privado.");
}
