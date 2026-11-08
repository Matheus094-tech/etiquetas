/**
 * Casa Nexo: Neon Managed Better Auth + Neon Data API.
 * Nenhuma credencial PostgreSQL, chave administrativa ou senha fica no navegador.
 * Tokens são geridos pelo SDK Neon. A Data API usa JWT + RLS.
 */
import { createClient } from "@neon/neon-js";
import { BetterAuthReactAdapter } from "@neon/neon-js/auth/react/adapters";

const NEON_DATABASE_URL = (import.meta.env.VITE_NEON_DATABASE_URL ?? "").replace(/\/$/, "");
const NEON_DATA_API_URL = (import.meta.env.VITE_NEON_DATA_API_URL ?? "").replace(/\/$/, "");

export const casaConfigured = Boolean(NEON_DATABASE_URL && NEON_DATA_API_URL);
const neon = casaConfigured
  ? createClient(NEON_DATABASE_URL, { auth: { adapter: BetterAuthReactAdapter() } })
  : null;

export type Session = {
  access_token: string;
  user: { id: string; email?: string };
};
export type House = { id: string; name: string; created_at: string };
export type Location = { id: string; house_id: string; name: string; kind: string; parent_id: string | null };
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
let lastSessionFailure = "";
const listeners = new Set<(value: Session | null) => void>();
export function getSession(): Session | null { return session; }
export function onSessionChange(listener: (value: Session | null) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
function publishSession(value: Session | null) {
  session = value;
  listeners.forEach((listener) => listener(value));
}
function requireClient() {
  if (!neon) throw new Error("Banco Neon não configurado neste ambiente.");
  return neon;
}
function unwrapError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string") return new Error(message);
  }
  return new Error(fallback);
}

/** Revalida a sessão com Neon; a biblioteca renova o token automaticamente. */
export async function initializeSession(): Promise<Session | null> {
  if (!casaConfigured) { publishSession(null); return null; }
  try {
    const { data, error } = await requireClient().auth.getSession();
    if (error || !data?.user || !data.session) {
      lastSessionFailure = error?.message || `Sessão incompleta (usuário: ${Boolean(data?.user)}, sessão: ${Boolean(data?.session)}).`;
      publishSession(null);
      return null;
    }
    const token = (data.session as unknown as { access_token?: string }).access_token;
    if (!token) {
      lastSessionFailure = `A sessão retornou sem JWT (campos: ${Object.keys(data.session).filter((key) => !/token|secret|key/i.test(key)).join(", ") || "nenhum público"}).`;
      publishSession(null);
      return null;
    }
    const next: Session = {
      access_token: token,
      user: { id: data.user.id, email: data.user.email },
    };
    lastSessionFailure = "";
    publishSession(next);
    return next;
  } catch (reason) {
    lastSessionFailure = reason instanceof Error ? reason.message : "Falha ao validar sessão.";
    publishSession(null);
    return null;
  }
}
export async function login(email: string, password: string): Promise<void> {
  const { error } = await requireClient().auth.signIn.email({ email, password });
  if (error) throw unwrapError(error, "Usuário ou senha incorretos.");
  const active = await initializeSession();
  if (!active) throw new Error(lastSessionFailure || "Não foi possível estabelecer a sessão. Entre novamente.");
}
export async function logout() {
  try {
    if (neon) await neon.auth.signOut();
  } finally {
    publishSession(null);
  }
}
export async function validAccessToken(): Promise<string> {
  // Não confiar num JWT persistido por nosso código. O Neon SDK gerencia sessão/refresh.
  const active = await initializeSession();
  if (!active) throw new Error("Sua sessão expirou. Entre novamente.");
  return active.access_token;
}
/**
 * Neon Managed Better Auth exige um fluxo verificado de redefinição.
 * Nunca atualizar neon_auth.account por SQL nem simular sucesso.
 */
