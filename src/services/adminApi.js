import { requisitarArquivo, requisitarJson } from './http';

const autenticado = { autenticado: true };

export function login(usuario, senha) {
  return requisitarJson('/api/auth/login', { metodo: 'POST', corpo: { usuario, senha } });
}

export function buscarUsuarioAtual() {
  return requisitarJson('/api/auth/me', autenticado);
}

export function buscarEstatisticas() {
  return requisitarJson('/api/admin/estatisticas', autenticado);
}

export function listarFamilias({ busca = '', pagina = 0, tamanho = 10 } = {}) {
  const params = new URLSearchParams({ pagina: String(pagina), tamanho: String(tamanho) });
  if (busca.trim()) params.set('busca', busca.trim());
  return requisitarJson(`/api/admin/familias?${params}`, autenticado);
}

export function buscarFamilia(id) {
  return requisitarJson(`/api/admin/familias/${id}`, autenticado);
}

export function atualizarFamilia(id, { nome, convidados }) {
  return requisitarJson(`/api/admin/familias/${id}`, { ...autenticado, metodo: 'PUT', corpo: { nome, convidados } });
}

export function excluirFamilia(id) {
  return requisitarJson(`/api/admin/familias/${id}`, { ...autenticado, metodo: 'DELETE' });
}

export function buscarRelatorio() {
  return requisitarJson('/api/admin/relatorios/convidados', autenticado);
}

/** formato: "pdf" ou "csv" */
export function baixarRelatorio(formato) {
  return requisitarArquivo(`/api/admin/relatorios/convidados/${formato}`);
}
