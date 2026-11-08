import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppShell } from "./app/AppShell";
import { AuthProvider, HouseProvider, useAuth, useHouse } from "./app/CasaProviders";
import { casaConfigured } from "./lib/casaApi";
import { DashboardPage } from "./pages/DashboardPage";
import { HouseOnboarding } from "./pages/HouseOnboarding";
import { InventoryPage } from "./pages/InventoryPage";
import { LabelsPage } from "./pages/LabelsPage";
import { LocationsPage } from "./pages/LocationsPage";
import { LoginPage } from "./pages/LoginPage";
import { SettingsPage } from "./pages/SettingsPage";

function RequireAuth() {
  const { session, authReady } = useAuth();
  if (!authReady) return <main className="casa-onboarding"><p>Verificando sua sessão…</p></main>;
  return session ? <Outlet /> : <Navigate to="/login" replace />;
}
function HouseLayout() {
  const { loading, error, house } = useHouse();
  if (loading) return <main className="casa-onboarding"><p>Carregando nossa Casa…</p></main>;
  if (error) return <main className="casa-onboarding"><p role="alert">{error}</p></main>;
  if (!house) return <HouseOnboarding />;
  return <AppShell homeMode />;
}
function FullCasaApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<HouseProvider><HouseLayout /></HouseProvider>}>
            <Route index element={<DashboardPage />} />
            <Route path="/estoque" element={<InventoryPage />} />
            <Route path="/locais" element={<LocationsPage />} />
            <Route path="/etiquetas" element={<LabelsPage />} />
            <Route path="/configuracoes" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
function LegacyLabelsApp() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/etiquetas" replace />} />
      <Route element={<AppShell />}>
        <Route path="/etiquetas" element={<LabelsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/etiquetas" replace />} />
    </Routes>
  );
}
export default function App() {
  // Nenhum dado pessoal sai do navegador até o Supabase estar configurado.
  // Preserva 100% do gerador anterior no deploy antigo.
  return casaConfigured ? <FullCasaApp /> : <LegacyLabelsApp />;
}
