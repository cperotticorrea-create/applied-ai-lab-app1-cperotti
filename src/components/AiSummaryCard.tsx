import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Layers,
  Percent,
  Package,
  Layers2,
  Info,
} from 'lucide-react';
import { CalculatedAnalysis } from '../types';
import { formatUSD } from '../utils/formatters';

interface AiSummaryCardProps {
  summary: string | null;
  isLoading: boolean;
  onRegenerate: () => void;
  analysis: CalculatedAnalysis;
  error?: string | null;
}

export const AiSummaryCard: React.FC<AiSummaryCardProps> = ({
  summary,
  isLoading,
  onRegenerate,
  analysis,
  error,
}) => {
  const [copied, setCopied] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  const { mostChangedRegion, driversForMostChanged, hasQ2AndQ3, q2Key, q3Key } = analysis;

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Split summary into sentences for enhanced legibility
  const sentences = summary
    ? summary
        .split(/(?<=[.?!])\s+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  if (!hasQ2AndQ3) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-900">
        <div className="flex items-center gap-2 mb-2 font-semibold">
          <Info className="w-5 h-5 text-amber-600" />
          <span>Quarter Comparison Notice</span>
        </div>
        <p className="text-xs text-amber-700">
          The uploaded dataset does not contain both Q2 and Q3 order records. Both quarters are required to determine which region changed the most from Q2 to Q3.
        </p>
      </div>
    );
  }

  const isGrowth = (mostChangedRegion?.revenueChange ?? 0) >= 0;

  return (
    <div className="bg-gradient-to-br from-white via-indigo-50/20 to-violet-50/30 rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
      {/* Top Banner */}
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 via-indigo-850 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/30 border border-indigo-400/30 text-amber-300">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold tracking-wide text-white">
                AI Executive Intelligence Brief
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Strictly Grounded Numbers
              </span>
            </div>
            <p className="text-[11px] text-indigo-200/80">
              Three-sentence analysis of the greatest regional variance from {q2Key} to {q3Key}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAuditModal(!showAuditModal)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-800/60 hover:bg-indigo-700/80 text-indigo-100 border border-indigo-600/40 transition-colors"
            title="Inspect all calculated figures supplied to the AI"
          >
            {showAuditModal ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                Hide Math Audit
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                Audit Numbers Used
              </>
            )}
          </button>

          <button
            onClick={handleCopy}
            disabled={!summary || isLoading}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-800/60 hover:bg-indigo-700/80 text-indigo-100 border border-indigo-600/40 disabled:opacity-40 transition-colors"
            title="Copy summary to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>

          <button
            onClick={onRegenerate}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white shadow-xs disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Calculating...' : 'Regenerate'}
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-6">
        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-800">
                Synthesizing calculated regional metrics...
              </p>
              <p className="text-xs text-slate-500 max-w-sm">
                Aggregating {mostChangedRegion?.region} revenue, unit shifts, and discount variations from {q2Key} to {q3Key}.
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
            <p className="font-semibold mb-1">Failed to generate AI brief</p>
            <p>{error}</p>
          </div>
        ) : summary ? (
          <div className="space-y-4">
            {/* 3 Sentences Structured Presentation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {sentences.map((sentence, idx) => {
                const labels = [
                  { title: 'Sentence 1: Regional Variance', color: 'border-l-indigo-500 bg-indigo-50/40 text-indigo-950' },
                  { title: 'Sentence 2: Volume & Product Driver', color: 'border-l-emerald-500 bg-emerald-50/40 text-emerald-950' },
                  { title: 'Sentence 3: Channel & Discount Factor', color: 'border-l-amber-500 bg-amber-50/40 text-amber-950' },
                ];
                const currentLabel = labels[idx] || {
                  title: `Sentence ${idx + 1}`,
                  color: 'border-l-slate-400 bg-slate-50 text-slate-900',
                };

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border border-slate-200/80 border-l-4 shadow-2xs flex flex-col justify-between ${currentLabel.color}`}
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                        {currentLabel.title}
                      </span>
                      <p className="text-xs leading-relaxed font-medium text-slate-800">
                        {sentence}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick KPI Strip of the App-Calculated Driver Facts */}
            {mostChangedRegion && driversForMostChanged && (
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium">Region with largest change:</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    {mostChangedRegion.region}
                    {isGrowth ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                    )}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                    {q2Key}: {formatUSD(mostChangedRegion.q2Revenue)}
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                    {q3Key}: {formatUSD(mostChangedRegion.q3Revenue)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-mono font-semibold text-[11px] ${
                      isGrowth ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {isGrowth ? '+' : ''}
                    {formatUSD(mostChangedRegion.revenueChange)} ({mostChangedRegion.percentageChange > 0 ? '+' : ''}
                    {mostChangedRegion.percentageChange.toFixed(1)}%)
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Expandable Audit Drawer: Showing the App-Calculated Inputs Fed To AI */}
        {showAuditModal && driversForMostChanged && mostChangedRegion && (
          <div className="mt-5 p-4 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 animate-fadeIn">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Verification Audit: App-Calculated Numbers Provided to AI
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Model: gemini-3.8-flash (Zero hallucination policy)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-medium">Top Mover Region</span>
                <span className="font-bold text-white text-sm">{mostChangedRegion.region}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-medium">Dollar Variance</span>
                <span className={`font-bold text-sm ${isGrowth ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isGrowth ? '+' : ''}{formatUSD(mostChangedRegion.revenueChange)} ({mostChangedRegion.percentageChange.toFixed(1)}%)
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-medium">Units Sold ({q2Key} → {q3Key})</span>
                <span className="font-bold text-white text-sm">
                  {driversForMostChanged.q2Units.toLocaleString()} → {driversForMostChanged.q3Units.toLocaleString()} (
                  {driversForMostChanged.unitsChange >= 0 ? '+' : ''}
                  {driversForMostChanged.unitsChange.toLocaleString()})
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-medium">Avg Discount ({q2Key} → {q3Key})</span>
                <span className="font-bold text-white text-sm">
                  {driversForMostChanged.q2AvgDiscount.toFixed(1)}% → {driversForMostChanged.q3AvgDiscount.toFixed(1)}% (
                  {driversForMostChanged.discountChangePoints >= 0 ? '+' : ''}
                  {driversForMostChanged.discountChangePoints.toFixed(1)} pts)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Product Drivers */}
              <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700">
                <div className="flex items-center gap-1.5 text-indigo-300 font-semibold mb-2">
                  <Package className="w-3.5 h-3.5" />
                  <span>Product Revenue Breakdown ({mostChangedRegion.region})</span>
                </div>
                <div className="space-y-1.5">
                  {driversForMostChanged.productBreakdown.map((p) => (
                    <div key={p.name} className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-300 truncate max-w-[140px]">{p.name}</span>
                      <span className="text-slate-400">{formatUSD(p.q2Revenue)} → {formatUSD(p.q3Revenue)}</span>
                      <span className={`font-mono ${p.revenueChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {p.revenueChange >= 0 ? '+' : ''}{formatUSD(p.revenueChange)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Channel Drivers */}
              <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700">
                <div className="flex items-center gap-1.5 text-violet-300 font-semibold mb-2">
                  <Layers2 className="w-3.5 h-3.5" />
                  <span>Channel Revenue Breakdown ({mostChangedRegion.region})</span>
                </div>
                <div className="space-y-1.5">
                  {driversForMostChanged.channelBreakdown.map((c) => (
                    <div key={c.name} className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-300 truncate max-w-[140px]">{c.name}</span>
                      <span className="text-slate-400">{formatUSD(c.q2Revenue)} → {formatUSD(c.q3Revenue)}</span>
                      <span className={`font-mono ${c.revenueChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {c.revenueChange >= 0 ? '+' : ''}{formatUSD(c.revenueChange)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
