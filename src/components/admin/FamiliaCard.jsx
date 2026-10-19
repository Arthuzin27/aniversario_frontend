import { formatarDataHora } from '../../utils/data';
import './FamiliaCard.css';

export default function FamiliaCard({ familia, onVisualizar, onEditar, onExcluir }) {
  const pessoas = familia.quantidadePessoas === 1 ? '1 pessoa' : `${familia.quantidadePessoas} pessoas`;

  return (
    <article className="familia-card" aria-labelledby={`familia-${familia.id}`}>
      <div className="familia-card__topo">
        <h2 id={`familia-${familia.id}`}>{familia.nome}</h2>
        <span className="familia-card__contagem">{pessoas}</span>
      </div>

      {familia.possivelDuplicata && (
        <p className="familia-card__alerta">
          Possível duplicidade: existe outra família cadastrada com este mesmo nome.
        </p>
      )}

      <ul className="familia-card__integrantes">
        {familia.convidados.map((c) => (
          <li key={c.id}>{c.nomeCompleto}</li>
        ))}
      </ul>

      <div className="familia-card__rodape">
        <span className="familia-card__data">Cadastrada em {formatarDataHora(familia.dataCadastro)}</span>
        <div className="familia-card__acoes">
          <button type="button" onClick={() => onVisualizar(familia)}>
            Visualizar<span className="visualmente-oculto"> {familia.nome}</span>
          </button>
          <button type="button" onClick={() => onEditar(familia)}>
            Editar<span className="visualmente-oculto"> {familia.nome}</span>
          </button>
          <button type="button" className="familia-card__excluir" onClick={() => onExcluir(familia)}>
            Excluir<span className="visualmente-oculto"> {familia.nome}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
