import { vi } from 'vitest';

/** Cria uma resposta HTTP no formato da Fetch API. */
export function respostaJson(corpo, status = 200) {
  return new Response(corpo === null ? null : JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Substitui o fetch global por um roteador simples: cada rota "MÉTODO /caminho" devolve uma resposta.
 * As chamadas ficam registradas em fetch.mock.calls para conferência.
 */
export function mockFetch(rotas) {
  const fetchMock = vi.fn(async (url, opcoes = {}) => {
    const caminho = new URL(url).pathname;
    const chave = `${opcoes.method ?? 'GET'} ${caminho}`;
    const rota = rotas[chave];
    if (!rota) throw new Error(`Rota não simulada: ${chave}`);
    return typeof rota === 'function' ? rota(url, opcoes) : rota.clone();
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
