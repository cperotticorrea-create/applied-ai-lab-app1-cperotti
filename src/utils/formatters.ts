export function formatUSD(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return '$0.00';
  const hasDecimals = Math.abs(val % 1) > 0.005;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(val);
}

export function formatCompactUSD(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return '$0';
  if (Math.abs(val) >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(1)}k`;
  return `$${val.toFixed(0)}`;
}

export function formatPct(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return '0.0%';
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(1)}%`;
}
