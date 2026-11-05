import React, { useState } from 'react';
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Download,
  Flame,
  Layers,
  Package,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { CalculatedAnalysis, RegionQuarterMatrix, SalesOrder } from '../types';
import { calculateDriversForRegion } from '../utils/calculations';
import { formatUSD } from '../utils/formatters';

interface RevenueTableProps {
  analysis: CalculatedAnalysis;
  rawOrders: SalesOrder[];
}

type SortField = 'region' | 'totalRevenue' | 'revenueChange' | 'percentageChange' | string;
type SortOrder = 'asc' | 'desc';

export const RevenueTable: React.FC<RevenueTableProps> = ({ analysis, rawOrders }) => {
  const [sortField, setSortField] = useState<SortField>('totalRevenue');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

  const { quarters, matrix, quarterTotals, grandTotalRevenue, hasQ2AndQ3, q2Key, q3Key, mostChangedRegion } =
    analysis;

  if (matrix.length === 0) return null;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Sort rows
  const sortedMatrix = [...matrix].sort((a, b) => {
    let aVal: any = 0;
    let bVal: any = 0;

    if (sortField === 'region') {
      aVal = a.region.toLowerCase();
      bVal = b.region.toLowerCase();
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    } else if (sortField === 'totalRevenue') {
      aVal = a.totalRevenue;
      bVal = b.totalRevenue;
    } else if (sortField === 'revenueChange') {
      aVal = a.revenueChange;
      bVal = b.revenueChange;
    } else if (sortField === 'percentageChange') {
      aVal = a.percentageChange;
      bVal = b.percentageChange;
    } else if (quarters.includes(sortField)) {
      aVal = a.quarterRevenues[sortField] || 0;
      bVal = b.quarterRevenues[sortField] || 0;
    }

    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const exportTableCsv = () => {
    const headers = ['Region', ...quarters, 'Total Revenue'];
    if (hasQ2AndQ3) {
      headers.push(`${q2Key} to ${q3Key} Delta`, `${q2Key} to ${q3Key} % Change`);
    }

    const rows = sortedMatrix.map((r) => {
      const row = [r.region, ...quarters.map((q) => r.quarterRevenues[q] || 0), r.totalRevenue];
      if (hasQ2AndQ3) {
        row.push(r.revenueChange, `${r.percentageChange.toFixed(2)}%`);
      }
      return row.join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'regional_quarterly_revenue_matrix.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Total Q2 to Q3 change across all regions
  const totalQ2Rev = hasQ2AndQ3 ? quarterTotals[q2Key] || 0 : 0;
  const totalQ3Rev = hasQ2AndQ3 ? quarterTotals[q3Key] || 0 : 0;
  const totalChange = totalQ3Rev - totalQ2Rev;
  const totalPctChange = totalQ2Rev > 0 ? (totalChange / totalQ2Rev) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Table Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">
              Regional Revenue Matrix
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
              {sortedMatrix.length} Regions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Breakdown of sales revenue by region and quarter with Q2→Q3 variance and drill-down analytics.
          </p>
        </div>

        <button
          onClick={exportTableCsv}
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          Export Matrix CSV
        </button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold select-none">
              <th
                onClick={() => handleSort('region')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors w-44"
              >
                <div className="flex items-center gap-1">
                  <span>Region</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {quarters.map((q) => (
                <th
                  key={q}
                  onClick={() => handleSort(q)}
                  className={`py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors ${
                    q === q2Key || q === q3Key ? 'bg-indigo-50/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>{q}</span>
                    {q === q2Key && (
                      <span className="text-[10px] text-indigo-600 font-mono font-bold">(Q2)</span>
                    )}
                    {q === q3Key && (
                      <span className="text-[10px] text-amber-600 font-mono font-bold">(Q3)</span>
                    )}
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              ))}

              <th
                onClick={() => handleSort('totalRevenue')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-end gap-1 font-bold text-slate-800">
                  <span>Total Revenue</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {hasQ2AndQ3 && (
                <>
                  <th
                    onClick={() => handleSort('revenueChange')}
                    className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors bg-indigo-50/60"
                  >
                    <div className="flex items-center justify-end gap-1 text-indigo-900 font-bold">
                      <span>{q2Key}→{q3Key} $ Shift</span>
                      <ArrowUpDown className="w-3 h-3 text-indigo-400" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('percentageChange')}
                    className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors bg-indigo-50/60"
                  >
                    <div className="flex items-center justify-end gap-1 text-indigo-900 font-bold">
                      <span>{q2Key}→{q3Key} % Shift</span>
                      <ArrowUpDown className="w-3 h-3 text-indigo-400" />
                    </div>
                  </th>
                </>
              )}

              <th className="py-3 px-3 text-center text-slate-400 font-normal w-16">
                Drilldown
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-slate-700">
            {sortedMatrix.map((row) => {
              const isTopMover = mostChangedRegion?.region === row.region;
              const isExpanded = expandedRegion === row.region;
              const isGrowth = row.revenueChange >= 0;

              return (
                <React.Fragment key={row.region}>
                  <tr
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isTopMover ? 'bg-indigo-50/20' : ''
                    } ${isExpanded ? 'bg-slate-50' : ''}`}
                  >
                    {/* Region Name */}
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{row.region}</span>
                        {isTopMover && hasQ2AndQ3 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200" title="Greatest revenue change between Q2 and Q3">
                            <Flame className="w-3 h-3 text-indigo-600" />
                            Top Mover
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Quarter Revenue Columns */}
                    {quarters.map((q) => {
                      const rev = row.quarterRevenues[q] || 0;
                      return (
                        <td
                          key={q}
                          className={`py-3 px-3 text-right font-mono ${
                            q === q2Key || q === q3Key ? 'bg-indigo-50/20 font-medium' : ''
                          }`}
                        >
                          {rev > 0 ? (
                            formatUSD(rev)
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Total Revenue */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatUSD(row.totalRevenue)}
                    </td>

                    {/* Q2 to Q3 Changes */}
                    {hasQ2AndQ3 && (
                      <>
                        <td className="py-3 px-4 text-right font-mono font-semibold">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                              isGrowth
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {isGrowth ? (
                              <TrendingUp className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-rose-600" />
                            )}
                            {isGrowth ? '+' : ''}
                            {formatUSD(row.revenueChange)}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-semibold">
                          <span
                            className={
                              isGrowth ? 'text-emerald-700' : 'text-rose-700'
                            }
                          >
                            {isGrowth ? '+' : ''}
                            {row.percentageChange.toFixed(1)}%
                          </span>
                        </td>
                      </>
                    )}

                    {/* Expand Drilldown Toggle Button */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedRegion(isExpanded ? null : row.region)
                        }
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                        title="View product & channel breakdown"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded In-line Drill-down Row */}
                  {isExpanded && (
                    <tr className="bg-slate-50/90 border-b border-slate-200">
                      <td
                        colSpan={quarters.length + (hasQ2AndQ3 ? 4 : 2)}
                        className="p-4"
                      >
                        <ExpandedRegionDetails
                          region={row.region}
                          rawOrders={rawOrders}
                          q2Key={q2Key}
                          q3Key={q3Key}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>

          {/* Grand Total Footer Row */}
          <tfoot>
            <tr className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-slate-900 select-none">
              <td className="py-3 px-4">All Regions Total</td>
              {quarters.map((q) => (
                <td key={q} className="py-3 px-3 text-right font-mono">
                  {formatUSD(quarterTotals[q] || 0)}
                </td>
              ))}
              <td className="py-3 px-4 text-right font-mono text-indigo-700">
                {formatUSD(grandTotalRevenue)}
              </td>
              {hasQ2AndQ3 && (
                <>
                  <td className="py-3 px-4 text-right font-mono">
                    <span
                      className={
                        totalChange >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }
                    >
                      {totalChange >= 0 ? '+' : ''}
                      {formatUSD(totalChange)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    <span
                      className={
                        totalChange >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }
                    >
                      {totalChange >= 0 ? '+' : ''}
                      {totalPctChange.toFixed(1)}%
                    </span>
                  </td>
                </>
              )}
              <td className="py-3 px-3 text-center">-</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

// Sub-component for in-line drilldown
const ExpandedRegionDetails: React.FC<{
  region: string;
  rawOrders: SalesOrder[];
  q2Key: string;
  q3Key: string;
}> = ({ region, rawOrders, q2Key, q3Key }) => {
  const drivers = calculateDriversForRegion(rawOrders, region, q2Key, q3Key);

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
            {region} • Internal Drivers ({q2Key} → {q3Key})
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
          <div>
            Units:{' '}
            <span className="font-mono font-bold text-slate-800">
              {drivers.q2Units.toLocaleString()} → {drivers.q3Units.toLocaleString()} (
              {drivers.unitsChange >= 0 ? '+' : ''}
              {drivers.unitsChange.toLocaleString()})
            </span>
          </div>
          <div>
            Avg Discount:{' '}
            <span className="font-mono font-bold text-slate-800">
              {drivers.q2AvgDiscount.toFixed(1)}% → {drivers.q3AvgDiscount.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Product Breakdown */}
        <div>
          <div className="flex items-center gap-1 text-slate-500 font-semibold mb-2">
            <Package className="w-3.5 h-3.5" />
            <span>Product Sales Shifts</span>
          </div>
          <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
            {drivers.productBreakdown.map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-between text-[11px]"
              >
                <span className="font-medium text-slate-800 truncate max-w-[130px]">{p.name}</span>
                <span className="text-slate-400 font-mono">
                  {formatUSD(p.q2Revenue)} → {formatUSD(p.q3Revenue)}
                </span>
                <span
                  className={`font-mono font-semibold ${
                    p.revenueChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {p.revenueChange >= 0 ? '+' : ''}
                  {formatUSD(p.revenueChange)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Channel Breakdown */}
        <div>
          <div className="flex items-center gap-1 text-slate-500 font-semibold mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Channel Sales Shifts</span>
          </div>
          <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
            {drivers.channelBreakdown.map((c) => (
              <div
                key={c.name}
                className="flex items-center justify-between text-[11px]"
              >
                <span className="font-medium text-slate-800 truncate max-w-[130px]">{c.name}</span>
                <span className="text-slate-400 font-mono">
                  {formatUSD(c.q2Revenue)} → {formatUSD(c.q3Revenue)}
                </span>
                <span
                  className={`font-mono font-semibold ${
                    c.revenueChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {c.revenueChange >= 0 ? '+' : ''}
                  {formatUSD(c.revenueChange)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
