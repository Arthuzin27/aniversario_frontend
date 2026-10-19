import { useCallback, useEffect, useState } from 'react';
import FamiliaCard from '../../components/admin/FamiliaCard';
import FamiliaDetalhes from '../../components/admin/FamiliaDetalhes';
import FamiliaEditor from '../../components/admin/FamiliaEditor';
import Modal from '../../components/admin/Modal';
import Paginacao from '../../components/admin/Paginacao';
import { excluirFamilia, listarFamilias } from '../../services/adminApi';
import './FamiliasPage.css';

const TAMANHO_PAGINA = 10;

export default function FamiliasPage() {
  const [busca, setBusca] = useState('');
  const [termo, setTermo] = useState('');
  const [pagina, setPagina] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [mensagem, setMensagem] = useState(null);
  const [visualizando, setVisualizando] = useState(null);
  const [editando, setEditando] = useState(null);
  const [excluindo, setExcluindo] = useState(null);
  const [excluindoAgora, setExcluindoAgora] = useState(false);
  const [erroExclusao, setErroExclusao] = useState(null);

  // Aguarda o usuário parar de digitar antes de consultar a API.
  useEffect(() => {
    const timer = setTimeout(() => {
      setTermo(busca.trim());
      setPagina(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [busca]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await listarFamilias({ busca: termo, pagina, tamanho: TAMANHO_PAGINA });
      // Se a página atual ficou vazia (ex.: após excluir o último item), volta uma página.
      if (dados.conteudo.length === 0 && pagina > 0) {
        setPagina(pagina - 1);
        return;
      }
      setResultado(dados);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [termo, pagina]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function confirmarExclusao() {
    setExcluindoAgora(true);
    setErroExclusao(null);
    try {
      await excluirFamilia(excluindo.id);
      setMensagem(`${excluindo.nome} foi excluída.`);
      setExcluindo(null);
      await carregar();
    } catch (e) {
      setErroExclusao(e.message);
    } finally {
      setExcluindoAgora(false);
    }
  }

  async function aoSalvar(familia) {
    setEditando(null);
    setMensagem(`${familia.nome} foi atualizada.`);
    await carregar();
  }

  const familias = resultado?.conteudo ?? [];

  return (
    <section className="familias" aria-labelledby="titulo-familias">
      <div className="pagina-admin__cabecalho">
        <h1 id="titulo-familias">Famílias confirmadas</h1>
        {resultado && (
          <span className="familias__total">
            {resultado.totalElementos} {resultado.totalElementos === 1 ? 'família' : 'famílias'}
            {termo ? ' encontradas' : ''}
          </span>
        )}
      </div>

      <div className="campo familias__busca">
        <label htmlFor="busca">Buscar por família ou participante</label>
        <input
          id="busca"
          type="search"
          placeholder="Ex.: Silva, Ana…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div aria-live="polite" className="familias__status">
        {mensagem && <div className="aviso aviso--info">{mensagem}</div>}
      </div>

      {erro && (
        <div className="aviso aviso--erro" role="alert">
          {erro}{' '}
          <button type="button" className="familias__tentar" onClick={carregar}>
            Tentar novamente
          </button>
        </div>
      )}

      {carregando && !resultado && <p>Carregando famílias…</p>}

      {resultado && familias.length === 0 && !carregando && (
        <p className="familias__vazio">
          {termo ? 'Nenhuma família encontrada para essa busca.' : 'Nenhuma confirmação recebida ainda.'}
        </p>
      )}

      <div className="familias__lista" aria-busy={carregando}>
        {familias.map((familia) => (
          <FamiliaCard
            key={familia.id}
            familia={familia}
            onVisualizar={setVisualizando}
            onEditar={(f) => {
              setMensagem(null);
              setEditando(f);
            }}
            onExcluir={(f) => {
              setMensagem(null);
              setErroExclusao(null);
              setExcluindo(f);
            }}
          />
        ))}
      </div>

      {resultado && (
        <Paginacao
          pagina={resultado.pagina}
          totalPaginas={resultado.totalPaginas}
          onMudar={setPagina}
          desabilitado={carregando}
        />
      )}

      {visualizando && <FamiliaDetalhes id={visualizando.id} onFechar={() => setVisualizando(null)} />}

      {editando && <FamiliaEditor familia={editando} onFechar={() => setEditando(null)} onSalvo={aoSalvar} />}

      {excluindo && (
        <Modal titulo="Excluir família" onFechar={() => setExcluindo(null)} podeFechar={!excluindoAgora}>
          <p>
            Tem certeza que deseja excluir a <strong>{excluindo.nome}</strong>{' '}
            {excluindo.quantidadePessoas === 1
              ? 'e seu único participante'
              : `e seus ${excluindo.quantidadePessoas} participantes`}
            ? Esta ação não pode ser desfeita.
          </p>
          {erroExclusao && (
            <div className="aviso aviso--erro" role="alert">
              {erroExclusao}
            </div>
          )}
          <div className="modal__acoes">
            <button
              type="button"
              className="botao botao--secundario"
              onClick={() => setExcluindo(null)}
              disabled={excluindoAgora}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="botao familias__botao-excluir"
              onClick={confirmarExclusao}
              disabled={excluindoAgora}
            >
              {excluindoAgora ? 'Excluindo…' : 'Excluir definitivamente'}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
