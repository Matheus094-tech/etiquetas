import { useEffect, useState, type FormEvent } from "react";
import { useHouse } from "../app/CasaProviders";
import { createLocation, getLocations, type Location } from "../lib/casaApi";

const types = [
  ["ambiente", "Cômodo"], ["armario", "Armário"], ["prateleira", "Prateleira"],
  ["gaveta", "Gaveta"], ["despensa", "Despensa"],
  ["geladeira", "Geladeira"], ["freezer", "Freezer"], ["outro", "Outro"],
] as const;

export function LocationsPage() {
  const { house } = useHouse();
  if (!house) return null;
  return <Locations key={house.id} houseId={house.id} />;
}
function Locations({ houseId }: { houseId: string }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [name, setName] = useState("");
  const [kind, setKind] = useState("armario");
  const [parentId, setParentId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function reload() {
    setLocations(await getLocations(houseId));
  }
  useEffect(() => {
    let active = true;
    void getLocations(houseId).then((places) => {
      if (active) setLocations(places);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Erro ao carregar locais.");
    });
    return () => { active = false; };
  }, [houseId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setMessage(""); setBusy(true);
    try {
      await createLocation(houseId, name, kind, parentId || null);
      setName(""); setParentId("");
      await reload();
      setMessage("Local adicionado. Agora você pode usá-lo no cadastro de produtos.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Erro ao cadastrar local.");
    } finally { setBusy(false); }
  }
  function hierarchy(place: Location) {
    const names = [place.name];
    const seen = new Set<string>([place.id]);
    let current = place;
    while (current.parent_id && !seen.has(current.parent_id)) {
      seen.add(current.parent_id);
      const parent = locations.find((other) => other.id === current.parent_id);
      if (!parent) break;
      names.unshift(parent.name);
      current = parent;
    }
    return names.join(" › ");
  }
  return (
    <section className="casa-section">
      <div className="casa-section__heading">
        <div><span className="casa-eyebrow">Tudo no seu lugar</span>
          <h2>Armários e ambientes</h2>
          <p>Cadastre os lugares onde vocês guardam os produtos.</p></div>
      </div>
      <form className="casa-panel casa-form" onSubmit={(event) => { void submit(event); }}>
        <h3>Adicionar local</h3>
        <div className="casa-form__grid">
          <label>Nome
            <input value={name} required maxLength={100} placeholder="Ex.: Armário de limpeza"
              onChange={(event) => setName(event.target.value)} />
          </label>
          <label>Tipo
            <select value={kind} onChange={(event) => setKind(event.target.value)}>
              {types.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>Dentro de (opcional)
            <select value={parentId} onChange={(event) => setParentId(event.target.value)}>
              <option value="">Raiz da Casa</option>
              {locations.map((place) => <option value={place.id} key={place.id}>
                {hierarchy(place)}
              </option>)}
            </select>
          </label>
        </div>
        <button className="casa-primary" disabled={busy || !name.trim()}>
          {busy ? "Salvando…" : "Adicionar local"}
        </button>
      </form>
      {error && <p role="alert" className="casa-alert casa-alert--error">{error}</p>}
      {message && <p role="status" className="casa-alert casa-alert--success">{message}</p>}
      <div className="casa-panel">
        <h3>Locais cadastrados ({locations.length})</h3>
        {locations.length === 0 && <p className="casa-hint">Comece pela Cozinha, Lavanderia ou Banheiro.</p>}
        <ul className="casa-locations">
          {locations.map((place) => <li key={place.id}>
            <strong>{hierarchy(place)}</strong>
            <span>{types.find(([value]) => value === place.kind)?.[1] ?? place.kind}</span>
          </li>)}
        </ul>
      </div>
    </section>
  );
}
