import { Navigate, Route, Routes } from 'react-router';
import RotaProtegida from './auth/RotaProtegida';
import AdminLayout from './components/admin/AdminLayout';
import ConvitePage from './pages/convite/ConvitePage';
import DashboardPage from './pages/admin/DashboardPage';
import FamiliasPage from './pages/admin/FamiliasPage';
import LoginPage from './pages/admin/LoginPage';
import RelatorioPage from './pages/admin/RelatorioPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ConvitePage />} />
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin" element={<RotaProtegida />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="familias" element={<FamiliasPage />} />
          <Route path="relatorio" element={<RelatorioPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
