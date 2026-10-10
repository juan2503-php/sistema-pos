export const formatCurrency = (amount) => {
  const number = parseFloat(amount) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number);
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

// Convierte una ruta relativa del backend (/uploads/...) en URL completa
export function getAssetUrl(path) {
  if (!path) return null;
  // Si la ruta ya es una URL absoluta (ej. Cloudinary, S3), la retornamos tal cual
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:image')) {
    return path;
  }
  
  const baseUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
