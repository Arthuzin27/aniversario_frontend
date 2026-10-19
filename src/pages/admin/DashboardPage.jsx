import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { buscarEstatisticas } from '../../services/adminApi';
import './DashboardPage.css';

const numero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

export default function DashboardPage() {
  const [estatisticas, setEstatisticas] = useState(null);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setEstatisticas(await buscarEstatisticas());
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <section className="dashboard" aria-labelledby="titulo-dashboard">
      <div className="pagina-admin__cabecalho">
        <h1 id="titulo-dashboard">Resumo das confirmações</h1>
        <button type="button" className="botao botao--secundario" onClick={carregar} disabled={carregando}>
          Atualizar
        </button>
      </div>

      {erro && (
        <div className="aviso aviso--erro" role="alert">
          {erro}
        </div>
      )}

      {carregando && !estatisticas && <p aria-live="polite">Carregando indicadores…</p>}

      {estatisticas && (
        <div className="dashboard__indicadores" aria-busy={carregando}>
          <article className="indicador indicador--destaque">
            <h2>Total de pessoas</h2>
            <p className="indicador__valor">{estatisticas.totalPessoas}</p>
          </article>
          <article className="indicador">
            <h2>Famílias cadastradas</h2>
            <p className="indicador__valor">{estatisticas.totalFamilias}</p>
          </article>
          <article className="indicador">
            <h2>Média por família</h2>
            <p className="indicador__valor">{numero.format(estatisticas.mediaPessoasPorFamilia)}</p>
          </article>
        </div>
      )}

      <div className="dashboard__atalhos">
        <Link className="botao botao--primario" to="/admin/familias">
          Ver famílias
        </Link>
        <Link className="botao botao--secundario" to="/admin/relatorio">
          Gerar relatório
        </Link>
      </div>
    </section>
  );
}