export async function changePassword(currentPassword: string, nextPassword: string): Promise<never> {
  void currentPassword; void nextPassword;
  throw new Error("Troca de senha temporariamente indisponível. A recuperação precisa ser configurada pelo administrador do Neon.");
}

async function parseResponse<T>(response: Response): Promise<T> {
  const raw = await response.text();
  let result: unknown;
  try { result = raw ? JSON.parse(raw) : null; } catch { result = raw; }
  if (!response.ok) {
    const object = result && typeof result === "object" ? result as Record<string, unknown> : {};
    const message = object.message ?? object.error ?? object.details;
    throw new Error(typeof message === "string" ? message : `Erro HTTP ${response.status}`);
  }
  return result as T;
}
export async function apiRequest<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string, body?: unknown,
): Promise<T> {
  const token = await validAccessToken();
  const response = await fetch(`${NEON_DATA_API_URL}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      Prefer: "return=representation",
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (response.status === 401) publishSession(null);
  return parseResponse<T>(response);
}
function params(values: Record<string, string>) { return new URLSearchParams(values).toString(); }

export async function getHouses() {
  return apiRequest<House[]>("GET", "houses?" + params({
    select: "id,name,created_at", order: "created_at.asc",
  }));
}
export async function createHouse(name: string) {
  const user = (await initializeSession())?.user;
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
  return products.map((product) => {
    const productLots = lots.filter((lot) => lot.product_id === product.id);
    return {
      ...product, lots: productLots,
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
    house_id: data.houseId,
    name: data.name.trim(), brand: data.brand.trim() || null,
    category: data.category.trim() || null,
    package_description: data.packageDescription.trim() || null,
    reorder_at: data.reorderAt,
    created_by: (await initializeSession())?.user.id,
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
export async function changeStock(
  lotId: string, delta: number, reason: "compra" | "consumo" | "ajuste" | "descarte",
) {
  if (!Number.isFinite(delta) || delta === 0) throw new Error("Quantidade inválida.");
  return apiRequest<number>("POST", "rpc/change_stock", {
    p_lot_id: lotId, p_delta: delta, p_reason: reason,
  });
}

function validatePhoto(file: File) {
  const formats: Record<string, string> = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  };
  const extension = formats[file.type];
  if (!extension) throw new Error("Envie uma foto JPG, PNG ou WebP.");
  if (file.size > 4 * 1024 * 1024) throw new Error("Reduza a fotografia para até 4 MB.");
  return extension;
}

/**
 * Netlify Blobs: a Function verifica JWT Neon e membership via RLS antes de
 * acessar o blob. NUNCA publica imagens diretamente no CDN.
 */
export async function uploadProductPhoto(houseId: string, productId: string, file: File) {
  const extension = validatePhoto(file);
  const path = `${houseId}/products/${productId}-${crypto.randomUUID()}.${extension}`;
  const response = await fetch(
    `/.netlify/functions/house-photo?houseId=${encodeURIComponent(houseId)}&productId=${encodeURIComponent(productId)}&path=${encodeURIComponent(path)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${await validAccessToken()}`,
        "Content-Type": file.type,
      },
      body: file,
    },
  );
  await parseResponse(response);
  try {
    await apiRequest("PATCH", "products?" + params({
      id: `eq.${productId}`, house_id: `eq.${houseId}`,
    }), { photo_path: path });
  } catch (error) {
    await fetch("/.netlify/functions/house-photo?" + params({ houseId, productId, path }), {
      method: "DELETE", headers: { Authorization: `Bearer ${await validAccessToken()}` },
    }).catch(() => {});
    throw error;
  }
  return path;
}
/** Retorna object URL temporária; o hook revoga URLs antigas. */
export async function signedProductPhoto(path: string): Promise<string> {
  const response = await fetch(
    `/.netlify/functions/house-photo?path=${encodeURIComponent(path)}`,
    { headers: { Authorization: `Bearer ${await validAccessToken()}` } },
  );
  if (!response.ok) await parseResponse(response);
  const image = await response.blob();
  return URL.createObjectURL(image);
}
