export function formatDateToDDMMYYYY(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
}

export function formatDateToYYYYMMDD(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

export function parseDateFromDDMMYYYY(dateString: string): string | null {
  if (!dateString) return null;
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

export function isValidDDMMYYYY(dateString: string): boolean {
  return parseDateFromDDMMYYYY(dateString) !== null;
}

export function getDaysUntilExpiry(expiryDate: string | null): number {
  if (!expiryDate) return 0;
  try {
    const expiry = new Date(expiryDate);
    if (isNaN(expiry.getTime())) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

export function getExpiryStatus(
  expiryDate: string | null,
  alertDays: number = 3
): { text: string; variant: 'success' | 'info' | 'warning' | 'danger' | 'default'; days: number } {
  if (!expiryDate) {
    return { text: 'Sin fecha', variant: 'default', days: 0 };
  }
  const days = getDaysUntilExpiry(expiryDate);
  if (days < 0) return { text: 'Caducado', variant: 'danger', days };
  if (days === 0) return { text: 'Hoy', variant: 'danger', days };
  if (days <= alertDays) return { text: `${days}d`, variant: 'warning', days };
  if (days <= 7) return { text: `${days}d`, variant: 'info', days };
  return { text: `${days}d`, variant: 'success', days };
}

export function getRelativeTimeString(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) return `hace ${diffDays}d`;
  if (diffHours > 0) return `hace ${diffHours}h`;
  if (diffMinutes > 0) return `hace ${diffMinutes}m`;
  return 'ahora';
}