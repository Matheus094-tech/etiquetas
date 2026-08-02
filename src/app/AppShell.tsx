import { NavLink, Outlet } from "react-router-dom";
import "../styles/shell.css";

export function AppShell() {
  return (
    <div className="shell">
      <header className="shell__header">
        <div className="shell__header-inner">
          <div className="shell__brand">
            <h1 className="shell__product-name">Casa Nexo</h1>
            <p className="shell__product-tag">Um produto MB Software</p>
          </div>

          <nav className="shell__nav" aria-label="Seções do Casa Nexo">
            <NavLink
              to="/etiquetas"
              className={({ isActive }) =>
                `shell__nav-link${isActive ? " shell__nav-link--active" : ""}`
              }
            >
              Etiquetas
            </NavLink>
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
