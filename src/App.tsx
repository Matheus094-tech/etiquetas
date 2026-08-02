import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./app/AppShell";
import { LabelsPage } from "./pages/LabelsPage";

export default function App() {
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
