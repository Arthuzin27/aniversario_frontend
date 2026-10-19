import { useEffect, useId, useRef } from 'react';
import './Modal.css';

/**
 * Janela modal acessível: foca o conteúdo ao abrir, fecha com Esc (quando permitido)
 * e devolve o foco ao elemento que a abriu.
 */
export default function Modal({ titulo, onFechar, podeFechar = true, children }) {
  const tituloId = useId();
  const caixaRef = useRef(null);

  useEffect(() => {
    const anterior = document.activeElement;
    const primeiroCampo = caixaRef.current?.querySelector('input, button:not(.modal__fechar), textarea, select');
    (primeiroCampo ?? caixaRef.current)?.focus();
    return () => anterior?.focus?.();
  }, []);

  useEffect(() => {
    function aoTeclar(evento) {
      if (evento.key === 'Escape' && podeFechar) onFechar();
    }
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [onFechar, podeFechar]);

  return (
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && podeFechar && onFechar()}>
      <div className="modal__caixa" role="dialog" aria-modal="true" aria-labelledby={tituloId} ref={caixaRef} tabIndex={-1}>
        <div className="modal__topo">
          <h2 id={tituloId}>{titulo}</h2>
          <button type="button" className="modal__fechar" onClick={onFechar} disabled={!podeFechar} aria-label="Fechar">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
