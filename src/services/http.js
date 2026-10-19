// Cliente HTTP único da aplicação (Fetch API). A URL do backend vem de VITE_API_URL.
export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/+$/, '');

const MENSAGEM_SEM_CONEXAO =
  'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.';

export class ApiError extends Error {
  constructor(status, mensagem, campos = []) {
    super(mensagem);
    this.name = 'ApiError';
    this.status = status;
    this.campos = campos;
  }
}

let tokenAtual = null;
let aoNaoAutorizado = null;

/** Define o token Bearer enviado nas rotas administrativas. */
export function definirToken(token) {
  tokenAtual = token;
}

/** Callback chamado quando a API responde 401 numa requisição autenticada (sessão expirada). */
export function definirAoNaoAutorizado(callback) {
  aoNaoAutorizado = callback;
}

async function executar(caminho, { metodo = 'GET', corpo, cabecalhos = {}, autenticado = false } = {}) {
  const headers = { Accept: 'application/json', ...cabecalhos };
  if (corpo !== undefined) headers['Content-Type'] = 'application/json';
  if (autenticado && tokenAtual) headers.Authorization = `Bearer ${tokenAtual}`;

  let resposta;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method: metodo,
      headers,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new ApiError(0, MENSAGEM_SEM_CONEXAO);
  }

  if (!resposta.ok) {
    const erro = await lerErro(resposta);
    if (resposta.status === 401 && autenticado && aoNaoAutorizado) aoNaoAutorizado();
    throw erro;
  }
  return resposta;
}

async function lerErro(resposta) {
  let corpo = null;
  try {
    corpo = await resposta.json();
  } catch {
    // resposta sem JSON (ex.: proxy fora do ar)
  }
  const mensagem =
    corpo?.mensagem ??
    (resposta.status === 429
      ? 'Muitas tentativas em pouco tempo. Aguarde um minuto e tente novamente.'
      : resposta.status >= 500
        ? 'O servidor encontrou um problema. Tente novamente em alguns instantes.'
        : 'Não foi possível concluir a operação.');
  return new ApiError(resposta.status, mensagem, corpo?.campos ?? []);
}

export async function requisitarJson(caminho, opcoes) {
  const resposta = await executar(caminho, opcoes);
  return resposta.status === 204 ? null : resposta.json();
}

/** Baixa um arquivo autenticado e devolve { blob, nomeArquivo }. */
export async function requisitarArquivo(caminho) {
  const resposta = await executar(caminho, { autenticado: true, cabecalhos: { Accept: '*/*' } });
  const disposicao = resposta.headers.get('Content-Disposition') ?? '';
  const nomeArquivo = /filename="?([^";]+)"?/.exec(disposicao)?.[1] ?? 'relatorio';
  return { blob: await resposta.blob(), nomeArquivo };
}
