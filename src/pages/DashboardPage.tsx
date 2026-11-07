import { Link } from "react-router-dom";
import { useHouse } from "../app/CasaProviders";
import { useInventory } from "../hooks/useInventory";

export function DashboardPage() {
  const { house } = useHouse();
  if (!house) return null;
  return <Dashboard key={house.id} houseId={house.id} name={house.name} />;
}
function Dashboard({ houseId, name }: { houseId: string; name: string }) {
  const { items, locations, loading, error } = useInventory(houseId);
  const low = items.filter((item) => item.total <= Number(item.reorder_at));
  const upcoming = items.flatMap((item) => item.lots
    .filter((lot) => lot.expires_on && Number(lot.quantity) > 0)
    .map((lot) => ({ item, lot })))
    .filter(({ lot }) => {
      const days = (new Date(lot.expires_on + "T12:00:00").getTime() - Date.now()) / 86400000;
      return days <= 7;
    }).slice(0, 5);
  return (
    <section className="casa-section">
      <div className="casa-section__heading">
        <div>
          <span className="casa-eyebrow">O nosso cantinho</span>
          <h2>{name}</h2>
          <p>Veja rapidamente o que já temos e o que precisa de atenção.</p>
        </div>
        <Link className="casa-primary casa-button-link" to="/estoque">Consultar estoque →</Link>
      </div>
      {loading && <p className="casa-hint">Carregando sua Casa…</p>}
      {error && <p className="casa-alert casa-alert--error" role="alert">{error}</p>}
      <div className="casa-stats">
        <div className="casa-stat"><strong>{items.length}</strong><span>Produtos cadastrados</span></div>
        <div className="casa-stat casa-stat--attention"><strong>{low.length}</strong><span>Precisam de reposição</span></div>
        <div className="casa-stat"><strong>{locations.length}</strong><span>Locais organizados</span></div>
      </div>
      <div className="casa-dashboard-grid">
        <div className="casa-panel">
          <h3>🛒 O que está acabando</h3>
          {low.length === 0 ? <p className="casa-hint">Tudo em dia por aqui!</p> : (
            <ul className="casa-list">
              {low.slice(0, 6).map((item) =>
                <li key={item.id}><strong>{item.name}</strong><span>{item.total} un.</span></li>)}
            </ul>
          )}
          <Link to="/estoque" className="casa-link">Ver estoque completo →</Link>
        </div>
        <div className="casa-panel">
          <h3>📅 Validades próximas</h3>
          {upcoming.length === 0 ? <p className="casa-hint">Nenhum produto com validade próxima registrada.</p> : (
            <ul className="casa-list">
              {upcoming.map(({ item, lot }) =>
                <li key={lot.id}><strong>{item.name}</strong>
                  <span>{lot.expires_on?.split("-").reverse().join("/")}</span></li>)}
            </ul>
          )}
          <Link to="/locais" className="casa-link">Organizar armários →</Link>
        </div>
      </div>
      <div className="casa-panel">
        <h3>Próximos módulos</h3>
        <p className="casa-hint">Lista de compras e finanças do casal estão planejadas, mas ainda não estão disponíveis nesta versão.</p>
      </div>
    </section>
  );
}
