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
  const [activationCode, setActivationCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await loginHousehold(username, password, activationCode);
      navigate("/", { replace: true });
    } catch (reason) {
      const needsCode = reason instanceof Error && reason.message.includes("código de ativação");
      setError(needsCode
        ? "No primeiro acesso neste dispositivo, abra a opção de código abaixo e informe seu código de ativação."
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
          <details>
            <summary className="casa-link" style={{ cursor: "pointer" }}>
              Primeiro login neste dispositivo? Tenho um código
            </summary>
            <label>Código de ativação (opcional nos próximos acessos)
              <input type="text" autoCapitalize="none" autoCorrect="off"
                autoComplete="off" value={activationCode}
                onChange={(event) => setActivationCode(event.target.value)}
                placeholder="Código que recebeu na ativação" />
            </label>
          </details>
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
