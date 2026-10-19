import './Paginacao.css';

export default function Paginacao({ pagina, totalPaginas, onMudar, desabilitado }) {
  if (totalPaginas <= 1) return null;
  return (
    <nav className="paginacao" aria-label="Paginação">
      <button type="button" onClick={() => onMudar(pagina - 1)} disabled={desabilitado || pagina === 0}>
        ‹ Anterior
      </button>
      <span aria-current="page">
        Página {pagina + 1} de {totalPaginas}
      </span>
      <button type="button" onClick={() => onMudar(pagina + 1)} disabled={desabilitado || pagina + 1 >= totalPaginas}>
        Próxima ›
      </button>
    </nav>
  );
}
