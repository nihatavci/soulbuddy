/**
 * Locale-aware formatters for Fliq.
 * Uses native Intl API — no additional packages needed.
 * Hermes engine (RN 0.81.5) supports Intl natively.
 *
 * Romanian conventions (ro-RO):
 *   Date: dd.MM.yyyy (e.g., 29.03.2026)
 *   Time: 24-hour (HH:mm)
 *   Thousands: dot separator
 *   Decimal: comma
 *   Currency: RON after number (999,99 lei)
 */

export function formatDate(date: Date, lang: string): string {
  const locale = lang === 'ro' ? 'ro-RO' : lang === 'tr' ? 'tr-TR' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatTime(date: Date, lang: string): string {
  const locale = lang === 'ro' ? 'ro-RO' : lang === 'tr' ? 'tr-TR' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: lang !== 'ro' && lang !== 'tr',
  }).format(date);
}

export function formatCurrency(amount: number, lang: string): string {
  if (lang === 'ro') {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
