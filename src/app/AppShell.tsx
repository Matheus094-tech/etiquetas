import { NavLink, Outlet } from "react-router-dom";
import "../styles/shell.css";

const homeLinks = [
  { to: "/", label: "Início", end: true },
  { to: "/estoque", label: "Estoque", end: false },
  { to: "/locais", label: "Armários", end: false },
  { to: "/etiquetas", label: "Etiquetas", end: false },
  { to: "/configuracoes", label: "Configurações", end: false },
];
export function AppShell({ homeMode = false }: { homeMode?: boolean }) {
  const links = homeMode ? homeLinks : [homeLinks[3]];
  return (
    <div className="shell">
      <header className="shell__header">
        <div className="shell__header-inner">
          <div className="shell__brand">
            <h1 className="shell__product-name">Casa Nexo</h1>
            <p className="shell__product-tag">Um produto MB Software</p>
          </div>
          <nav className="shell__nav" aria-label="Seções do Casa Nexo">
            {links.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) =>
                  `shell__nav-link${isActive ? " shell__nav-link--active" : ""}`
                }>{label}</NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="shell__main">
        <Outlet />
      </main>
      <footer className="shell__footer">
        <p>Casa Nexo · Um produto MB Software</p>
      </footer>
    </div>
  );
}
