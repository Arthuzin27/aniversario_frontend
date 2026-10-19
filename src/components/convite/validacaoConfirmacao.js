// Regras do formulário público. O backend repete todas estas validações (fonte da verdade).

export const LIMITE_PADRAO = 30;

export function normalizarNome(valor) {
  return valor.trim().replace(/\s+/g, ' ');
}

/** Retorna a quantidade como número se for um inteiro entre 1 e o limite; caso contrário, 0. */
export function quantidadeValida(valor, limite) {
  if (!/^\d+$/.test(String(valor).trim())) return 0;
  const numero = Number(valor);
  return numero >= 1 && numero <= limite ? numero : 0;
}

export function validarConfirmacao({ nomeFamilia, quantidade, nomes }, limite) {
  const erros = {};
  if (!normalizarNome(nomeFamilia)) {
    erros.nomeFamilia = 'Informe o nome da família.';
  }

  const texto = String(quantidade).trim();
  if (!texto) {
    erros.quantidade = 'Informe quantas pessoas irão à festa.';
  } else if (!/^\d+$/.test(texto) || Number(texto) < 1) {
    erros.quantidade = 'A quantidade deve ser um número inteiro maior que zero.';
  } else if (Number(texto) > limite) {
    erros.quantidade = `O limite é de ${limite} pessoas por família.`;
  }

  const total = quantidadeValida(quantidade, limite);
  const errosNomes = {};
  for (let i = 0; i < total; i++) {
    if (!normalizarNome(nomes[i] ?? '')) {
      errosNomes[i] = `Preencha o nome completo da pessoa ${i + 1}.`;
    }
  }
  if (Object.keys(errosNomes).length > 0) erros.nomes = errosNomes;
  return erros;
}

/** Converte os erros de campo devolvidos pela API para o formato do formulário. */
export function errosDaApi(campos = []) {
  const erros = {};
  for (const { campo, mensagem } of campos) {
    const indice = /^convidados\[(\d+)\]/.exec(campo);
    if (campo === 'nome') erros.nomeFamilia = mensagem;
    else if (campo === 'quantidadePessoas') erros.quantidade = mensagem;
    else if (indice) erros.nomes = { ...erros.nomes, [Number(indice[1])]: mensagem };
    else erros.geral = mensagem;
  }
  return erros;
}

/** UUID v4 para a chave de idempotência (com alternativa para navegadores sem crypto.randomUUID). */
export function gerarChave() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
