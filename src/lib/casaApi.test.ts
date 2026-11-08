import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => ({
  getSession: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("@neon/neon-js/supabase", () => ({
  createClient: vi.fn(() => ({ auth: authMock })),
}));
const fakeSession = {
  access_token: "neon-jwt-test",
  expires_at: Math.floor(Date.now() / 1000) + 900,
  user: { id: "user-123", email: "matheus@users.casa-nexo.example" },
};
function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  };
}
beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("VITE_NEON_URL", "https://ep-test.c-2.sa-east-1.aws.neon.tech/casa_nexo");
  authMock.getSession.mockReset().mockResolvedValue({ data: { session: fakeSession }, error: null });
  authMock.signInWithPassword.mockReset().mockResolvedValue({ data: { session: fakeSession }, error: null });
  authMock.signOut.mockReset().mockResolvedValue({ error: null });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("Casa Nexo no Neon", () => {
  it("restaura sessão com JWT do Neon", async () => {
    const { getSession, restoreSession } = await import("./casaApi");
    expect(getSession()).toBeNull();
    await restoreSession();
    expect(getSession()?.user.id).toBe("user-123");
    expect(getSession()?.access_token).toBe("neon-jwt-test");
  });
  it("faz login usando o provedor Neon Auth", async () => {
    const { login } = await import("./casaApi");
    await login("matheus@users.casa-nexo.example", "senha-temporaria");
    expect(authMock.signInWithPassword).toHaveBeenCalledWith({
      email: "matheus@users.casa-nexo.example", password: "senha-temporaria",
    });
  });
  it("usa JWT sem chave Supabase e a URL correta da Data API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response([{ id: "casa-1", name: "Nossa Casa" }]));
    vi.stubGlobal("fetch", fetchMock);
    const { getHouses } = await import("./casaApi");
    expect((await getHouses())[0].name).toBe("Nossa Casa");
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(".apirest.c-2.sa-east-1.aws.neon.tech/casa_nexo/rest/v1/houses");
    expect((options.headers as Record<string, string>).Authorization).toBe("Bearer neon-jwt-test");
    expect((options.headers as Record<string, string>)).not.toHaveProperty("apikey");
  });
  it("não movimenta quantidade nula", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { changeStock } = await import("./casaApi");
    await expect(changeStock("lote", 0, "ajuste")).rejects.toThrow("Quantidade inválida");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("falha de forma segura ao tentar enviar fotos sem storage", async () => {
    const { uploadProductPhoto, signedProductPhoto } = await import("./casaApi");
    await expect(uploadProductPhoto("house", "product", new File(["x"], "x.jpg", { type: "image/jpeg" })))
      .rejects.toThrow("Fotos indisponíveis");
    await expect(signedProductPhoto("path")).rejects.toThrow("aguardam armazenamento");
  });
  it("desativa a troca de senha legada até haver endpoint seguro", async () => {
    const { changePassword } = await import("./casaApi");
    await expect(changePassword("senha-antiga", "senha-nova")).rejects.toThrow("indisponível");
  });
  it("não mantém sessão após logout", async () => {
    const { getSession, login, logout } = await import("./casaApi");
    await login("matheus@users.casa-nexo.example", "senha");
    expect(getSession()).not.toBeNull();
    await logout();
    expect(getSession()).toBeNull();
  });
});
