import { useRef, useState } from 'react';
import { atualizarFamilia } from '../../services/adminApi';
import Modal from './Modal';
import './FamiliaEditor.css';

/** Edita nome e participantes. Remoções só são aplicadas após confirmação explícita ao salvar. */
export default function FamiliaEditor({ familia, onFechar, onSalvo }) {
  const proximaChave = useRef(0);
  const [nome, setNome] = useState(familia.nome);
  const [participantes, setParticipantes] = useState(() =>
    familia.convidados.map((c) => ({ chave: `c${c.id}`, id: c.id, nomeCompleto: c.nomeCompleto })),
  );
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false);

  const idsMantidos = new Set(participantes.map((p) => p.id).filter(Boolean));
  const removidos = familia.convidados.filter((c) => !idsMantidos.has(c.id));

  function alterar(chave, valor) {
    setParticipantes((lista) => lista.map((p) => (p.chave === chave ? { ...p, nomeCompleto: valor } : p)));
    setConfirmandoRemocao(false);
  }

  function adicionar() {
    proximaChave.current += 1;
    setParticipantes((lista) => [...lista, { chave: `n${proximaChave.current}`, id: null, nomeCompleto: '' }]);
  }

  function remover(chave) {
    setParticipantes((lista) => lista.filter((p) => p.chave !== chave));
    setConfirmandoRemocao(false);
  }

  async function salvar(evento) {
    evento.preventDefault();
    if (!nome.trim()) return setErro('Informe o nome da família.');
    if (participantes.length === 0) return setErro('A família deve ter pelo menos um participante.');
    if (participantes.some((p) => !p.nomeCompleto.trim())) {
      return setErro('Preencha o nome completo de todos os participantes.');
    }
    if (removidos.length > 0 && !confirmandoRemocao) {
      setErro(null);
      return setConfirmandoRemocao(true);
    }

    setSalvando(true);
    setErro(null);
    try {
      const atualizada = await atualizarFamilia(familia.id, {
        nome: nome.trim(),
        convidados: participantes.map(({ id, nomeCompleto }) => ({ id, nomeCompleto: nomeCompleto.trim() })),
      });
      onSalvo(atualizada);
    } catch (e) {
      setErro(e.campos?.[0]?.mensagem ?? e.message);
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Editar família" onFechar={onFechar} podeFechar={!salvando}>
      <form className="familia-editor" onSubmit={salvar} noValidate>
        <div className="campo">
          <label htmlFor="editar-nome">Nome da família</label>
          <input id="editar-nome" type="text" maxLength={120} value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>

        <fieldset className="familia-editor__participantes">
          <legend>Participantes ({participantes.length})</legend>
          {participantes.map((p, i) => (
            <div className="familia-editor__linha" key={p.chave}>
              <div className="campo">
                <label htmlFor={`editar-participante-${p.chave}`}>Pessoa {i + 1}</label>
                <input
                  id={`editar-participante-${p.chave}`}
                  type="text"
                  maxLength={150}
                  value={p.nomeCompleto}
                  onChange={(e) => alterar(p.chave, e.target.value)}
                />
              </div>
              <button
                type="button"
                className="familia-editor__remover"
                onClick={() => remover(p.chave)}
                aria-label={`Remover ${p.nomeCompleto || `pessoa ${i + 1}`}`}
              >
                Remover
              </button>
            </div>
          ))}
          <button type="button" className="botao botao--secundario familia-editor__adicionar" onClick={adicionar}>
            + Adicionar participante
          </button>
        </fieldset>

        {confirmandoRemocao && (
          <div className="aviso aviso--erro" role="alert">
            {removidos.length === 1 ? 'Será removido: ' : `Serão removidos ${removidos.length} participantes: `}
            <strong>{removidos.map((c) => c.nomeCompleto).join(', ')}</strong>. Clique em “Confirmar e salvar” para
            continuar.
          </div>
        )}
        {erro && (
          <div className="aviso aviso--erro" role="alert">
            {erro}
          </div>
        )}

        <div className="modal__acoes">
          <button type="button" className="botao botao--secundario" onClick={onFechar} disabled={salvando}>
            Cancelar
          </button>
          <button type="submit" className="botao botao--primario" disabled={salvando}>
            {salvando ? 'Salvando…' : confirmandoRemocao ? 'Confirmar e salvar' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
