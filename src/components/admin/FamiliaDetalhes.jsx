import { useEffect, useState } from 'react';
import { buscarFamilia } from '../../services/adminApi';
import { formatarDataHora } from '../../utils/data';
import Modal from './Modal';

/** Consulta a família pelo ID (dados atualizados do banco) e exibe em uma janela. */
export default function FamiliaDetalhes({ id, onFechar }) {
  const [familia, setFamilia] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let ativo = true;
    buscarFamilia(id)
      .then((dados) => ativo && setFamilia(dados))
      .catch((e) => ativo && setErro(e.message));
    return () => {
      ativo = false;
    };
  }, [id]);

  return (
    <Modal titulo={familia?.nome ?? 'Família'} onFechar={onFechar}>
      {erro && (
        <div className="aviso aviso--erro" role="alert">
          {erro}
        </div>
      )}
      {!familia && !erro && <p>Carregando…</p>}
      {familia && (
        <>
          <p>
            <strong>{familia.quantidadePessoas}</strong>{' '}
            {familia.quantidadePessoas === 1 ? 'pessoa confirmada' : 'pessoas confirmadas'}
          </p>
          <ol>
            {familia.convidados.map((c) => (
              <li key={c.id}>{c.nomeCompleto}</li>
            ))}
          </ol>
          <p>
            <small>
              Cadastro: {formatarDataHora(familia.dataCadastro)}
              <br />
              Última atualização: {formatarDataHora(familia.dataAtualizacao)}
            </small>
          </p>
        </>
      )}
      <div className="modal__acoes">
        <button type="button" className="botao botao--secundario" onClick={onFechar}>
          Fechar
        </button>
      </div>
    </Modal>
  );
}
