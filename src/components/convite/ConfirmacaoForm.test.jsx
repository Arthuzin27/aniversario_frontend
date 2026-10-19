import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockFetch, respostaJson } from '../../test/utils';
import ConfirmacaoForm from './ConfirmacaoForm';

function camposDeNomes() {
  return screen.queryAllByLabelText(/^Pessoa \d+$/);
}

async function preencher(user, { familia = 'Família Silva', quantidade, nomes = [] }) {
  if (familia) await user.type(screen.getByLabelText('Nome da família'), familia);
  if (quantidade !== undefined) await user.type(screen.getByLabelText(/Quantas pessoas/), String(quantidade));
  const campos = camposDeNomes();
  for (let i = 0; i < nomes.length; i++) {
    if (nomes[i]) await user.type(campos[i], nomes[i]);
  }
}

describe('ConfirmacaoForm', () => {
  it('gera exatamente a quantidade de campos de nomes informada', async () => {
    const user = userEvent.setup();
    render(<ConfirmacaoForm limite={30} />);

    expect(camposDeNomes()).toHaveLength(0);
    await user.type(screen.getByLabelText(/Quantas pessoas/), '3');
    expect(camposDeNomes()).toHaveLength(3);

    await user.clear(screen.getByLabelText(/Quantas pessoas/));
    await user.type(screen.getByLabelText(/Quantas pessoas/), '5');
    expect(camposDeNomes()).toHaveLength(5);
    expect(screen.getByLabelText('Pessoa 5')).toBeInTheDocument();
  });

  it('ao alterar a quantidade mantém os nomes já digitados', async () => {
    const user = userEvent.setup();
    render(<ConfirmacaoForm limite={30} />);
    const quantidade = screen.getByLabelText(/Quantas pessoas/);

    await user.type(quantidade, '3');
    await user.type(screen.getByLabelText('Pessoa 1'), 'Ana Silva');
    await user.type(screen.getByLabelText('Pessoa 3'), 'Carlos Silva');

    await user.clear(quantidade);
    await user.type(quantidade, '1');
    expect(camposDeNomes()).toHaveLength(1);
    expect(screen.getByLabelText('Pessoa 1')).toHaveValue('Ana Silva');

    await user.clear(quantidade);
    await user.type(quantidade, '3');
    expect(screen.getByLabelText('Pessoa 3')).toHaveValue('Carlos Silva');
  });

  it('não exibe campos para quantidade inválida ou acima do limite', async () => {
    const user = userEvent.setup();
    render(<ConfirmacaoForm limite={4} />);
    const quantidade = screen.getByLabelText(/Quantas pessoas/);

    await user.type(quantidade, '0');
    expect(camposDeNomes()).toHaveLength(0);
    await user.clear(quantidade);
    await user.type(quantidade, '5');
    expect(camposDeNomes()).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: 'Revisar confirmação' }));
    expect(screen.getAllByText('O limite é de 4 pessoas por família.').length).toBeGreaterThan(0);
  });

  it('valida campos obrigatórios com mensagens em português', async () => {
    const user = userEvent.setup();
    render(<ConfirmacaoForm limite={30} />);

    await user.click(screen.getByRole('button', { name: 'Revisar confirmação' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Informe o nome da família.');
    expect(screen.getByRole('alert')).toHaveTextContent('Informe quantas pessoas irão à festa.');
    expect(screen.getByLabelText('Nome da família')).toHaveAttribute('aria-invalid', 'true');

    await preencher(user, { quantidade: 2, nomes: ['Ana Silva', '   '] });
    await user.click(screen.getByRole('button', { name: 'Revisar confirmação' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Preencha o nome completo da pessoa 2.');
    expect(screen.getByLabelText('Pessoa 2')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByText('Confira os dados antes de enviar')).not.toBeInTheDocument();
  });

  it('revisa, envia para a API e mostra sucesso somente após a confirmação do backend', async () => {
    let liberar;
    const fetchMock = mockFetch({
      'POST /api/public/familias': () =>
        new Promise((resolve) => {
          liberar = () =>
            resolve(
              respostaJson(
                {
                  id: 7,
                  nome: 'Família Silva',
                  quantidadePessoas: 2,
                  convidados: ['Ana Silva', 'Carlos Silva'],
                  mensagem: 'Presença confirmada com sucesso! Obrigado, Família Silva.',
                },
                201,
              ),
            );
        }),
    });
    const user = userEvent.setup();
    render(<ConfirmacaoForm limite={30} />);

    await preencher(user, { familia: '  Família   Silva ', quantidade: 2, nomes: [' Ana  Silva', 'Carlos Silva'] });
    await user.click(screen.getByRole('button', { name: 'Revisar confirmação' }));

    expect(screen.getByText('Confira os dados antes de enviar')).toBeInTheDocument();
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();

    const botao = screen.getByRole('button', { name: 'Confirmar presença' });
    await user.click(botao);
    await user.click(botao); // segundo clique durante o envio é ignorado

    expect(screen.getByRole('button', { name: 'Enviando…' })).toBeDisabled();
    expect(screen.queryByText('Presença confirmada!')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [, opcoes] = fetchMock.mock.calls[0];
    expect(JSON.parse(opcoes.body)).toEqual({
      nome: 'Família Silva',
      quantidadePessoas: 2,
      convidados: ['Ana Silva', 'Carlos Silva'],
    });
    expect(opcoes.headers['Idempotency-Key']).toMatch(/^[0-9a-f-]{36}$/);

    liberar();
    expect(await screen.findByText('Presença confirmada!')).toBeInTheDocument();
    expect(screen.getByText(/Obrigado, Família Silva/)).toBeInTheDocument();
  });

  it('exibe erro de comunicação e permite tentar novamente com a mesma chave', async () => {
    const chaves = [];
    let tentativa = 0;
    mockFetch({
      'POST /api/public/familias': (url, opcoes) => {
        chaves.push(opcoes.headers['Idempotency-Key']);
        tentativa += 1;
        if (tentativa === 1) return Promise.reject(new TypeError('Failed to fetch'));
        return respostaJson(
          { id: 1, nome: 'Família Lima', quantidadePessoas: 1, convidados: ['Rita Lima'], mensagem: 'Presença confirmada com sucesso!' },
          201,
        );
      },
    });
    const user = userEvent.setup();
    render(<ConfirmacaoForm limite={30} />);

    await preencher(user, { familia: 'Família Lima', quantidade: 1, nomes: ['Rita Lima'] });
    await user.click(screen.getByRole('button', { name: 'Revisar confirmação' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar presença' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar ao servidor');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByText('Presença confirmada!')).toBeInTheDocument();
    expect(chaves).toHaveLength(2);
    expect(chaves[0]).toBe(chaves[1]);
  });

  it('mostra no formulário os erros de validação devolvidos pelo backend', async () => {
    mockFetch({
      'POST /api/public/familias': respostaJson(
        {
          status: 400,
          mensagem: 'Dados inválidos. Verifique os campos informados.',
          campos: [{ campo: 'convidados[0]', mensagem: 'Cada nome deve ter no máximo 150 caracteres.' }],
        },
        400,
      ),
    });
    const user = userEvent.setup();
    render(<ConfirmacaoForm limite={30} />);

    await preencher(user, { quantidade: 1, nomes: ['Ana'] });
    await user.click(screen.getByRole('button', { name: 'Revisar confirmação' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar presença' }));

    await waitFor(() => expect(screen.getByLabelText('Pessoa 1')).toHaveAttribute('aria-invalid', 'true'));
    expect(screen.getAllByText('Cada nome deve ter no máximo 150 caracteres.').length).toBeGreaterThan(0);
  });
});
