import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../app/CasaProviders";
import { activateHouseholdAccount } from "../lib/casaApi";
import "../styles/casa.css";

export function ActivatePage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState<"matheus" | "stephany">("matheus");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError("As duas senhas devem ser iguais.");
      return;
    }
    if (password.length < 12) {
      setError("A senha precisa ter pelo menos 12 caracteres.");
      return;
    }
    setBusy(true);
    try {
      await activateHouseholdAccount(username, code, password);
      setPassword("");
      setConfirmation("");
      setCode("");
      navigate("/", { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha na ativação.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="casa-auth">
      <div className="casa-auth__card">
        <span className="casa-eyebrow">Nossa Casa · Primeiro acesso</span>
        <h1>Casa Nexo</h1>
        <p>Crie sua senha em segurança. Ela será enviada diretamente ao Neon Auth
          e não será compartilhada comigo nem salva no código do projeto.</p>
        <h2>Ativar minha conta</h2>
        <form className="casa-form" onSubmit={(event) => { void submit(event); }}>
          <label>Quem está ativando?
            <select value={username}
              onChange={(event) => setUsername(event.target.value as "matheus" | "stephany")}>
              <option value="matheus">Matheus</option>
              <option value="stephany">Stephany</option>
            </select>
          </label>
          <label>Código individual de ativação
            <input type="text" autoCapitalize="none" autoCorrect="off" required
              autoComplete="off" value={code} maxLength={128}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Código de uso único" />
          </label>
          <label>Escolha sua senha
            <input type="password" minLength={12} maxLength={128} required
              autoComplete="new-password" value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo de 12 caracteres" />
          </label>
          <label>Confirme sua senha
            <input type="password" minLength={12} maxLength={128} required
              autoComplete="new-password" value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)} />
          </label>
          {error && <p className="casa-alert casa-alert--error" role="alert">{error}</p>}
          <button className="casa-primary" disabled={busy}>
            {busy ? "Ativando…" : "Ativar acesso"}
          </button>
        </form>
        <p className="casa-hint" style={{ marginTop: "1rem" }}>
          O código só serve para esta ativação, expira em 48 horas e não
          deve ser compartilhado. Após ativar, entre apenas com usuário e senha.
        </p>
        <Link to="/login" className="casa-link">Já ativei minha conta → Entrar</Link>
      </div>
    </main>
  );
}
