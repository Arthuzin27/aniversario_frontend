import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockFetch, respostaJson } from '../../test/utils';
import FamiliasPage from './FamiliasPage';

const silva = {
  id: 1,
  nome: 'Família Silva',
  quantidadePessoas: 2,
  convidados: [
    { id: 10, nomeCompleto: 'Ana Silva' },
    { id: 11, nomeCompleto: 'Carlos Silva' },
  ],
  dataCadastro: '2026-10-16T13:00:00Z',
  dataAtualizacao: '2026-10-16T13:00:00Z',
  possivelDuplicata: false,
};

function pagina(conteudo) {
  return { conteudo, pagina: 0, tamanho: 10, totalElementos: conteudo.length, totalPaginas: conteudo.length ? 1 : 0 };
}

describe('FamiliasPage', () => {
  it('lista famílias com integrantes e exclui após confirmação, atualizando a lista', async () => {
    let excluida = false;
    const fetchMock = mockFetch({
      'GET /api/admin/familias': () => respostaJson(pagina(excluida ? [] : [silva])),
      'DELETE /api/admin/familias/1': () => {
        excluida = true;
        return new Response(null, { status: 204 });
      },
    });
    const user = userEvent.setup();
    render(<FamiliasPage />);

    const card = await screen.findByRole('article', { name: 'Família Silva' });
    expect(within(card).getByText('2 pessoas')).toBeInTheDocument();
    expect(within(card).getByText('Carlos Silva')).toBeInTheDocument();

    await user.click(within(card).getByRole('button', { name: /Excluir/ }));
    const dialogo = screen.getByRole('dialog', { name: 'Excluir família' });
    expect(dialogo).toHaveTextContent('Esta ação não pode ser desfeita');
    expect(fetchMock.mock.calls.some(([, o]) => o?.method === 'DELETE')).toBe(false);

    await user.click(within(dialogo).getByRole('button', { name: 'Excluir definitivamente' }));

    expect(await screen.findByText('Família Silva foi excluída.')).toBeInTheDocument();
    expect(await screen.findByText('Nenhuma confirmação recebida ainda.')).toBeInTheDocument();
  });

  it('cancelar a exclusão não chama a API', async () => {
    const fetchMock = mockFetch({ 'GET /api/admin/familias': respostaJson(pagina([silva])) });
    const user = userEvent.setup();
    render(<FamiliasPage />);

    const card = await screen.findByRole('article', { name: 'Família Silva' });
    await user.click(within(card).getByRole('button', { name: /Excluir/ }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.every(([, o]) => (o?.method ?? 'GET') === 'GET')).toBe(true);
  });

  it('envia a busca para a API', async () => {
    const fetchMock = mockFetch({ 'GET /api/admin/familias': respostaJson(pagina([silva])) });
    const user = userEvent.setup();
    render(<FamiliasPage />);
    await screen.findByRole('article', { name: 'Família Silva' });

    await user.type(screen.getByLabelText('Buscar por família ou participante'), 'Ana');

    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) => new URL(url).searchParams.get('busca') === 'Ana')).toBe(true),
    );
  });

  it('edita a família e pede confirmação ao remover participante', async () => {
    let corpoEnviado = null;
    mockFetch({
      'GET /api/admin/familias': respostaJson(pagina([silva])),
      'PUT /api/admin/familias/1': (url, opcoes) => {
        corpoEnviado = JSON.parse(opcoes.body);
        return respostaJson({ ...silva, nome: 'Família Silva Souza' });
      },
    });
    const user = userEvent.setup();
    render(<FamiliasPage />);

    const card = await screen.findByRole('article', { name: 'Família Silva' });
    await user.click(within(card).getByRole('button', { name: /Editar/ }));
    const dialogo = screen.getByRole('dialog', { name: 'Editar família' });

    const nome = within(dialogo).getByLabelText('Nome da família');
    await user.clear(nome);
    await user.type(nome, 'Família Silva Souza');
    await user.click(within(dialogo).getByRole('button', { name: 'Remover Carlos Silva' }));
    await user.click(within(dialogo).getByRole('button', { name: '+ Adicionar participante' }));
    await user.type(within(dialogo).getByLabelText('Pessoa 2'), 'Bia Souza');

    await user.click(within(dialogo).getByRole('button', { name: 'Salvar alterações' }));
    expect(within(dialogo).getByRole('alert')).toHaveTextContent('Será removido: Carlos Silva');
    expect(corpoEnviado).toBeNull();

    await user.click(within(dialogo).getByRole('button', { name: 'Confirmar e salvar' }));

    expect(await screen.findByText('Família Silva Souza foi atualizada.')).toBeInTheDocument();
    expect(corpoEnviado).toEqual({
      nome: 'Família Silva Souza',
      convidados: [
        { id: 10, nomeCompleto: 'Ana Silva' },
        { id: null, nomeCompleto: 'Bia Souza' },
      ],
    });
  });

  it('mostra erro de comunicação com a API', async () => {
    mockFetch({
      'GET /api/admin/familias': () => Promise.reject(new TypeError('Failed to fetch')),
    });
    render(<FamiliasPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar ao servidor');
  });
});
