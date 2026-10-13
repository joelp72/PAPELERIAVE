/**
 * Currency & Number formatters tailored for Venezuela
 */

export function formatBs(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Bs. 0,00';
  return 'Bs. ' + amount.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatUsd(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '$0.00';
  return '$' + amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCompactNumber(val: number): string {
  return val.toLocaleString('es-VE');
}

export function convertUsdToBs(usd: number, rate: number): number {
  if (!usd || !rate) return 0;
  return Math.round(usd * rate * 100) / 100;
}

export function convertBsToUsd(bs: number, rate: number): number {
  if (!bs || !rate || rate === 0) return 0;
  return Math.round((bs / rate) * 100) / 100;
}

export function calculateMargin(cost: number, price: number): number {
  if (!cost || cost <= 0 || !price) return 0;
  return Math.round(((price - cost) / cost) * 100);
}

export function generateReceiptNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `REC-${year}${month}${day}-${random}`;
}

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}
