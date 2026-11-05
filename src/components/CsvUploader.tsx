import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import { parseCsvString, ParseResult } from '../utils/csvParser';
import { SalesOrder } from '../types';

interface CsvUploaderProps {
  onDataLoaded: (orders: SalesOrder[], fileName: string) => void;
  onLoadLabData: () => void;
  onLoadSample: () => void;
  currentFileName?: string;
  totalOrdersCount: number;
}

const REQUIRED_COLUMNS = [
  { name: 'quarter', desc: 'e.g., Q1, Q2, Q3, Q4' },
  { name: 'region', desc: 'e.g., North, South, East, West' },
  { name: 'channel', desc: 'e.g., Online, Partner, Retail' },
  { name: 'product', desc: 'e.g., Pro Blender, Air Fryer XL' },
  { name: 'units', desc: 'e.g., 2' },
  { name: 'discount_pct', desc: 'e.g., 10 or 0.10' },
  { name: 'revenue', desc: 'e.g., 1190.7 or $1,190.70' },
];

export const CsvUploader: React.FC<CsvUploaderProps> = ({
  onDataLoaded,
  onLoadLabData,
  onLoadSample,
  currentFileName,
  totalOrdersCount,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setParseError(null);
    setParseWarnings([]);

    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'text/plain') {
      setParseError('Please upload a valid .csv file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setParseError('The uploaded file is empty.');
        return;
      }

      const result: ParseResult = parseCsvString(text);
      if (result.errors.length > 0) {
        setParseError(result.errors.join(' '));
        return;
      }

      if (result.orders.length === 0) {
        setParseError('No valid sales orders found in the CSV file.');
        return;
      }

      if (result.warnings.length > 0) {
        setParseWarnings(result.warnings.slice(0, 3));
      }

      onDataLoaded(result.orders, file.name);
    };

    reader.onerror = () => {
      setParseError('Failed to read file from disk.');
    };

    reader.readAsText(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all">
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              Upload Sales Orders CSV
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Supports standard tabular order extracts. The app automatically groups quarterly revenue by region and computes Q2→Q3 drivers.
            </p>
          </div>

          {currentFileName && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate max-w-[200px]" title={currentFileName}>
                {currentFileName}
              </span>
              <span className="text-emerald-600 font-semibold">({totalOrdersCount} orders)</span>
            </div>
          )}
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
              : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="max-w-md mx-auto flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-xs">
              <Upload className="w-6 h-6" />
            </div>

            <p className="text-sm font-medium text-slate-800">
              Drop your CSV file here, or{' '}
              <span className="text-indigo-600 hover:text-indigo-700 underline font-semibold">
                browse files
              </span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              File must contain header row with required order columns
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLoadLabData();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                Load Lab 1 Sales (548 orders)
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLoadSample();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors shadow-2xs"
              >
                Sample B2B
              </button>
            </div>
          </div>
        </div>

        {/* Column Requirements Badge Pill List */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Required CSV Columns:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {REQUIRED_COLUMNS.map((col) => (
              <div
                key={col.name}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-slate-100/80 text-slate-700 border border-slate-200"
              >
                <span className="font-mono font-semibold text-slate-900">{col.name}</span>
                <span className="text-slate-400 text-[11px]">({col.desc})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Errors / Warnings */}
        {parseError && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Upload Error</p>
              <p>{parseError}</p>
            </div>
          </div>
        )}

        {parseWarnings.length > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Row Warnings</p>
              <ul className="list-disc pl-4 mt-1 space-y-0.5">
                {parseWarnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
