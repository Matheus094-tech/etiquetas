import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authPayload = {
  access_token: "access-test", refresh_token: "refresh-test",
  expires_in: 3600, user: { id: "user-123", email: "morador@example.com" },
};
function jsonResponse(value: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(value) };
}
beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  vi.stubEnv("VITE_SUPABASE_URL", "https://projeto-teste.supabase.co");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  localStorage.clear();
});

describe("Casa Nexo API", () => {
  it("não cria sessão antes da confirmação por e-mail", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: "user-123" }));
    vi.stubGlobal("fetch", fetchMock);
    const { getSession, register } = await import("./casaApi");
    expect(await register("morador@example.com", "senhaSegura123")).toBe(false);
    expect(getSession()).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("usa o JWT do morador ao consultar Casas", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(authPayload))
      .mockResolvedValueOnce(jsonResponse([{ id: "casa-123", name: "Nossa Casa" }]));
    vi.stubGlobal("fetch", fetchMock);
    const { getSession, login, getHouses } = await import("./casaApi");
    await login("morador@example.com", "senhaSegura123");
    expect(getSession()?.user.id).toBe("user-123");
    expect((await getHouses())[0].name).toBe("Nossa Casa");
    const request = fetchMock.mock.calls[1][1] as RequestInit;
    const headers = request.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer access-test");
    expect(headers.apikey).toBe("sb_publishable_test");
  });

  it("recusa movimentação vazia sem chamar o servidor", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { changeStock } = await import("./casaApi");
    await expect(changeStock("lot-123", 0, "ajuste")).rejects.toThrow("Quantidade inválida");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("encerra a sessão local ao sair, mesmo se o servidor falhar", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse(authPayload))
      .mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);
    const { login, logout, getSession } = await import("./casaApi");
    await login("morador@example.com", "senhaSegura123");
    await logout();
    expect(getSession()).toBeNull();
    expect(localStorage.getItem("casa-nexo-auth-session-v1")).toBeNull();
  });
});
