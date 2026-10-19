import { useEffect, useRef, useState } from 'react';
import { enviarConfirmacao } from '../../services/conviteApi';
import RevisaoConfirmacao from './RevisaoConfirmacao';
import {
  errosDaApi,
  gerarChave,
  normalizarNome,
  quantidadeValida,
  validarConfirmacao,
} from './validacaoConfirmacao';
import './ConfirmacaoForm.css';

const CHAVE_ULTIMO_ENVIO = 'convite15:ultima-confirmacao';

function lerUltimoEnvio() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_ULTIMO_ENVIO));
  } catch {
    return null;
  }
}

function salvarUltimoEnvio(nome) {
  try {
    localStorage.setItem(CHAVE_ULTIMO_ENVIO, JSON.stringify({ nome, em: new Date().toISOString() }));
  } catch {
    // armazenamento indisponível: apenas não mostraremos o aviso
  }
}

export default function ConfirmacaoForm({ limite }) {
  const [nomeFamilia, setNomeFamilia] = useState('');
  const [quantidade, setQuantidade] = useState('');
  // Guarda nomes já digitados mesmo se a quantidade diminuir e voltar a aumentar.
  const [nomes, setNomes] = useState([]);
  const [erros, setErros] = useState({});
  const [etapa, setEtapa] = useState('preencher');
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);
  const [ultimoEnvio, setUltimoEnvio] = useState(lerUltimoEnvio);
  const chaveRef = useRef(gerarChave());
  const enviandoRef = useRef(false);
  const resumoErrosRef = useRef(null);
  const tituloEtapaRef = useRef(null);

  const total = quantidadeValida(quantidade, limite);
  const participantes = nomes.slice(0, total).map((n) => normalizarNome(n ?? ''));

  useEffect(() => {
    if (etapa !== 'preencher') tituloEtapaRef.current?.focus();
  }, [etapa]);

  function alterarNome(indice, valor) {
    setNomes((atuais) => {
      const copia = [...atuais];
      copia[indice] = valor;
      return copia;
    });
  }

  function revisar(evento) {
    evento.preventDefault();
    const encontrados = validarConfirmacao({ nomeFamilia, quantidade, nomes }, limite);
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) {
      requestAnimationFrame(() => resumoErrosRef.current?.focus());
      return;
    }
    setErroEnvio(null);
    setEtapa('revisar');
  }

  async function confirmar() {
    if (enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    setErroEnvio(null);
    try {
      const resposta = await enviarConfirmacao(
        { nome: normalizarNome(nomeFamilia), quantidadePessoas: total, convidados: participantes },
        chaveRef.current,
      );
      salvarUltimoEnvio(resposta.nome);
      setConfirmacao(resposta);
      setEtapa('enviado');
    } catch (erro) {
      if (erro.status === 400 && erro.campos?.length) {
        setErros(errosDaApi(erro.campos));
        setEtapa('preencher');
      } else {
        setErroEnvio(erro.message);
      }
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  }

  function novaConfirmacao() {
    chaveRef.current = gerarChave();
    setNomeFamilia('');
    setQuantidade('');
    setNomes([]);
    setErros({});
    setConfirmacao(null);
    setUltimoEnvio(lerUltimoEnvio());
    setEtapa('preencher');
  }

  if (etapa === 'enviado' && confirmacao) {
    return (
      <div className="confirmacao-sucesso" role="status">
        <h3 ref={tituloEtapaRef} tabIndex={-1}>
          Presença confirmada!
        </h3>
        <p>{confirmacao.mensagem}</p>
        <p className="confirmacao-sucesso__resumo">
          {confirmacao.quantidadePessoas} {confirmacao.quantidadePessoas === 1 ? 'pessoa confirmada' : 'pessoas confirmadas'}:
        </p>
        <ul>
          {confirmacao.convidados.map((nome, i) => (
            <li key={i}>{nome}</li>
          ))}
        </ul>
        <p className="confirmacao-sucesso__nota">
          Não é necessário enviar novamente. Se precisar corrigir algum dado, fale com a família da aniversariante.
        </p>
        <button type="button" className="botao botao--secundario" onClick={novaConfirmacao}>
          Confirmar outra família
        </button>
      </div>
    );
  }

  if (etapa === 'revisar') {
    return (
      <RevisaoConfirmacao
        tituloRef={tituloEtapaRef}
        nomeFamilia={normalizarNome(nomeFamilia)}
        participantes={participantes}
        enviando={enviando}
        erro={erroEnvio}
        onVoltar={() => setEtapa('preencher')}
        onConfirmar={confirmar}
      />
    );
  }

  const listaErros = [
    erros.geral,
    erros.nomeFamilia,
    erros.quantidade,
    ...Object.values(erros.nomes ?? {}),
  ].filter(Boolean);

  return (
    <form className="confirmacao-form" onSubmit={revisar} noValidate>
      {ultimoEnvio?.nome && (
        <div className="aviso aviso--info">
          Este aparelho já enviou a confirmação da <strong>{ultimoEnvio.nome}</strong>. Se for a mesma família, não é
          preciso enviar de novo — um novo envio cria outro cadastro.
        </div>
      )}

      {listaErros.length > 0 && (
        <div className="aviso aviso--erro" role="alert" tabIndex={-1} ref={resumoErrosRef}>
          <p>Verifique os campos abaixo:</p>
          <ul>
            {listaErros.map((mensagem, i) => (
              <li key={i}>{mensagem}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="campo">
        <label htmlFor="nome-familia">Nome da família</label>
        <input
          id="nome-familia"
          type="text"
          placeholder="Ex.: Família Silva"
          autoComplete="family-name"
          maxLength={120}
          value={nomeFamilia}
          onChange={(e) => setNomeFamilia(e.target.value)}
          aria-invalid={Boolean(erros.nomeFamilia)}
          aria-describedby={erros.nomeFamilia ? 'erro-nome-familia' : undefined}
        />
        {erros.nomeFamilia && (
          <span id="erro-nome-familia" className="campo__erro">
            {erros.nomeFamilia}
          </span>
        )}
      </div>

      <div className="campo campo--curto">
        <label htmlFor="quantidade">Quantas pessoas irão à festa?</label>
        <input
          id="quantidade"
          type="number"
          inputMode="numeric"
          min={1}
          max={limite}
          step={1}
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          aria-invalid={Boolean(erros.quantidade)}
          aria-describedby={erros.quantidade ? 'erro-quantidade' : 'ajuda-quantidade'}
        />
        {erros.quantidade ? (
          <span id="erro-quantidade" className="campo__erro">
            {erros.quantidade}
          </span>
        ) : (
          <span id="ajuda-quantidade" className="campo__ajuda">
            Conte todas as pessoas, inclusive você (máximo de {limite}).
          </span>
        )}
      </div>

      {total > 0 && (
        <fieldset className="participantes">
          <legend>Nome completo de cada pessoa</legend>
          {Array.from({ length: total }, (_, i) => (
            <div className="campo" key={i}>
              <label htmlFor={`participante-${i}`}>Pessoa {i + 1}</label>
              <input
                id={`participante-${i}`}
                type="text"
                autoComplete="off"
                maxLength={150}
                value={nomes[i] ?? ''}
                onChange={(e) => alterarNome(i, e.target.value)}
                aria-invalid={Boolean(erros.nomes?.[i])}
                aria-describedby={erros.nomes?.[i] ? `erro-participante-${i}` : undefined}
              />
              {erros.nomes?.[i] && (
                <span id={`erro-participante-${i}`} className="campo__erro">
                  {erros.nomes[i]}
                </span>
              )}
            </div>
          ))}
        </fieldset>
      )}

      <button type="submit" className="botao botao--primario">
        Revisar confirmação
      </button>
    </form>
  );
}
