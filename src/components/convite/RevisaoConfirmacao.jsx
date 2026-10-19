import './ConfirmacaoForm.css';

export default function RevisaoConfirmacao({
  tituloRef,
  nomeFamilia,
  participantes,
  enviando,
  erro,
  onVoltar,
  onConfirmar,
}) {
  return (
    <section className="revisao" aria-labelledby="titulo-revisao">
      <h3 id="titulo-revisao" ref={tituloRef} tabIndex={-1}>
        Confira os dados antes de enviar
      </h3>

      <dl className="revisao__dados">
        <dt>Família</dt>
        <dd>{nomeFamilia}</dd>
        <dt>Quantidade de pessoas</dt>
        <dd>{participantes.length}</dd>
      </dl>

      <ol className="revisao__lista">
        {participantes.map((nome, i) => (
          <li key={i}>{nome}</li>
        ))}
      </ol>

      {erro && (
        <div className="aviso aviso--erro" role="alert">
          {erro}
        </div>
      )}

      <div className="revisao__acoes">
        <button type="button" className="botao botao--secundario" onClick={onVoltar} disabled={enviando}>
          Voltar e corrigir
        </button>
        <button
          type="button"
          className="botao botao--primario"
          onClick={onConfirmar}
          disabled={enviando}
          aria-busy={enviando}
        >
          {enviando ? 'Enviando…' : erro ? 'Tentar novamente' : 'Confirmar presença'}
        </button>
      </div>
    </section>
  );
}
