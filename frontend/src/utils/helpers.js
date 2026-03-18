export const formatCurrency = (amount) => {
  const number = parseFloat(amount) || 0;
  // Usar formato europeo (es-ES / de-DE) para forzar los puntos en miles
  const formattedNumber = Math.round(number).toLocaleString('de-DE');
  return `$${formattedNumber}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};

// Utilidad simple para Tailwind class merging
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
