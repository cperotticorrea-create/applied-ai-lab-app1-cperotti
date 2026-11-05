import Papa from 'papaparse';
import { SalesOrder } from '../types';

export interface ParseResult {
  orders: SalesOrder[];
  errors: string[];
  warnings: string[];
  columnsFound: string[];
  missingColumns: string[];
}

const REQUIRED_FIELDS = [
  'quarter',
  'region',
  'channel',
  'product',
  'units',
  'discount_pct',
  'revenue',
] as const;

type RequiredField = (typeof REQUIRED_FIELDS)[number];

const FIELD_ALIASES: Record<RequiredField, string[]> = {
  quarter: ['quarter', 'qtr', 'quarter_name', 'period', 'fiscal_quarter'],
  region: ['region', 'territory', 'geography', 'geo', 'area', 'zone'],
  channel: ['channel', 'sales_channel', 'distribution_channel', 'route'],
  product: ['product', 'item', 'product_name', 'offering', 'sku'],
  units: ['units', 'quantity', 'qty', 'volume', 'units_sold', 'count'],
  discount_pct: ['discount_pct', 'discount', 'discount_rate', 'disc_pct', 'discount_percentage', 'discount_%'],
  revenue: ['revenue', 'sales', 'total_revenue', 'sales_amount', 'amount', 'net_sales', 'rev'],
};

function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().replace(/[\s\-_]+/g, '_');
}

function parseNumber(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  // Strip currency symbols, commas, percent signs, and spaces
  const cleaned = String(val).replace(/[\$,\s]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseDiscount(val: any): number {
  if (typeof val === 'number') {
    // If it's e.g. 15 instead of 0.15, convert to 0.15
    return val > 1 ? val / 100 : val;
  }
  if (!val) return 0;
  const str = String(val).trim();
  const hasPercent = str.includes('%');
  const cleaned = str.replace(/[%,\s\$]/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  if (hasPercent || num > 1) {
    return num / 100;
  }
  return num;
}

export function normalizeRegionName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  // Unify case variations (e.g., "west" and "West" -> "West", "north america" -> "North America")
  return trimmed
    .split(/\s+/)
    .map((word) => {
      if (word.includes('-')) {
        return word
          .split('-')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join('-');
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

export function normalizeQuarterName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  // Standardize quarter names (e.g., "q1" -> "Q1")
  return trimmed.replace(/\bq([1-4])\b/gi, (_, n) => `Q${n}`);
}

export function parseCsvString(csvContent: string): ParseResult {
  const result: ParseResult = {
    orders: [],
    errors: [],
    warnings: [],
    columnsFound: [],
    missingColumns: [],
  };

  const parsed = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => normalizeHeader(header),
  });

  if (parsed.errors && parsed.errors.length > 0) {
    parsed.errors.forEach((e) => result.errors.push(`Row ${e.row ?? '?'}: ${e.message}`));
  }

  const rawHeaders = parsed.meta.fields || [];
  result.columnsFound = rawHeaders;

  // Map required fields to actual header names
  const headerMap: Partial<Record<RequiredField, string>> = {};

  REQUIRED_FIELDS.forEach((field) => {
    const aliases = FIELD_ALIASES[field];
    const match = rawHeaders.find((h) => aliases.includes(h));
    if (match) {
      headerMap[field] = match;
    } else {
      result.missingColumns.push(field);
    }
  });

  if (result.missingColumns.length > 0) {
    result.errors.push(
      `Missing required column(s): ${result.missingColumns.join(', ')}. Found: ${rawHeaders.join(', ') || 'none'}.`
    );
    return result;
  }

  const dataRows = parsed.data as Record<string, any>[];

  dataRows.forEach((row, idx) => {
    const quarter = normalizeQuarterName(String(row[headerMap.quarter!] ?? ''));
    const region = normalizeRegionName(String(row[headerMap.region!] ?? ''));
    const channel = String(row[headerMap.channel!] ?? '').trim();
    const product = String(row[headerMap.product!] ?? '').trim();
    const units = parseNumber(row[headerMap.units!]);
    const discount_pct = parseDiscount(row[headerMap.discount_pct!]);
    const revenue = parseNumber(row[headerMap.revenue!]);

    if (!quarter && !region && revenue === 0) {
      // Empty row
      return;
    }

    if (!quarter || !region) {
      result.warnings.push(`Row ${idx + 2}: skipped because quarter or region was missing.`);
      return;
    }

    result.orders.push({
      id: `order-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
      quarter,
      region,
      channel: channel || 'Direct',
      product: product || 'Standard Product',
      units,
      discount_pct,
      revenue,
    });
  });

  return result;
}
