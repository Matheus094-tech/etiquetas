/**
 * Authenticated photo gateway: Neon JWT + PostgREST RLS -> Netlify Blobs.
 *
 * No blob is publicly routable, and the caller cannot select an arbitrary
 * storage key. Preview and production stores are isolated from one another.
 */
import { getStore } from "@netlify/blobs";
import { createRemoteJWKSet, jwtVerify } from "jose";

const API_URL =
  process.env.NEON_DATA_API_URL ||
  "https://ep-dark-darkness-b6wnyw96.apirest.c-2.sa-east-1.aws.neon.tech/casa_nexo/rest/v1";
const JWKS_URL =
  process.env.NEON_JWKS_URL ||
  "https://ep-dark-darkness-b6wnyw96.neonauth.c-2.sa-east-1.aws.neon.tech/casa_nexo/auth/.well-known/jwks.json";

const verifyKey = createRemoteJWKSet(new URL(JWKS_URL));
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };
const MAX_BYTES = 4 * 1024 * 1024;

function fail(code, message) {
  return new Response(JSON.stringify({ message }), {
    status: code,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
function credentials(request) {
  const authorization = request.headers.get("Authorization") || "";
  const match = /^Bearer (\S+)$/.exec(authorization);
  return match?.[1] || null;
}
function parsePhotoPath(path) {
  if (!path) return null;
  const match = /^([a-f\d-]{36})\/products\/([a-f\d-]{36})-([a-f\d-]{36})\.(jpg|png|webp)$/i.exec(path);
  if (!match || !UUID.test(match[1]) || !UUID.test(match[2]) || !UUID.test(match[3])) {
    return null;
  }
  return { houseId: match[1], productId: match[2], type: TYPES[match[4].toLowerCase()] };
}
function openStore() {
  const isProduction = process.env.CONTEXT === "production";
  return getStore(isProduction ? "casa-photos-production" : "casa-photos-preview");
}

export default async function handler(request) {
  if (!["GET", "PUT", "DELETE"].includes(request.method)) {
    return fail(405, "Método não permitido.");
  }
  const token = credentials(request);
  if (!token) return fail(401, "É preciso entrar na sua conta.");
  try {
    const { payload } = await jwtVerify(token, verifyKey, {
      algorithms: ["ES256", "RS256", "EdDSA"],
    });
    if (!payload.sub || payload.role !== "authenticated") {
      return fail(403, "Sessão sem autorização.");
    }
  } catch {
    return fail(401, "Sessão inválida ou expirada.");
  }

  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  const target = parsePhotoPath(path);
  if (!target) return fail(400, "Caminho da foto inválido.");

  const houseId = url.searchParams.get("houseId");
  const productId = url.searchParams.get("productId");
  if (request.method !== "GET" && (houseId !== target.houseId || productId !== target.productId)) {
    return fail(400, "Produto não corresponde ao caminho informado.");
  }

  // Authorization is enforced by the same Postgres RLS as the browser.
  // A user who is not a member of the House will see no product rows.
  const query = new URLSearchParams({
    select: "id,photo_path",
    id: `eq.${target.productId}`,
    house_id: `eq.${target.houseId}`,
    limit: "1",
  });
  const permissionResponse = await fetch(`${API_URL}/products?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null);
  if (!permissionResponse?.ok) return fail(503, "Não foi possível verificar permissão da fotografia.");
  let authorized = [];
  try { authorized = await permissionResponse.json(); } catch { /* deny */ }
  if (!Array.isArray(authorized) || authorized.length !== 1) return fail(403, "Sem acesso à fotografia.");
  if (request.method === "GET" && authorized[0].photo_path !== path) {
    return fail(404, "Fotografia não encontrada.");
  }

  const store = openStore();
  if (request.method === "PUT") {
    if (request.headers.get("Content-Type") !== target.type) {
      return fail(415, "Formato de imagem inválido.");
    }
    if (Number(request.headers.get("Content-Length") || 0) > MAX_BYTES) {
      return fail(413, "Fotografia acima do limite de 4 MB.");
    }
    const buffer = await request.arrayBuffer();
    if (buffer.byteLength < 1 || buffer.byteLength > MAX_BYTES) {
      return fail(413, "Fotografia vazia ou acima de 4 MB.");
    }
    const bytes = new Uint8Array(buffer);
    const isJpg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const isPng = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
    const isWebp = bytes[0] === 82 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 70
      && bytes[8] === 87 && bytes[9] === 69 && bytes[10] === 66 && bytes[11] === 80;
    if (!(target.type === "image/jpeg" && isJpg
      || target.type === "image/png" && isPng
      || target.type === "image/webp" && isWebp)) {
      return fail(415, "Conteúdo não corresponde a um arquivo de imagem válido.");
    }
    await store.set(path, buffer, { onlyIfNew: true });
    return new Response(JSON.stringify({ path }), {
      status: 201,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
  if (request.method === "DELETE") {
    await store.delete(path);
    return new Response(null, { status: 204 });
  }
  const image = await store.get(path, { type: "arrayBuffer", consistency: "strong" });
  if (!image) return fail(404, "Fotografia não encontrada.");
  return new Response(image, {
    headers: {
      "Content-Type": target.type,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
