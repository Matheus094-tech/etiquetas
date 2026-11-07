import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../app/CasaProviders";
import "../styles/casa.css";

export function LoginPage() {
  const { session, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [registering, setRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");
    setBusy(true);
    try {
      if (registering) {
        const connected = await signUp(email.trim(), password);
        if (connected) navigate("/", { replace: true });
        else {
          setStatus("Conta criada! Verifique o e-mail de confirmação antes de entrar.");
          setRegistering(false);
        }
      } else {
        await signIn(email.trim(), password);
        navigate("/", { replace: true });
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível entrar.");
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
        <h2>{registering ? "Criar minha conta" : "Entrar na nossa Casa"}</h2>
        <form className="casa-form" onSubmit={submit}>
          <label>
            E-mail
            <input type="email" autoComplete="email" value={email}
              onChange={(event) => setEmail(event.target.value)}
              required maxLength={254} placeholder="voce@exemplo.com" />
          </label>
          <label>
            Senha
            <input type="password" minLength={8} autoComplete={registering ? "new-password" : "current-password"}
              value={password} onChange={(event) => setPassword(event.target.value)}
              required placeholder="Mínimo de 8 caracteres" />
          </label>
          {error && <p className="casa-alert casa-alert--error" role="alert">{error}</p>}
          {status && <p className="casa-alert casa-alert--success" role="status">{status}</p>}
          <button className="casa-primary" disabled={busy}>
            {busy ? "Aguarde…" : registering ? "Criar conta" : "Entrar"}
          </button>
        </form>
        <button type="button" className="casa-link" onClick={() => {
          setRegistering((value) => !value); setError(""); setStatus("");
        }}>
          {registering ? "Já tenho conta" : "Ainda não tenho conta"}
        </button>
      </div>
    </main>
  );
}
