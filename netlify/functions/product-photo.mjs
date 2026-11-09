import { getStore } from "@netlify/blobs";

/**
 * Fotos privadas do Casa Nexo.
 * Neon Data API autentica JWT e aplica RLS ANTES de tocar no blob.
 * Não é possível enumerar/listar o armazenamento por esta função.
 */
const PHOTO_STORE = "casa-nexo-product-photos";
const MAX_BYTES = 8 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mediaType(buffer) {
  const bytes = new Uint8Array(buffer);
  const begins = (...sequence) => sequence.every((byte, index) => bytes[index] === byte);
  if (bytes.length < 12) return null;
  if (begins(0xff, 0xd8, 0xff)) return { type: "image/jpeg", extension: "jpg" };
  if (begins(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) {
    return { type: "image/png", extension: "png" };
  }
  const ascii = (start, length) => String.fromCharCode(...bytes.slice(start, start + length));
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    return { type: "image/webp", extension: "webp" };
  }
  return null;
}
function textError(status, message) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}
function neonUrl() {
  const base = process.env.VITE_NEON_URL;
  if (!base) throw new Error("NEON URL not configured for Functions");
  const parsed = new URL(base);
  // Endpoints em São Paulo expõem .apirest. para a Data API.
  parsed.hostname = parsed.hostname.replace(".c-2.", ".apirest.c-2.");
  parsed.pathname = parsed.pathname.replace(/\/$/, "") + "/rest/v1";
  return parsed.toString().replace(/\/$/, "");
}
async function authenticatedProduct(request, houseId, productId) {
  const bearer = request.headers.get("Authorization");
  if (!bearer || !/^Bearer [A-Za-z0-9_\-.]+$/.test(bearer)) {
    return { error: textError(401, "Entre na sua conta.") };
  }
  const qs = new URLSearchParams({
    select: "id,house_id,photo_path",
    house_id: `eq.${houseId}`,
    id: `eq.${productId}`,
  });
  let resp;
  try {
    resp = await fetch(`${neonUrl()}/products?${qs}`, {
      headers: { Authorization: bearer, Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return { error: textError(503, "Autorização temporariamente indisponível.") };
  }
  if (!resp.ok) return { error: textError(401, "Sessão inválida ou sem autorização.") };
  const rows = await resp.json();
  if (!Array.isArray(rows) || rows.length !== 1) {
    return { error: textError(404, "Produto não encontrado ou sem permissão.") };
  }
  return { product: rows[0] };
}
export default async function handler(request) {
  const url = new URL(request.url);
  const houseId = url.searchParams.get("house_id") || "";
  const productId = url.searchParams.get("product_id") || "";
  if (!UUID.test(houseId) || !UUID.test(productId)) {
    return textError(400, "Identificador inválido.");
  }
  if (request.method !== "GET" && request.method !== "POST") {
    return textError(405, "Método não permitido.");
  }
  const access = await authenticatedProduct(request, houseId, productId);
  if (access.error) return access.error;
  const store = getStore(PHOTO_STORE);

  if (request.method === "POST") {
    const length = Number(request.headers.get("content-length") || 0);
    if (length > MAX_BYTES) return textError(413, "Fotografia acima de 8 MB.");
    const data = await request.arrayBuffer();
    if (!data.byteLength || data.byteLength > MAX_BYTES) return textError(413, "Fotografia deve ter até 8 MB.");
    const type = mediaType(data);
    if (!type || request.headers.get("content-type") !== type.type) {
      return textError(415, "Envie JPG, PNG ou WebP válido.");
    }
    const key = `${houseId}/products/${productId}-${crypto.randomUUID()}.${type.extension}`;
    await store.set(key, data, { onlyIfNew: true, metadata: { contentType: type.type } });
    return Response.json({ path: key }, { status: 201, headers: { "Cache-Control": "no-store" } });
  }

  const key = url.searchParams.get("path") || "";
  if (!key || key !== access.product.photo_path ||
    !key.startsWith(`${houseId}/products/${productId}-`)) {
    return textError(404, "Fotografia não encontrada.");
  }
  const record = await store.getWithMetadata(key, { type: "arrayBuffer" });
  if (!record) return textError(404, "Fotografia não encontrada.");
  const contentType = record.metadata?.contentType || "application/octet-stream";
  return new Response(record.data, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
