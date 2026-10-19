import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import App from '../App';
import { mockFetch, respostaJson } from '../test/utils';
import { AuthProvider } from './AuthContext';

function renderizar(rota) {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

const estatisticas = respostaJson({ totalPessoas: 12, totalFamilias: 4, mediaPessoasPorFamilia: 3 });

describe('Proteção do painel administrativo', () => {
  it('redireciona para o login quando não há sessão', () => {
    renderizar('/admin/relatorio');
    expect(screen.getByRole('heading', { name: 'Painel administrativo' })).toBeInTheDocument();
    expect(screen.queryByText('Relatório de convidados')).not.toBeInTheDocument();
  });

  it('após login válido, abre a página originalmente solicitada', async () => {
    const fetchMock = mockFetch({
      'POST /api/auth/login': respostaJson({
        token: 'token-teste',
        tipo: 'Bearer',
        usuario: 'admin',
        expiraEm: new Date(Date.now() + 3_600_000).toISOString(),
      }),
      'GET /api/admin/estatisticas': estatisticas,
    });
    const user = userEvent.setup();
    renderizar('/admin');

    await user.type(screen.getByLabelText('Usuário'), 'admin');
    await user.type(screen.getByLabelText('Senha'), 'senha-correta');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Resumo das confirmações')).toBeInTheDocument();
    expect(await screen.findByText('12')).toBeInTheDocument();
    const chamadaEstatisticas = fetchMock.mock.calls.find(([url]) => url.endsWith('/api/admin/estatisticas'));
    expect(chamadaEstatisticas[1].headers.Authorization).toBe('Bearer token-teste');
  });

  it('exibe a mensagem do backend quando a senha é inválida', async () => {
    mockFetch({
      'POST /api/auth/login': respostaJson({ status: 401, mensagem: 'Usuário ou senha inválidos.' }, 401),
    });
    const user = userEvent.setup();
    renderizar('/admin/login');

    await user.type(screen.getByLabelText('Usuário'), 'admin');
    await user.type(screen.getByLabelText('Senha'), 'errada');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Usuário ou senha inválidos.');
  });

  it('encerra a sessão e volta ao login quando a API responde 401 (token expirado)', async () => {
    sessionStorage.setItem(
      'convite15:sessao-admin',
      JSON.stringify({ token: 'expirado', usuario: 'admin', expiraEm: new Date(Date.now() + 3_600_000).toISOString() }),
    );
    mockFetch({
      'GET /api/admin/estatisticas': respostaJson({ status: 401, mensagem: 'Autenticação necessária.' }, 401),
    });
    renderizar('/admin');

    expect(await screen.findByRole('heading', { name: 'Painel administrativo' })).toBeInTheDocument();
    expect(sessionStorage.getItem('convite15:sessao-admin')).toBeNull();
  });

  it('libera o painel para sessão válida e permite sair', async () => {
    sessionStorage.setItem(
      'convite15:sessao-admin',
      JSON.stringify({ token: 'ok', usuario: 'admin', expiraEm: new Date(Date.now() + 3_600_000).toISOString() }),
    );
    mockFetch({ 'GET /api/admin/estatisticas': estatisticas });
    const user = userEvent.setup();
    renderizar('/admin');

    expect(await screen.findByText('Resumo das confirmações')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sair' }));
    expect(screen.getByRole('heading', { name: 'Painel administrativo' })).toBeInTheDocument();
  });
});
