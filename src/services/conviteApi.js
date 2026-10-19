import { requisitarJson } from './http';

export function buscarConfiguracao() {
  return requisitarJson('/api/public/configuracao');
}

/**
 * Envia a confirmação. A chave de idempotência faz com que um reenvio da MESMA tentativa
 * (clique duplo, nova tentativa após falha de rede) não gere um cadastro duplicado.
 */
export function enviarConfirmacao({ nome, quantidadePessoas, convidados }, chaveIdempotencia) {
  return requisitarJson('/api/public/familias', {
    metodo: 'POST',
    corpo: { nome, quantidadePessoas, convidados },
    cabecalhos: { 'Idempotency-Key': chaveIdempotencia },
  });
}
