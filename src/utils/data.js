const formatoDataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

/** "2026-10-16T13:55:00Z" → "16/10/2026, 10:55" (no fuso do navegador). */
export function formatarDataHora(iso) {
  if (!iso) return '';
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? '' : formatoDataHora.format(data);
}
