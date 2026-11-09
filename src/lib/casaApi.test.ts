import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => ({
  getSession: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
}));
const databaseMock = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock("@neon/neon-js/supabase", () => ({
  createClient: vi.fn(() => ({ auth: authMock, ...databaseMock })),
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
    json: async () => body,
  };
}
beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  vi.stubEnv("VITE_NEON_URL", "https://ep-test.c-2.sa-east-1.aws.neon.tech/casa_nexo");
  authMock.getSession.mockReset().mockResolvedValue({ data: { session: fakeSession }, error: null });
  authMock.signInWithPassword.mockReset().mockResolvedValue({ data: { session: fakeSession }, error: null });
  authMock.signUp.mockReset().mockResolvedValue({ data: { user: fakeSession.user }, error: null });
  authMock.signOut.mockReset().mockResolvedValue({ error: null });
  databaseMock.from.mockReset().mockImplementation(() => ({
    select: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: [{ id: "casa-1", name: "Nossa Casa" }], error: null }) })),
  }));
  databaseMock.rpc.mockReset().mockResolvedValue({ data: "casa-123", error: null });
});
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
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
  it("recupera o alias técnico após a sessão de uma ativação parcial", async () => {
    const email = "matheus.setup.b01e85eb717de90d8603850a@users.casa-nexo.example";
    authMock.getSession.mockResolvedValueOnce({ data: {
      session: { ...fakeSession, user: { ...fakeSession.user, email } },
      user: { ...fakeSession.user, email },
    }, error: null });
    const { restoreSession } = await import("./casaApi");
    await restoreSession();
    expect(localStorage.getItem("casa-nexo-neon-identity-v1-matheus")).toBe(email);
  });
  it("faz login usando o provedor Neon Auth", async () => {
    const { login } = await import("./casaApi");
    await login("matheus@users.casa-nexo.example", "senha-temporaria");
    expect(authMock.signInWithPassword).toHaveBeenCalledWith({
      email: "matheus@users.casa-nexo.example", password: "senha-temporaria",
    });
  });
  it("consulta as Casas pelo cliente Neon que administra o JWT", async () => {
    const { getHouses } = await import("./casaApi");
    expect((await getHouses())[0].name).toBe("Nossa Casa");
    expect(databaseMock.from).toHaveBeenCalledWith("houses");
  });
  it("mantém API REST protegida por JWT sem chave Supabase", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response([]));
    vi.stubGlobal("fetch", fetchMock);
    const { apiRequest } = await import("./casaApi");
    await apiRequest("GET", "products?select=id");
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(".apirest.c-2.sa-east-1.aws.neon.tech/casa_nexo/rest/v1/products");
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
  it("envia fotos apenas pelo endpoint autenticado da Netlify", async () => {
    const path = "11111111-1111-4111-8111-111111111111/products/22222222-2222-4222-8222-222222222222-33333333-3333-4333-8333-333333333333.jpg";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ path }, 201))
      .mockResolvedValueOnce(response([]));
    vi.stubGlobal("fetch", fetchMock);
    const { uploadProductPhoto, signedProductPhoto } = await import("./casaApi");
    await expect(uploadProductPhoto("house", "product", new File(["x"], "x.jpg", { type: "image/jpeg" })))
      .resolves.toBe(path);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/.netlify/functions/product-photo");
    expect((options.headers as Record<string, string>).Authorization).toBe("Bearer neon-jwt-test");
    await expect(signedProductPhoto("other/path")).rejects.toThrow("inválido");
  });
  it("desativa a troca de senha legada até haver endpoint seguro", async () => {
    const { changePassword } = await import("./casaApi");
    await expect(changePassword("senha-antiga", "senha-nova")).rejects.toThrow("indisponível");
  });
  it("faz login pelo apelido em dispositivo novo, sem código de ativação", async () => {
    const alias = "matheus.setup.aaaaaaaaaaaaaaaaaaaaaaaa@users.casa-nexo.example";
    databaseMock.rpc.mockResolvedValueOnce({ data: alias, error: null });
    const { loginHousehold } = await import("./casaApi");
    await loginHousehold("MATHEUS", "senhaPrivada1234!");
    expect(databaseMock.rpc).toHaveBeenCalledWith("household_login_email", { p_username: "matheus" });
    expect(authMock.signInWithPassword).toHaveBeenCalledWith({
      email: alias, password: "senhaPrivada1234!",
    });
    expect(localStorage.getItem("casa-nexo-neon-identity-v1-matheus")).toBe(alias);
    expect(JSON.stringify(localStorage)).not.toContain("senhaPrivada1234!");
  });
  it("não cria contas quando a senha de ativação é fraca", async () => {
    const { activateHouseholdAccount } = await import("./casaApi");
    await expect(activateHouseholdAccount("matheus", "codigo_teste", "abc"))
      .rejects.toThrow("8 caracteres");
    expect(authMock.signUp).not.toHaveBeenCalled();
  });
  it("não resolve usuários fora da lista fechada de moradores", async () => {
    const { lookupHouseholdEmail } = await import("./casaApi");
    await expect(lookupHouseholdEmail("intruso")).rejects.toThrow("Usuário inválido");
  });

  it("registra a senha no Neon e vincula a Casa somente após confirmação pelo banco", async () => {
    databaseMock.from.mockImplementationOnce(() => ({
      select: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: [], error: null }) })),
    }));
    const digest = new Uint8Array(32).fill(0xab);
    vi.stubGlobal("crypto", { subtle: { digest: vi.fn().mockResolvedValue(digest.buffer) } });

    const { activateHouseholdAccount } = await import("./casaApi");
    await activateHouseholdAccount("matheus", "codigo-ficticio", "SenhaLongaPrivada123!");
    expect(authMock.signUp).toHaveBeenCalledWith(expect.objectContaining({
      email: "matheus.setup.abababababababababababab@users.casa-nexo.example",
      password: "SenhaLongaPrivada123!",
    }));
    expect(databaseMock.rpc).toHaveBeenCalledWith("claim_household_activation", {
      p_username: "matheus", p_code: "codigo-ficticio",
    });
    expect(localStorage.getItem("casa-nexo-neon-identity-v1-matheus"))
      .toBe("matheus.setup.abababababababababababab@users.casa-nexo.example");
    expect(JSON.stringify(localStorage)).not.toContain("SenhaLongaPrivada123!");
    expect(JSON.stringify(localStorage)).not.toContain("codigo-ficticio");
  });
  it("retoma ativação já vinculada sem criar uma segunda Casa", async () => {
    const digest = new Uint8Array(32).fill(0xab);
    vi.stubGlobal("crypto", { subtle: { digest: vi.fn().mockResolvedValue(digest.buffer) } });
    const { activateHouseholdAccount } = await import("./casaApi");
    await activateHouseholdAccount("matheus", "codigo-ficticio", "SenhaLongaPrivada123!");
    expect(databaseMock.from).toHaveBeenCalledWith("houses");
    expect(databaseMock.rpc).not.toHaveBeenCalled();
    expect(localStorage.getItem("casa-nexo-neon-identity-v1-matheus"))
      .toBe("matheus.setup.abababababababababababab@users.casa-nexo.example");
  });
  it("não mantém sessão após logout", async () => {
    const { getSession, login, logout } = await import("./casaApi");
    await login("matheus@users.casa-nexo.example", "senha");
    expect(getSession()).not.toBeNull();
    await logout();
    expect(getSession()).toBeNull();
  });
});
