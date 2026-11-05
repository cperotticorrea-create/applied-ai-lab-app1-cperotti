import React from 'react';
import { BarChart3, Download, FileSpreadsheet, RefreshCw, Sparkles, Upload } from 'lucide-react';

interface HeaderProps {
  totalOrders: number;
  totalRevenue: number;
  regionCount: number;
  currentFileName?: string;
  onLoadLabData: () => void;
  onLoadSample: () => void;
  onDownloadTemplate: () => void;
  onOpenUpload: () => void;
  isLoadingAi: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  totalOrders,
  totalRevenue,
  regionCount,
  currentFileName,
  onLoadLabData,
  onLoadSample,
  onDownloadTemplate,
  onOpenUpload,
  isLoadingAi,
}) => {
  const formattedRev = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(totalRevenue);

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Sales Pulse</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                Revenue & Q2-Q3 Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-500">
              CSV Quarterly Sales Orders & Grounded AI Analysis
            </p>
          </div>
        </div>

        {/* Global Key Metrics Chips (if data loaded) */}
        {totalOrders > 0 && (
          <div className="hidden md:flex items-center space-x-6 text-xs text-slate-600 bg-slate-50 px-4 py-1.5 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Orders</span>
              <span className="font-semibold text-slate-800">{totalOrders.toLocaleString()}</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Regions</span>
              <span className="font-semibold text-slate-800">{regionCount}</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Rev</span>
              <span className="font-bold text-indigo-600">{formattedRev}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onLoadLabData}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors shadow-2xs"
            title="Load Lab 1 Regional Sales CSV (548 orders, West/west case-normalized)"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Load Lab 1 Sales
          </button>

          <button
            onClick={onLoadSample}
            type="button"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
            title="Load sample B2B sales orders dataset"
          >
            Sample B2B
          </button>

          <button
            onClick={onDownloadTemplate}
            type="button"
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
            title="Download CSV schema template"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Template
          </button>

          <button
            onClick={onOpenUpload}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload CSV
          </button>
        </div>
      </div>
    </header>
  );
};
