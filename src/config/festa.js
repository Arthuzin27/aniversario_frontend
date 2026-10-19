// Dados da festa exibidos no convite. Configure pelas variáveis VITE_FESTA_* (.env.local ou Vercel);
// nenhuma alteração de código é necessária para trocar nome, data, horário ou endereço.
const env = import.meta.env;

function texto(valor) {
  return typeof valor === 'string' && valor.trim() !== '' ? valor.trim() : null;
}

export const festa = {
  aniversariante: texto(env.VITE_FESTA_ANIVERSARIANTE) ?? 'Aniversariante',
  data: texto(env.VITE_FESTA_DATA),
  horario: texto(env.VITE_FESTA_HORARIO),
  local: texto(env.VITE_FESTA_LOCAL),
  endereco: texto(env.VITE_FESTA_ENDERECO),
  mapaUrl: texto(env.VITE_FESTA_MAPA_URL),
  traje: texto(env.VITE_FESTA_TRAJE),
  prazoConfirmacao: texto(env.VITE_FESTA_PRAZO_CONFIRMACAO),
  mensagem:
    texto(env.VITE_FESTA_MENSAGEM) ??
    'Com muita alegria, convido você e sua família para celebrar comigo esta data tão especial.',
};

/** Formata "2026-12-12" como "sábado, 12 de dezembro de 2026" (sem problemas de fuso horário). */
export function formatarDataFesta(iso, opcoes = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!iso) return null;
  const [ano, mes, dia] = iso.split('-').map(Number);
  if (!ano || !mes || !dia) return iso;
  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', opcoes);
}
