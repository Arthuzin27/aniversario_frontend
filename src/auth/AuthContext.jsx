import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { login as loginApi } from '../services/adminApi';
import { definirAoNaoAutorizado, definirToken } from '../services/http';

// O token fica no sessionStorage: some ao fechar a aba e não é enviado automaticamente como cookie.
const CHAVE_SESSAO = 'convite15:sessao-admin';

const AuthContext = createContext(null);

function lerSessao() {
  try {
    const sessao = JSON.parse(sessionStorage.getItem(CHAVE_SESSAO));
    if (sessao?.token && new Date(sessao.expiraEm) > new Date()) return sessao;
  } catch {
    // armazenamento indisponível ou corrompido
  }
  return null;
}

function salvarSessao(sessao) {
  try {
    if (sessao) sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
    else sessionStorage.removeItem(CHAVE_SESSAO);
  } catch {
    // segue funcionando apenas em memória
  }
}

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(() => {
    const inicial = lerSessao();
    definirToken(inicial?.token ?? null);
    return inicial;
  });

  const sair = useCallback(() => {
    definirToken(null);
    salvarSessao(null);
    setSessao(null);
  }, []);

  const entrar = useCallback(async (usuario, senha) => {
    const resposta = await loginApi(usuario, senha);
    const nova = { token: resposta.token, expiraEm: resposta.expiraEm, usuario: resposta.usuario };
    definirToken(nova.token);
    salvarSessao(nova);
    setSessao(nova);
  }, []);

  useEffect(() => {
    definirAoNaoAutorizado(sair);
    return () => definirAoNaoAutorizado(null);
  }, [sair]);

  // Encerra a sessão automaticamente quando o token expira.
  useEffect(() => {
    if (!sessao) return undefined;
    const restante = new Date(sessao.expiraEm).getTime() - Date.now();
    const timer = setTimeout(sair, Math.max(0, Math.min(restante, 2 ** 31 - 1)));
    return () => clearTimeout(timer);
  }, [sessao, sair]);

  const valor = useMemo(
    () => ({ autenticado: Boolean(sessao), usuario: sessao?.usuario ?? null, entrar, sair }),
    [sessao, entrar, sair],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return contexto;
}
