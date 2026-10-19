import { useEffect, useState } from 'react';
import ConfirmacaoForm from '../../components/convite/ConfirmacaoForm';
import { LIMITE_PADRAO } from '../../components/convite/validacaoConfirmacao';
import { festa, formatarDataFesta } from '../../config/festa';
import { buscarConfiguracao } from '../../services/conviteApi';
import './ConvitePage.css';

function Ornamento({ className }) {
  return (
    <svg className={className} viewBox="0 0 200 60" aria-hidden="true" focusable="false">
      <path d="M10 30 Q55 5 100 30 T190 30" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <g fill="currentColor" opacity="0.85">
        <circle cx="100" cy="30" r="5" />
        <ellipse cx="88" cy="24" rx="7" ry="3.5" transform="rotate(-30 88 24)" />
        <ellipse cx="112" cy="24" rx="7" ry="3.5" transform="rotate(30 112 24)" />
        <ellipse cx="88" cy="37" rx="7" ry="3.5" transform="rotate(30 88 37)" />
        <ellipse cx="112" cy="37" rx="7" ry="3.5" transform="rotate(-30 112 37)" />
        <circle cx="45" cy="21" r="2.5" />
        <circle cx="155" cy="39" r="2.5" />
      </g>
    </svg>
  );
}

export default function ConvitePage() {
  const [limite, setLimite] = useState(LIMITE_PADRAO);

  useEffect(() => {
    let ativo = true;
    buscarConfiguracao()
      .then((config) => ativo && config?.maxParticipantes && setLimite(config.maxParticipantes))
      .catch(() => {
        // Mantém o limite padrão; o backend valida de qualquer forma.
      });
    return () => {
      ativo = false;
    };
  }, []);

  const data = formatarDataFesta(festa.data);
  const prazo = formatarDataFesta(festa.prazoConfirmacao, { day: 'numeric', month: 'long' });

  return (
    <main className="convite">
      <header className="convite__capa">
        <Ornamento className="convite__ornamento" />
        <p className="convite__chamada">Meus 15 anos</p>
        <h1 className="convite__nome">{festa.aniversariante}</h1>
        <p className="convite__mensagem">{festa.mensagem}</p>
        <Ornamento className="convite__ornamento convite__ornamento--invertido" />
      </header>

      {(data || festa.horario || festa.local || festa.endereco || festa.traje) && (
        <section className="convite__detalhes" aria-label="Informações da festa">
          {data && (
            <div className="detalhe">
              <span className="detalhe__rotulo">Data</span>
              <span className="detalhe__valor">{data}</span>
            </div>
          )}
          {festa.horario && (
            <div className="detalhe">
              <span className="detalhe__rotulo">Horário</span>
              <span className="detalhe__valor">{festa.horario}</span>
            </div>
          )}
          {(festa.local || festa.endereco) && (
            <div className="detalhe detalhe--largo">
              <span className="detalhe__rotulo">Local</span>
              {festa.local && <span className="detalhe__valor">{festa.local}</span>}
              {festa.endereco && <span className="detalhe__complemento">{festa.endereco}</span>}
              {festa.mapaUrl && (
                <a className="detalhe__link" href={festa.mapaUrl} target="_blank" rel="noopener noreferrer">
                  Ver no mapa
                </a>
              )}
            </div>
          )}
          {festa.traje && (
            <div className="detalhe">
              <span className="detalhe__rotulo">Traje</span>
              <span className="detalhe__valor">{festa.traje}</span>
            </div>
          )}
        </section>
      )}

      <section className="convite__rsvp" aria-labelledby="titulo-rsvp">
        <h2 id="titulo-rsvp">Confirme sua presença</h2>
        <p className="convite__rsvp-texto">
          Preencha os dados da sua família{prazo ? ` até ${prazo}` : ''}. Leva menos de um minuto.
        </p>
        <ConfirmacaoForm limite={limite} />
      </section>

      <footer className="convite__rodape">Com carinho, {festa.aniversariante}</footer>
    </main>
  );
}
