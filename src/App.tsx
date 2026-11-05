import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { CsvUploader } from './components/CsvUploader';
import { AiSummaryCard } from './components/AiSummaryCard';
import { RevenueChart } from './components/RevenueChart';
import { RevenueTable } from './components/RevenueTable';
import { RawDataViewer } from './components/RawDataViewer';
import { parseCsvString } from './utils/csvParser';
import { getSampleOrders, SAMPLE_CSV_CONTENT } from './utils/sampleData';
import { calculateRegionalAnalysis } from './utils/calculations';
import { SalesOrder } from './types';
import {
  FileSpreadsheet,
  BarChart3,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  TableProperties,
  ShieldCheck,
  Info,
} from 'lucide-react';

export default function App() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [fileName, setFileName] = useState<string>('Lab_1_-_Regional_Sales_de1de499.csv');
  const [showUploader, setShowUploader] = useState<boolean>(false);
  const [showRawData, setShowRawData] = useState<boolean>(false);

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Compute calculated metrics
  const analysis = useMemo(() => {
    return calculateRegionalAnalysis(orders);
  }, [orders]);

  // Request the AI 3-sentence summary from the server
  const fetchAiSummary = useCallback(
    async (currentOrders: SalesOrder[]) => {
      const computed = calculateRegionalAnalysis(currentOrders);
      if (!computed.hasQ2AndQ3 || !computed.mostChangedRegion || !computed.driversForMostChanged) {
        setAiSummary(null);
        return;
      }

      setIsLoadingAi(true);
      setAiError(null);

      try {
        const payload = {
          mostChangedRegion: computed.mostChangedRegion,
          allRegions: computed.matrix,
          regionDrivers: computed.driversForMostChanged,
        };

        const res = await fetch('/api/generate-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }

        const data = await res.json();
        setAiSummary(data.summary);
      } catch (err: any) {
        console.error('Failed to fetch AI summary:', err);
        setAiError(err?.message || 'Error contacting summary service');
      } finally {
        setIsLoadingAi(false);
      }
    },
    []
  );

  // Load the Lab 1 sales dataset from public assets
  const handleLoadLabData = useCallback(async () => {
    try {
      const res = await fetch('/assets/aistudio/Lab_1_-_Regional_Sales_de1de499.csv');
      if (res.ok) {
        const text = await res.text();
        const parsed = parseCsvString(text);
        if (parsed.orders.length > 0) {
          setOrders(parsed.orders);
          setFileName('Lab_1_-_Regional_Sales_de1de499.csv');
          fetchAiSummary(parsed.orders);
          return;
        }
      }
    } catch (err) {
      console.warn('Could not load Lab 1 CSV asset directly, using fallback sample:', err);
    }
    const sample = getSampleOrders();
    setOrders(sample);
    setFileName('sample_sales_orders_q1_q4.csv');
    fetchAiSummary(sample);
  }, [fetchAiSummary]);

  // Load Lab 1 dataset on initial startup
  useEffect(() => {
    handleLoadLabData();
  }, [handleLoadLabData]);

  // Handle new CSV upload
  const handleDataLoaded = (newOrders: SalesOrder[], name: string) => {
    setOrders(newOrders);
    setFileName(name);
    setShowUploader(false);
    fetchAiSummary(newOrders);
  };

  // Load sample manually
  const handleLoadSample = () => {
    const sample = getSampleOrders();
    setOrders(sample);
    setFileName('sample_sales_orders_q1_q4.csv');
    fetchAiSummary(sample);
  };

  // Download template CSV
  const handleDownloadTemplate = () => {
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + SAMPLE_CSV_CONTENT.trim());
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sales_orders_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Check if West and west were unified in current dataset
  const hasWest = analysis.regions.includes('West');

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        totalOrders={orders.length}
        totalRevenue={analysis.grandTotalRevenue}
        regionCount={analysis.regions.length}
        currentFileName={fileName}
        onLoadLabData={handleLoadLabData}
        onLoadSample={handleLoadSample}
        onDownloadTemplate={handleDownloadTemplate}
        onOpenUpload={() => setShowUploader(!showUploader)}
        isLoadingAi={isLoadingAi}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* CSV Uploader Accordion / Panel */}
        {showUploader && (
          <div className="animate-fadeIn">
            <CsvUploader
              onDataLoaded={handleDataLoaded}
              onLoadLabData={handleLoadLabData}
              onLoadSample={handleLoadSample}
              currentFileName={fileName}
              totalOrdersCount={orders.length}
            />
          </div>
        )}

        {/* Case Normalization Confirmation Notice */}
        <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-indigo-900 font-medium">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Regional Normalization Active:</strong> Casing variations such as <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200 text-indigo-700">"West"</span> and <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200 text-indigo-700">"west"</span> are automatically unified into a single <span className="font-semibold text-indigo-900">West</span> region.
            </span>
          </div>
          <span className="text-[11px] text-indigo-600 font-medium bg-white px-2 py-0.5 rounded-full border border-indigo-200">
            {orders.length > 0 ? `${orders.length} total orders across ${analysis.regions.length} regions` : 'Awaiting data'}
          </span>
        </div>

        {/* AI Executive 3-Sentence Summary Card */}
        {analysis.hasQ2AndQ3 && (
          <section aria-label="AI Executive Intelligence Brief">
            <AiSummaryCard
              summary={aiSummary}
              isLoading={isLoadingAi}
              onRegenerate={() => fetchAiSummary(orders)}
              analysis={analysis}
              error={aiError}
            />
          </section>
        )}

        {/* Section: Revenue Chart */}
        <section aria-label="Revenue Chart">
          <RevenueChart analysis={analysis} />
        </section>

        {/* Section: Revenue Pivot Table */}
        <section aria-label="Revenue Table">
          <RevenueTable analysis={analysis} rawOrders={orders} />
        </section>

        {/* Section: Raw Orders Explorer (Collapsible) */}
        <section aria-label="Raw Data Explorer">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setShowRawData(!showRawData)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <TableProperties className="w-4 h-4 text-slate-400" />
              <span>
                {showRawData ? 'Hide Raw Orders Explorer' : 'Inspect Raw Orders Dataset'} ({orders.length} rows)
              </span>
              {showRawData ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {showRawData && (
            <div className="animate-fadeIn">
              <RawDataViewer orders={orders} />
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        <p>
          Sales Pulse • Quarterly Regional Revenue Intelligence • Grounded AI Summarization
        </p>
      </footer>
    </div>
  );
}
