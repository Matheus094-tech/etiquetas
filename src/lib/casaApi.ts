/** Casa Nexo API: acesso ao Supabase via REST, sem credenciais de servidor no cliente. */
export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
const API_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || import.meta.env.VITE_SUPABASE_ANON_KEY || "";
export const casaConfigured = Boolean(SUPABASE_URL && API_KEY);
const SESSION_KEY = "casa-nexo-auth-session-v1";

export type Session = {
  access_token: string;
  refresh_token: string;
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

function readSession(): Session | null {
  try {
    const value = localStorage.getItem(SESSION_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as Session;
    return parsed.access_token && parsed.refresh_token && parsed.user?.id ? parsed : null;
  } catch {
    return null;
  }
}

let session: Session | null = typeof window === "undefined" ? null : readSession();
const listeners = new Set<(current: Session | null) => void>();
export function getSession() { return session; }
export function onSessionChange(listener: (current: Session | null) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
function saveSession(next: Session | null) {
  session = next;
  if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  else localStorage.removeItem(SESSION_KEY);
  listeners.forEach((listener) => listener(next));
}
function fromAuthResponse(raw: {
  access_token: string; refresh_token: string; expires_in: number;
  user: { id: string; email?: string };
}): Session {
  return {
    access_token: raw.access_token,
    refresh_token: raw.refresh_token,
    expires_at: Date.now() + raw.expires_in * 1000,
    user: raw.user,
  };
}
async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.text();
  let result: unknown = null;
  try { result = body ? JSON.parse(body) : null; } catch { result = body; }
  if (!response.ok) {
    const detail = result && typeof result === "object"
      ? result as Record<string, unknown> : {};
    const reason = detail.msg || detail.message || detail.error_description || detail.error;
    throw new Error(typeof reason === "string" ? reason : `Erro HTTP ${response.status}`);
  }
  return result as T;
}
async function authRequest<T>(path: string, data: unknown, token?: string): Promise<T> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: API_KEY,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  return parseResponse<T>(response);
}
type AuthPayload = {
  access_token: string; refresh_token: string; expires_in: number;
  user: { id: string; email?: string };
};
export async function login(email: string, password: string) {
  const result = await authRequest<AuthPayload>(
    "token?grant_type=password", { email, password }
  );
  saveSession(fromAuthResponse(result));
}
export async function register(email: string, password: string) {
  const result = await authRequest<Partial<AuthPayload>>("signup", { email, password });
  if (result.access_token && result.refresh_token && result.expires_in && result.user) {
    saveSession(fromAuthResponse(result as AuthPayload));
    return true;
  }
  return false; // Confirmação de e-mail exigida no projeto Supabase.
}
let refreshPromise: Promise<void> | null = null;
async function refreshSession() {
  if (!session) throw new Error("Entre na sua conta.");
  if (!refreshPromise) {
    const refreshToken = session.refresh_token;
    refreshPromise = (async () => {
      try {
        const result = await authRequest<AuthPayload>(
          "token?grant_type=refresh_token", { refresh_token: refreshToken }
        );
        saveSession(fromAuthResponse(result));
      } catch {
        saveSession(null);
        throw new Error("Sua sessão expirou. Entre novamente.");
      }
    })().finally(() => { refreshPromise = null; });
  }
  await refreshPromise;
}
export async function validAccessToken(): Promise<string> {
  if (!session) throw new Error("Entre na sua conta.");
  if (session.expires_at <= Date.now() + 60_000) await refreshSession();
  if (!session) throw new Error("Sua sessão expirou.");
  return session.access_token;
}
/** Troca a senha da conta autenticada, sem usar e-mail de recuperação. */
export async function changePassword(currentPassword: string, nextPassword: string) {
  const current = getSession();
  if (!current?.user.email) throw new Error("Entre novamente na sua conta.");
  if (nextPassword.length < 12) throw new Error("A nova senha deve ter pelo menos 12 caracteres.");
  if (nextPassword === currentPassword) throw new Error("Escolha uma senha diferente da anterior.");

  // Verifica a senha atual na API de autenticação antes de permitir a troca.
  const verified = await authRequest<AuthPayload>(
    "token?grant_type=password",
    { email: current.user.email, password: currentPassword },
  );
  if (verified.user.id !== current.user.id) {
    throw new Error("Falha ao validar a identidade da conta.");
  }
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: "PUT",
    headers: {
      apikey: API_KEY,
      Authorization: `Bearer ${await validAccessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password: nextPassword, current_password: currentPassword }),
  });
  await parseResponse(response);
}

export async function logout() {
  const token = session?.access_token;
  saveSession(null);
  if (token) {
    try { await authRequest("logout", {}, token); } catch { /* sessão local já removida */ }
  }
}
export async function apiRequest<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  const token = await validAccessToken();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: API_KEY,
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      Prefer: "return=representation",
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (response.status === 401) saveSession(null);
  return parseResponse<T>(response);
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
const BUCKET = "household-media";
function objectPath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}
export async function uploadProductPhoto(houseId: string, productId: string, file: File) {
  const formats: Record<string, string> = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic",
  };
  const extension = formats[file.type];
  if (!extension) throw new Error("Use uma fotografia JPG, PNG ou WebP (HEIC suportado quando aceito pelo navegador).");
  if (file.size > 8 * 1024 * 1024) throw new Error("A foto deve ter até 8 MB.");
  const path = `${houseId}/products/${productId}-${crypto.randomUUID()}.${extension}`;
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath(path)}`, {
    method: "POST",
    headers: {
      apikey: API_KEY,
      Authorization: `Bearer ${await validAccessToken()}`,
      "Content-Type": file.type,
      "x-upsert": "false",
    },
    body: file,
  });
  await parseResponse(response);
  try {
    await apiRequest("PATCH", "products?" + params({ id: `eq.${productId}`, house_id: `eq.${houseId}` }), {
      photo_path: path,
    });
  } catch (error) {
    // Remover um upload órfão em caso de falha ao associar produto.
    await deleteProductPhoto(path).catch(() => {});
    throw error;
  }
  return path;
}
async function deleteProductPhoto(path: string) {
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath(path)}`, {
    method: "DELETE",
    headers: { apikey: API_KEY, Authorization: `Bearer ${await validAccessToken()}` },
  });
  await parseResponse(response);
}
export async function signedProductPhoto(path: string) {
  const token = await validAccessToken();
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/${objectPath(path)}`, {
    method: "POST",
    headers: {
      apikey: API_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn: 600 }),
  });
  const data = await parseResponse<{ signedURL: string }>(response);
  return new URL(data.signedURL.startsWith("/storage/v1/")
    ? data.signedURL
    : `/storage/v1${data.signedURL}`, SUPABASE_URL).toString();
}
