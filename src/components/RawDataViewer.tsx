import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { SalesOrder } from '../types';
import { formatUSD } from '../utils/formatters';

interface RawDataViewerProps {
  orders: SalesOrder[];
}

export const RawDataViewer: React.FC<RawDataViewerProps> = ({ orders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const quarters = useMemo(() => Array.from(new Set(orders.map((o) => o.quarter))), [orders]);
  const regions = useMemo(() => Array.from(new Set(orders.map((o) => o.region))), [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        searchTerm === '' ||
        o.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.channel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.quarter.toLowerCase().includes(searchTerm.toLowerCase());

      const matchQuarter = selectedQuarter === 'all' || o.quarter === selectedQuarter;
      const matchRegion = selectedRegion === 'all' || o.region === selectedRegion;

      return matchSearch && matchQuarter && matchRegion;
    });
  }, [orders, searchTerm, selectedQuarter, selectedRegion]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">
              Raw Sales Orders Dataset
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
              {orders.length} Rows
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full record-level inspection with multi-field search and quarter filters.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product, channel..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44 sm:w-56"
            />
          </div>

          <select
            value={selectedQuarter}
            onChange={(e) => {
              setSelectedQuarter(e.target.value);
              setCurrentPage(1);
            }}
            className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Quarters</option>
            {quarters.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>

          <select
            value={selectedRegion}
            onChange={(e) => {
              setSelectedRegion(e.target.value);
              setCurrentPage(1);
            }}
            className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="py-2.5 px-4">#</th>
              <th className="py-2.5 px-3">Quarter</th>
              <th className="py-2.5 px-3">Region</th>
              <th className="py-2.5 px-3">Channel</th>
              <th className="py-2.5 px-3">Product</th>
              <th className="py-2.5 px-3 text-right">Units</th>
              <th className="py-2.5 px-3 text-right">Discount</th>
              <th className="py-2.5 px-4 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {paginatedOrders.map((order, idx) => (
              <tr key={order.id || idx} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                  {(currentPage - 1) * pageSize + idx + 1}
                </td>
                <td className="py-2.5 px-3 font-medium text-slate-900">{order.quarter}</td>
                <td className="py-2.5 px-3 font-semibold text-slate-800">{order.region}</td>
                <td className="py-2.5 px-3 text-slate-600">{order.channel}</td>
                <td className="py-2.5 px-3 text-slate-800 font-medium">{order.product}</td>
                <td className="py-2.5 px-3 text-right font-mono">{order.units.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-right font-mono">
                  {(order.discount_pct * 100).toFixed(1)}%
                </td>
                <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                  {formatUSD(order.revenue)}
                </td>
              </tr>
            ))}
            {paginatedOrders.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  No orders matched your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing {filteredOrders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
          {Math.min(currentPage * pageSize, filteredOrders.length)} of {filteredOrders.length} records
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-medium text-slate-700">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
