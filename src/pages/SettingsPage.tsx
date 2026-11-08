import { useState } from "react";
import { useAuth, useHouse } from "../app/CasaProviders";
import { createInvite } from "../lib/casaApi";
import { displayUsername } from "../lib/householdUsers";

export function SettingsPage() {
  const { session, signOut } = useAuth();
  const { house, houses, select } = useHouse();
  const [invite, setInvite] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const houseId = house?.id ?? "";
  if (!house) return null;

  async function generateInvite() {
    setError(""); setInvite(""); setMessage(""); setBusy(true);
    try { setInvite(await createInvite(houseId)); }
    catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível criar convite.");
    } finally { setBusy(false); }
  }
  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(invite);
      setMessage("Código copiado. Envie de forma privada para outro morador.");
    } catch {
      setError("Copie o código manualmente.");
    }
  }

  return (
    <section className="casa-section">
      <div className="casa-section__heading">
        <div><span className="casa-eyebrow">Nossa Casa, nossas regras</span>
          <h2>Configurações</h2><p>Gerencie sua conta e moradores.</p></div>
      </div>
      <div className="casa-panel casa-form">
        <h3>Casa compartilhada</h3>
        <p>Casa atual: <strong>{house.name}</strong></p>
        {houses.length > 1 && <label>Selecionar Casa
          <select value={house.id} onChange={(event) => select(event.target.value)}>
            {houses.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>
        </label>}
        <p>Matheus e Stephany já estão vinculados à mesma Casa no Neon. Nenhum convite é necessário para os dois acessarem.</p>
        <button className="casa-secondary" onClick={() => { void generateInvite(); }} disabled={busy}>
          {busy ? "Gerando…" : "Gerar convite para outro morador"}
        </button>
        {invite && <div className="casa-invite">
          <label>Código privado do convite
            <input readOnly value={invite} onFocus={(event) => event.target.select()} />
          </label>
          <button className="casa-secondary" onClick={() => { void copyInvite(); }} type="button">
            Copiar código
          </button>
        </div>}
        <p className="casa-hint">O convite expira em 48 horas. Contas adicionais precisam ser criadas pelo administrador.</p>
      </div>
      <div className="casa-panel casa-form">
        <h3>Sua conta</h3>
        <p>Conectado como <strong>{displayUsername(session?.user.email)}</strong></p>
        <button className="casa-secondary" onClick={() => { void signOut(); }}>Sair da conta</button>
      </div>
      <div className="casa-panel">
        <h3>Segurança da conta</h3>
        <p className="casa-hint">
          A troca e recuperação de senha ainda precisam ser habilitadas no Neon Auth.
          Por segurança, a aplicação não permite alterar senhas diretamente no banco.
          Não utilize senhas temporárias compartilhadas para guardar dados financeiros.
        </p>
      </div>
      {error && <p className="casa-alert casa-alert--error" role="alert">{error}</p>}
      {message && <p className="casa-alert casa-alert--success" role="status">{message}</p>}
    </section>
  );
}
