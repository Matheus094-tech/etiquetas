import { describe, expect, it } from "vitest";
import { displayUsername, emailForUsername, normalizeHouseholdUsername } from "./householdUsers";

describe("Acesso por nome de usuário", () => {
  it("normaliza espaços e caixa sem aceitar contas arbitrárias", () => {
    expect(normalizeHouseholdUsername("  MaThEuS  ")).toBe("matheus");
    expect(emailForUsername("  MATHEUS ")).toBe("matheus@users.casa-nexo.example");
    expect(emailForUsername("stephany")).toBe("stephany@users.casa-nexo.example");
  });
  it("não permite usar outro usuário ou e-mail diretamente no login da Casa", () => {
    expect(() => emailForUsername("outro")).toThrow("Usuário ou senha incorretos.");
    expect(() => emailForUsername("admin@exemplo.com")).toThrow("Usuário ou senha incorretos.");
    expect(() => emailForUsername("__proto__")).toThrow("Usuário ou senha incorretos.");
  });
  it("não mostra identificadores técnicos no aplicativo", () => {
    expect(displayUsername("matheus@users.casa-nexo.example")).toBe("Matheus");
    expect(displayUsername("stephany@users.casa-nexo.example")).toBe("Stephany");
    expect(displayUsername()).toBe("Morador");
    expect(displayUsername("outro@example.com")).toBe("Morador");
  });
});
