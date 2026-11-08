import { useRef, useState, type FormEvent } from "react";
import { useHouse } from "../app/CasaProviders";
import { useInventory } from "../hooks/useInventory";
import {
  changeStock, createProduct, uploadProductPhoto, type InventoryItem,
} from "../lib/casaApi";
import "../styles/casa.css";

const emptyProduct = {
  name: "", brand: "", category: "", packageDescription: "",
  reorderAt: 0, quantity: 1, locationId: "", expiresOn: "",
};

export function InventoryPage() {
  const { house } = useHouse();
  if (!house) return null;
  return <HouseInventory key={house.id} houseId={house.id} />;
}
function HouseInventory({ houseId }: { houseId: string }) {
  const { items, locations, photoUrls, loading, error: loadError, reload } = useInventory(houseId);
  const [search, setSearch] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyProduct);
  const [photo, setPhoto] = useState<File | null>(null);
  const [working, setWorking] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const filtered = items.filter((item) => {
    const query = search.toLocaleLowerCase("pt-BR").trim();
    const matches = `${item.name} ${item.brand ?? ""} ${item.category ?? ""}`
      .toLocaleLowerCase("pt-BR").includes(query);
    return matches && (!onlyLow || item.total <= Number(item.reorder_at));
  });
  const lowCount = items.filter((item) => item.total <= Number(item.reorder_at)).length;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!form.name.trim()) { setError("Informe o nome do produto."); return; }
    if (!Number.isInteger(form.quantity) || form.quantity < 0) {
      setError("A quantidade inicial deve ser um número inteiro não negativo.");
      return;
    }
    if (!Number.isInteger(form.reorderAt) || form.reorderAt < 0) {
      setError("O estoque mínimo deve ser um número inteiro não negativo.");
      return;
    }
    const normalize = (value: string) => value.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");
    const alreadyExists = items.some((item) =>
      normalize(item.name) === normalize(form.name)
      && normalize(item.brand ?? "") === normalize(form.brand)
      && normalize(item.package_description ?? "") === normalize(form.packageDescription)
    );
    if (alreadyExists) {
      setError("Este produto já está cadastrado. Use o botão + no produto existente para atualizar a quantidade.");
      return;
    }
    setWorking(true);
    try {
      const result = await createProduct({
        houseId, name: form.name, brand: form.brand, category: form.category,
        packageDescription: form.packageDescription, reorderAt: form.reorderAt,
        quantity: form.quantity, locationId: form.locationId || null,
        expiresOn: form.expiresOn || null,
      });
      let photoError = "";
      if (photo) {
        try { await uploadProductPhoto(houseId, result.product.id, photo); }
        catch (reason) {
          photoError = reason instanceof Error ? reason.message : "Falha no envio da foto";
        }
      }
      setForm(emptyProduct);
      setPhoto(null);
      if (fileInput.current) fileInput.current.value = "";
      setShowForm(false);
      setMessage(photoError
        ? `Produto salvo, mas a foto não foi enviada: ${photoError}. Você pode adicioná-la na lista.`
        : "Produto cadastrado no estoque compartilhado.");
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Erro ao cadastrar o produto.");
      await reload();
    } finally { setWorking(false); }
  }
  async function updateStock(item: InventoryItem, delta: number) {
    const lot = delta > 0 ? item.lots[0] : item.lots.find((row) => Number(row.quantity) >= 1);
    if (!lot) {
      setError("Não existe um lote válido para movimentar este produto.");
      return;
    }
    setError(""); setMessage(""); setUpdatingId(item.id);
    try {
      await changeStock(lot.id, delta, delta < 0 ? "consumo" : "ajuste");
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha ao atualizar quantidade.");
    } finally { setUpdatingId(null); }
  }
  async function updatePhoto(productId: string, file?: File) {
    if (!file) return;
    setError(""); setMessage(""); setUpdatingId(productId);
    try {
      await uploadProductPhoto(houseId, productId, file);
      setMessage("Fotografia atualizada.");
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha ao enviar foto.");
    } finally { setUpdatingId(null); }
  }

  return (
    <section className="casa-section" aria-labelledby="inventory-heading">
      <div className="casa-section__heading">
        <div>
          <span className="casa-eyebrow">Organização da Casa</span>
          <h2 id="inventory-heading">Nosso estoque</h2>
          <p>Confira antes de comprar: fotos, quantidades e onde cada coisa está.</p>
        </div>
        <button className="casa-primary" onClick={() => setShowForm((current) => !current)}
          aria-expanded={showForm} aria-controls="new-product-form">
          {showForm ? "Fechar cadastro" : "+ Adicionar produto"}
        </button>
      </div>

      {showForm && <form id="new-product-form" className="casa-panel casa-form casa-product-form"
        onSubmit={(event) => { void submit(event); }}>
        <h3>Novo produto</h3>
        <div className="casa-form__grid">
          <label>Nome do produto *
            <input value={form.name} required maxLength={200}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Ex.: Café 500 g" />
          </label>
          <label>Marca
            <input value={form.brand} maxLength={100}
              onChange={(event) => setForm({ ...form, brand: event.target.value })}
              placeholder="Ex.: Pilão" />
          </label>
          <label>Categoria
            <input value={form.category} maxLength={100}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
              placeholder="Ex.: Alimentos" />
          </label>
          <label>Embalagem
            <input value={form.packageDescription} maxLength={100}
              onChange={(event) => setForm({ ...form, packageDescription: event.target.value })}
              placeholder="Ex.: pacote de 500 g" />
          </label>
          <label>Quantidade atual (unidades) *
            <input type="number" min={0} step={1} required value={form.quantity}
              onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })} />
          </label>
          <label>Alerta quando chegar a
            <input type="number" min={0} step={1} required value={form.reorderAt}
              onChange={(event) => setForm({ ...form, reorderAt: Number(event.target.value) })} />
          </label>
          <label>Onde está guardado?
            <select value={form.locationId} onChange={(event) => setForm({ ...form, locationId: event.target.value })}>
              <option value="">Ainda não definido</option>
              {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </select>
          </label>
          <label>Validade (opcional)
            <input type="date" value={form.expiresOn}
              onChange={(event) => setForm({ ...form, expiresOn: event.target.value })} />
          </label>
          <label>Fotografia do produto
            <input ref={fileInput} type="file" accept="image/*"
              onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} />
            <small>Você pode fotografar agora ou escolher da galeria (até 8 MB).</small>
          </label>
        </div>
        {locations.length === 0 && <p className="casa-hint">Dica: crie os armários e prateleiras em “Armários” para indicar onde cada produto fica.</p>}
        <button className="casa-primary" disabled={working || !form.name.trim()}>
          {working ? "Salvando…" : "Salvar produto"}
        </button>
      </form>}

      {loadError && <p className="casa-alert casa-alert--error" role="alert">{loadError}</p>}
      {error && <p className="casa-alert casa-alert--error" role="alert">{error}</p>}
      {message && <p className="casa-alert casa-alert--success" role="status">{message}</p>}

      <div className="casa-stats">
        <div className="casa-stat"><strong>{items.length}</strong><span>Produtos cadastrados</span></div>
        <div className="casa-stat casa-stat--attention"><strong>{lowCount}</strong><span>Precisam de reposição</span></div>
      </div>
      <div className="casa-toolbar">
        <label className="casa-search">Buscar no estoque
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)}
            placeholder="Café, arroz, amaciante…" />
        </label>
        <label className="casa-check">
          <input type="checkbox" checked={onlyLow} onChange={(event) => setOnlyLow(event.target.checked)} />
          Somente acabando
        </label>
        <button className="casa-secondary" onClick={() => { void reload(true); }} type="button">
          Atualizar
        </button>
      </div>
      {loading && <p className="casa-hint">Carregando estoque…</p>}
      {!loading && filtered.length === 0 && <div className="casa-panel casa-empty">
        {items.length === 0 ? "Seu estoque está vazio. Cadastre o primeiro produto!" : "Nenhum produto encontrado para este filtro."}
      </div>}
      <div className="casa-product-grid">
        {filtered.map((item) => {
          const low = item.total <= Number(item.reorder_at);
          const lot = item.lots.find((row) => Number(row.quantity) > 0) ?? item.lots[0];
          const place = locations.find((location) => location.id === lot?.location_id);
          const photoUrl = item.photo_path ? photoUrls[item.photo_path] : null;
          return <article className="casa-product" key={item.id}>
            <div className="casa-product__media">
              {photoUrl
                ? <img loading="lazy" src={photoUrl} alt={`Fotografia de ${item.name}`} />
                : <span aria-hidden="true">📦</span>}
            </div>
            <div className="casa-product__body">
              <div className="casa-product__head">
                <div><h3>{item.name}</h3>
                  <p>{[item.brand, item.package_description].filter(Boolean).join(" · ") || "Produto da Casa"}</p></div>
                <span className={low ? "casa-badge casa-badge--low" : "casa-badge"}>
                  {low ? "Repor" : "Em estoque"}</span>
              </div>
              <p className="casa-product__place">📍 {place?.name ?? "Local não informado"}</p>
              {lot?.expires_on && <p className="casa-product__place">Validade: {new Date(lot.expires_on + "T12:00:00").toLocaleDateString("pt-BR")}</p>}
              <div className="casa-product__footer">
                <div className="casa-quantity" aria-label={`Quantidade de ${item.name}`}>
                  <button type="button" disabled={updatingId === item.id || item.total < 1}
                    aria-label={`Consumir uma unidade de ${item.name}`}
                    onClick={() => { void updateStock(item, -1); }}>−</button>
                  <strong>{item.total.toLocaleString("pt-BR")} un.</strong>
                  <button type="button" disabled={updatingId === item.id || !lot}
                    aria-label={`Adicionar uma unidade de ${item.name}`}
                    onClick={() => { void updateStock(item, 1); }}>+</button>
                </div>
                <label className="casa-photo-button">
                  {updatingId === item.id ? "Aguarde…" : item.photo_path ? "Trocar foto" : "Adicionar foto"}
                  <input type="file" accept="image/*" disabled={updatingId === item.id}
                    onChange={(event) => {
                      void updatePhoto(item.id, event.target.files?.[0]);
                      event.target.value = "";
                    }} />
                </label>
              </div>
            </div>
          </article>;
        })}
      </div>
    </section>
  );
}
