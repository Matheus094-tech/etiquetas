import { useState, type FormEvent } from "react";
import { useAuth, useHouse } from "../app/CasaProviders";

export function HouseOnboarding() {
  const { error: loadError, create, join } = useHouse();
  const { session, signOut } = useAuth();
  const [name, setName] = useState("Nossa Casa");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try { await action(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível continuar."); }
    finally { setBusy(false); }
  }
  const createHouse = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit(() => create(name));
  };
  const joinHouse = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit(() => join(code));
  };
  return (
    <main className="casa-onboarding">
      <div className="casa-panel">
        <span className="casa-eyebrow">Bem-vindo à Casa Nexo</span>
        <h1>Vamos organizar nossa Casa?</h1>
        <p>Você está conectado como {session?.user.email}. Crie uma Casa ou entre usando o convite do outro morador.</p>
        {(error || loadError) && <p role="alert" className="casa-alert casa-alert--error">{error || loadError}</p>}
        <div className="casa-onboarding__columns">
          <form className="casa-form" onSubmit={createHouse}>
            <h2>Começar uma Casa</h2>
            <label>Nome da Casa
              <input value={name} onChange={(event) => setName(event.target.value)}
                required minLength={1} maxLength={100} />
            </label>
            <button className="casa-primary" disabled={busy || !name.trim()}>Criar Casa</button>
          </form>
          <form className="casa-form" onSubmit={joinHouse}>
            <h2>Entrar com convite</h2>
            <label>Código do convite
              <input value={code} onChange={(event) => setCode(event.target.value)}
                required placeholder="Cole o código recebido" />
            </label>
            <button className="casa-secondary" disabled={busy || !code.trim()}>Entrar na Casa</button>
          </form>
        </div>
        <button className="casa-link" type="button" onClick={() => { void signOut(); }}>Sair da conta</button>
      </div>
    </main>
  );
}
