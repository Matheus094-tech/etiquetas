import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  getSession: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("@neon/neon-js/auth/react/adapters", () => ({
  BetterAuthReactAdapter: vi.fn(() => ({})),
}));
vi.mock("@neon/neon-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signIn: { email: mocks.signIn },
      getSession: mocks.getSession,
      signOut: mocks.signOut,
    },
  })),
}));

const testSession = {
  data: {
    session: { access_token: "eyJ.test.jwt", expires_at: Date.now() + 900_000 },
    user: { id: "user-123", email: "morador@example.com" },
  },
  error: null,
};
function response(data: unknown, status = 200) {
  return { ok: status < 400, status, text: async () => JSON.stringify(data) };
}
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv("VITE_NEON_DATABASE_URL", "https://example.c-2.sa-east-1.aws.neon.tech/casa_nexo");
  vi.stubEnv("VITE_NEON_DATA_API_URL", "https://example.apirest.c-2.sa-east-1.aws.neon.tech/casa_nexo/rest/v1");
  mocks.signIn.mockResolvedValue({ data: testSession.data, error: null });
  mocks.getSession.mockResolvedValue(testSession);
  mocks.signOut.mockResolvedValue({ error: null });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  localStorage.clear();
});

describe("Neon Casa Nexo API", () => {
  it("autentica pelo Neon Auth sem gerenciar senhas no localStorage", async () => {
    const { login, getSession } = await import("./casaApi");
    await login("morador@example.com", "senhaTemporaria123!");
    expect(mocks.signIn).toHaveBeenCalledWith({
      email: "morador@example.com", password: "senhaTemporaria123!",
    });
    expect(getSession()?.user.id).toBe("user-123");
    expect(localStorage.getItem("casa-nexo-auth-session-v1")).toBeNull();
  });

  it("envia JWT à Neon Data API; nunca utiliza chave de administrador", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response([{ id: "casa-123", name: "Nossa Casa" }]));
    vi.stubGlobal("fetch", fetchMock);
    const { getHouses } = await import("./casaApi");
    const houses = await getHouses();
    expect(houses[0].name).toBe("Nossa Casa");
    expect(fetchMock.mock.calls[0][0]).toContain(".apirest.");
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer eyJ.test.jwt");
    expect(headers).not.toHaveProperty("apikey");
  });

  it("recusa movimentação vazia sem chamadas", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { changeStock } = await import("./casaApi");
    await expect(changeStock("lot-123", 0, "ajuste")).rejects.toThrow("Quantidade inválida");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("não simula sucesso de troca de senha não suportada", async () => {
    const { changePassword } = await import("./casaApi");
    await expect(changePassword("anterior", "posterior1234")).rejects.toThrow("temporariamente indisponível");
  });

  it("encerra sessão por Neon Auth e limpa o estado em memória", async () => {
    const { login, logout, getSession } = await import("./casaApi");
    await login("morador@example.com", "senhaTemporaria123!");
    await logout();
    expect(mocks.signOut).toHaveBeenCalledOnce();
    expect(getSession()).toBeNull();
  });
});
