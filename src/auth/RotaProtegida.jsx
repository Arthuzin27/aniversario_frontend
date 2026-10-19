import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './AuthContext';

/** Libera as rotas filhas somente para administradores autenticados. */
export default function RotaProtegida() {
  const { autenticado } = useAuth();
  const location = useLocation();

  if (!autenticado) {
    return <Navigate to="/admin/login" replace state={{ destino: location.pathname }} />;
  }
  return <Outlet />;
}
