/**
 * Login simplificado do Casa Nexo.
 *
 * Supabase Auth exige um identificador de e-mail ou telefone para senha.
 * Os endereços abaixo são identificadores técnicos RESERVADOS (domínio .example),
 * sem caixa de e-mail e sem possibilidade de recuperação automática.
 * Nunca armazenar senhas neste arquivo nem no frontend.
 *
 * Contas são provisionadas pelo administrador via Supabase Auth.
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
  const match = HOUSEHOLD_USERNAMES.find((username) => IDENTITIES[username] === email.toLowerCase());
  return match ? match.charAt(0).toUpperCase() + match.slice(1) : "Morador";
}
