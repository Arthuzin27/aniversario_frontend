import { describe, expect, it } from 'vitest';
import { mockFetch, respostaJson } from '../test/utils';
import { API_URL, ApiError, requisitarArquivo, requisitarJson } from './http';

describe('cliente HTTP', () => {
  it('usa a URL da API configurada e devolve o JSON', async () => {
    const fetchMock = mockFetch({ 'GET /api/public/configuracao': respostaJson({ maxParticipantes: 30 }) });
    await expect(requisitarJson('/api/public/configuracao')).resolves.toEqual({ maxParticipantes: 30 });
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_URL}/api/public/configuracao`);
  });

  it('converte respostas de erro em ApiError com a mensagem e os campos do backend', async () => {
    mockFetch({
      'POST /api/public/familias': respostaJson(
        { status: 400, mensagem: 'Dados inválidos.', campos: [{ campo: 'nome', mensagem: 'Informe o nome da família.' }] },
        400,
      ),
    });
    const erro = await requisitarJson('/api/public/familias', { metodo: 'POST', corpo: {} }).catch((e) => e);
    expect(erro).toBeInstanceOf(ApiError);
    expect(erro.status).toBe(400);
    expect(erro.message).toBe('Dados inválidos.');
    expect(erro.campos[0].campo).toBe('nome');
  });

  it('usa mensagens amigáveis quando o servidor não devolve JSON', async () => {
    mockFetch({ 'POST /api/public/familias': new Response('Bad gateway', { status: 502 }) });
    await expect(requisitarJson('/api/public/familias', { metodo: 'POST', corpo: {} })).rejects.toThrow(
      'O servidor encontrou um problema',
    );
    mockFetch({ 'POST /api/auth/login': new Response(null, { status: 429 }) });
    await expect(requisitarJson('/api/auth/login', { metodo: 'POST', corpo: {} })).rejects.toThrow('Aguarde um minuto');
  });

  it('extrai o nome do arquivo do Content-Disposition', async () => {
    mockFetch({
      'GET /api/admin/relatorios/convidados/csv': new Response('a;b', {
        status: 200,
        headers: { 'Content-Disposition': 'attachment; filename="lista-convidados-20261016-1100.csv"' },
      }),
    });
    const { nomeArquivo, blob } = await requisitarArquivo('/api/admin/relatorios/convidados/csv');
    expect(nomeArquivo).toBe('lista-convidados-20261016-1100.csv');
    expect(await blob.text()).toBe('a;b');
  });
});
