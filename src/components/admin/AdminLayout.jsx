import { NavLink, Outlet } from 'react-router';
import { useAuth } from '../../auth/AuthContext';
import { festa } from '../../config/festa';
import './AdminLayout.css';

export default function AdminLayout() {
  const { usuario, sair } = useAuth();

  return (
    <div className="admin">
      <header className="admin__topo">
        <div className="admin__marca">
          <span className="admin__marca-titulo">15 anos de {festa.aniversariante}</span>
          <span className="admin__marca-sub">Painel administrativo</span>
        </div>
        <nav className="admin__nav" aria-label="Menu do painel">
          <NavLink to="/admin" end>
            Resumo
          </NavLink>
          <NavLink to="/admin/familias">Famílias</NavLink>
          <NavLink to="/admin/relatorio">Relatório</NavLink>
        </nav>
        <div className="admin__usuario">
          <span>{usuario}</span>
          <button type="button" className="admin__sair" onClick={sair}>
            Sair
          </button>
        </div>
      </header>
      <main className="admin__conteudo">
        <Outlet />
      </main>
    </div>
  );
}
