/**
 * Login simplificado do Casa Nexo.
 *
 * Neon Auth usa um identificador técnico de e-mail para autenticar com senha.
 * Os endereços abaixo são identificadores técnicos RESERVADOS (domínio .example),
 * sem caixa de e-mail e sem possibilidade de recuperação automática.
 * Nunca armazenar senhas neste arquivo nem no frontend.
 *
 * As contas ativas são criadas pelo morador com código único e Neon Auth.
 */
export const HOUSEHOLD_USERNAMES = ["matheus", "stephany"] as const;
export type HouseholdUsername = (typeof HOUSEHOLD_USERNAMES)[number];

const IDENTITIES: Record<HouseholdUsername, string> = {
  matheus: "matheus@users.casa-nexo.example",
  stephany: "stephany@users.casa-nexo.example",
};

export function normalizeHouseholdUsername(value: string): string {
  return value.trim().toLocaleLowerCase("pt-BR");
}

export function emailForUsername(value: string): string {
  const username = normalizeHouseholdUsername(value);
  if (!Object.hasOwn(IDENTITIES, username)) {
    throw new Error("Usuário ou senha incorretos.");
  }
  return IDENTITIES[username as HouseholdUsername];
}

export function displayUsername(email?: string): string {
  if (!email) return "Morador";
  const match = HOUSEHOLD_USERNAMES.find((username) =>
    IDENTITIES[username] === email.toLowerCase() ||
    email.toLowerCase().startsWith(`${username}.setup.`) ||
    email.toLowerCase().startsWith(`${username}.login@`));
  return match ? match.charAt(0).toUpperCase() + match.slice(1) : "Morador";
}

/** Alias técnico não adivinhável antes da ativação: o código aleatório
 * fica fora do código-fonte e só seu SHA-256 parcial aparece no alias.
 */
export async function activationEmail(value: string, code: string): Promise<string> {
  const username = normalizeHouseholdUsername(value);
  if (!HOUSEHOLD_USERNAMES.includes(username as HouseholdUsername)) {
    throw new Error("Morador inválido.");
  }
  const data = new TextEncoder().encode(code.trim());
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return `${username}.setup.${hex.slice(0, 24)}@users.casa-nexo.example`;
}
