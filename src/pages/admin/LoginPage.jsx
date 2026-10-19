import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../auth/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const { autenticado, entrar } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);
  const [entrando, setEntrando] = useState(false);

  const destino = location.state?.destino?.startsWith('/admin') ? location.state.destino : '/admin';

  if (autenticado) return <Navigate to={destino} replace />;

  async function enviar(evento) {
    evento.preventDefault();
    if (!usuario.trim() || !senha) {
      setErro('Informe usuário e senha.');
      return;
    }
    setEntrando(true);
    setErro(null);
    try {
      await entrar(usuario.trim(), senha);
      navigate(destino, { replace: true });
    } catch (e) {
      setErro(e.message);
      setEntrando(false);
    }
  }

  return (
    <main className="login">
      <form className="login__cartao" onSubmit={enviar} noValidate>
        <h1>Painel administrativo</h1>
        <p className="login__subtitulo">Acesso restrito aos organizadores da festa.</p>

        {erro && (
          <div className="aviso aviso--erro" role="alert">
            {erro}
          </div>
        )}

        <div className="campo">
          <label htmlFor="usuario">Usuário</label>
          <input
            id="usuario"
            type="text"
            autoComplete="username"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
          />
        </div>
        <div className="campo">
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>
        <button type="submit" className="botao botao--primario" disabled={entrando}>
          {entrando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
