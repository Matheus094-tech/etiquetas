import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../app/CasaProviders";
import { loginHousehold } from "../lib/casaApi";
import "../styles/casa.css";

export function LoginPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await loginHousehold(username, password);
      navigate("/", { replace: true });
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "";
      setError(message === "Conta ainda não ativada."
        ? "Esta conta ainda não foi ativada. Use o link Primeiro acesso abaixo."
        : message === "Não foi possível consultar a conta. Tente novamente."
          ? message
          : "Usuário ou senha incorretos.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="casa-auth">
      <div className="casa-auth__card">
        <span className="casa-eyebrow">M&S · Um produto MB Software</span>
        <h1>Casa Nexo</h1>
        <p>O que temos, o que falta e o que precisamos comprar. Tudo em um só lugar.</p>
        <h2>Entrar na nossa Casa</h2>
        <p className="casa-hint">Acesse em qualquer dispositivo com seu usuário e senha.</p>
        <form className="casa-form" onSubmit={submit}>
          <label htmlFor="casa-username">
            Usuário
            <input id="casa-username" type="text" autoCapitalize="none" autoCorrect="off"
              autoComplete="username" value={username}
              onChange={(event) => setUsername(event.target.value)}
              required maxLength={40} placeholder="matheus ou stephany" />
          </label>
          <label htmlFor="casa-password">
            Senha
            <input id="casa-password" type="password" minLength={8}
              autoComplete="current-password" value={password}
              onChange={(event) => setPassword(event.target.value)}
              required placeholder="Sua senha" />
          </label>
          {error && <p className="casa-alert casa-alert--error" role="alert">{error}</p>}
          <button className="casa-primary" disabled={busy}>
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="casa-hint" style={{ marginTop: "1rem" }}>
          Acesso reservado aos moradores. Já ativou sua conta?
        </p>
        <Link to="/ativar" className="casa-link">Primeiro acesso? Criar minha senha →</Link>
      </div>
    </main>
  );
}
