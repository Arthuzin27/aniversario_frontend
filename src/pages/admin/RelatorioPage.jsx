import { useState } from 'react';
import { baixarRelatorio, buscarRelatorio } from '../../services/adminApi';
import { formatarDataHora } from '../../utils/data';
import './RelatorioPage.css';

function salvarArquivo({ blob, nomeArquivo }) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function RelatorioPage() {
  const [relatorio, setRelatorio] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [baixando, setBaixando] = useState(null);
  const [erro, setErro] = useState(null);

  async function visualizar() {
    setCarregando(true);
    setErro(null);
    try {
      setRelatorio(await buscarRelatorio());
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  async function exportar(formato) {
    setBaixando(formato);
    setErro(null);
    try {
      salvarArquivo(await baixarRelatorio(formato));
    } catch (e) {
      setErro(e.message);
    } finally {
      setBaixando(null);
    }
  }

  return (
    <section className="relatorio" aria-labelledby="titulo-relatorio">
      <div className="pagina-admin__cabecalho relatorio__cabecalho">
        <h1 id="titulo-relatorio">Relatório de convidados</h1>
        <div className="relatorio__acoes">
          <button type="button" className="botao botao--primario" onClick={visualizar} disabled={carregando}>
            {carregando ? 'Gerando…' : relatorio ? 'Atualizar visualização' : 'Visualizar relatório'}
          </button>
          <button
            type="button"
            className="botao botao--secundario"
            onClick={() => exportar('pdf')}
            disabled={baixando !== null}
          >
            {baixando === 'pdf' ? 'Baixando…' : 'Exportar PDF'}
          </button>
          <button
            type="button"
            className="botao botao--secundario"
            onClick={() => exportar('csv')}
            disabled={baixando !== null}
          >
            {baixando === 'csv' ? 'Baixando…' : 'Exportar CSV (Excel)'}
          </button>
        </div>
      </div>

      <p className="relatorio__ajuda">
        Lista de todos os convidados em ordem alfabética, com a família de cada um. Os dados são gerados no momento da
        consulta e refletem as últimas edições.
      </p>

      {erro && (
        <div className="aviso aviso--erro" role="alert">
          {erro}
        </div>
      )}

      {relatorio && (
        <article className="relatorio__documento" aria-label="Pré-visualização do relatório">
          <h2>{relatorio.titulo}</h2>
          <p className="relatorio__data">Gerado em {formatarDataHora(relatorio.geradoEm)}</p>
          {relatorio.convidados.length === 0 ? (
            <p>Nenhum convidado cadastrado.</p>
          ) : (
            <ol className="relatorio__lista">
              {relatorio.convidados.map((item) => (
                <li key={item.numero} value={item.numero}>
                  <span className="relatorio__nome">{item.nomeCompleto}</span>
                  <span className="relatorio__familia"> — {item.familia}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="relatorio__total">TOTAL DE PESSOAS: {relatorio.totalPessoas}</p>
        </article>
      )}
    </section>
  );
}
