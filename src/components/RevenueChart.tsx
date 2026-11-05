import React, { useState, useId } from 'react';
import { BarChart3, TrendingUp, Layers, HelpCircle } from 'lucide-react';
import { CalculatedAnalysis } from '../types';
import { formatUSD } from '../utils/formatters';

interface RevenueChartProps {
  analysis: CalculatedAnalysis;
}

type ChartMode = 'by-region' | 'q2-q3-delta' | 'by-quarter';

const QUARTER_COLORS = [
  '#6366f1', // Indigo - Q1
  '#06b6d4', // Cyan - Q2
  '#f59e0b', // Amber - Q3
  '#10b981', // Emerald - Q4
  '#8b5cf6', // Violet
  '#ec4899', // Pink
];

const REGION_PALETTE = [
  '#4f46e5', // Indigo
  '#059669', // Emerald
  '#d97706', // Amber
  '#7c3aed', // Violet
  '#db2777', // Pink
  '#2563eb', // Blue
  '#0891b2', // Cyan
];

export const RevenueChart: React.FC<RevenueChartProps> = ({ analysis }) => {
  const [chartMode, setChartMode] = useState<ChartMode>('by-region');
  const [hoveredBar, setHoveredBar] = useState<{
    title: string;
    subtitle: string;
    value: number;
    extra?: string;
    x: number;
    y: number;
  } | null>(null);

  const { quarters, regions, matrix, q2Key, q3Key, hasQ2AndQ3, mostChangedRegion } = analysis;

  if (matrix.length === 0 || quarters.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
        No sales data available to render chart.
      </div>
    );
  }

  const formatCompactUSD = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val}`;
  };

  // Find max revenue across all cells for Y scale
  let maxBarValue = 0;
  matrix.forEach((row) => {
    quarters.forEach((q) => {
      const val = row.quarterRevenues[q] || 0;
      if (val > maxBarValue) maxBarValue = val;
    });
  });

  // Ensure minimum headroom
  maxBarValue = maxBarValue > 0 ? maxBarValue * 1.15 : 100000;

  // Chart dimensions (viewBox SVG)
  const svgWidth = 860;
  const svgHeight = 360;
  const padding = { top: 40, right: 30, bottom: 65, left: 75 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  // Generate 5 Y-axis tick values
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => pct * maxBarValue);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header and Toggle Controls */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">
              Total Revenue by Region & Quarter
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
              Interactive Chart
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Hover over any bar to inspect exact revenue figures and regional proportions.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-medium text-slate-600 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setChartMode('by-region')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              chartMode === 'by-region'
                ? 'bg-white text-indigo-600 font-semibold shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            By Region (Quarter Bars)
          </button>

          {hasQ2AndQ3 && (
            <button
              type="button"
              onClick={() => setChartMode('q2-q3-delta')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                chartMode === 'q2-q3-delta'
                  ? 'bg-white text-indigo-600 font-semibold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              {q2Key} → {q3Key} Variance
            </button>
          )}

          <button
            type="button"
            onClick={() => setChartMode('by-quarter')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              chartMode === 'by-quarter'
                ? 'bg-white text-indigo-600 font-semibold shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            By Quarter
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="p-4 relative">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto max-h-[420px] select-none"
        >
          {/* Background Grid Lines & Y-axis labels */}
          {yTicks.map((tickVal, i) => {
            const yPos = padding.top + chartHeight - (tickVal / maxBarValue) * chartHeight;
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={yPos}
                  x2={svgWidth - padding.right}
                  y2={yPos}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                  strokeDasharray={i === 0 ? undefined : '3,3'}
                />
                <text
                  x={padding.left - 10}
                  y={yPos + 4}
                  textAnchor="end"
                  fontSize="11"
                  className="fill-slate-400 font-mono"
                >
                  {formatCompactUSD(tickVal)}
                </text>
              </g>
            );
          })}

          {/* Mode 1: Bars grouped by Region (Quarter bars side-by-side) */}
          {chartMode === 'by-region' && (
            <>
              {regions.map((reg, rIdx) => {
                const groupWidth = chartWidth / regions.length;
                const groupX = padding.left + rIdx * groupWidth;
                const innerPadding = groupWidth * 0.18;
                const usableGroupWidth = groupWidth - innerPadding * 2;
                const barWidth = usableGroupWidth / quarters.length;

                const isTopMover = mostChangedRegion?.region === reg;

                return (
                  <g key={reg}>
                    {/* Top Mover Region indicator highlight */}
                    {isTopMover && hasQ2AndQ3 && (
                      <rect
                        x={groupX + innerPadding / 2}
                        y={padding.top}
                        width={groupWidth - innerPadding}
                        height={chartHeight}
                        fill="#6366f1"
                        fillOpacity="0.04"
                        rx="6"
                      />
                    )}

                    {/* Quarter Bars */}
                    {quarters.map((q, qIdx) => {
                      const row = matrix.find((m) => m.region === reg);
                      const rev = row?.quarterRevenues[q] || 0;
                      const barHeight = Math.max(3, (rev / maxBarValue) * chartHeight);
                      const barX = groupX + innerPadding + qIdx * barWidth;
                      const barY = padding.top + chartHeight - barHeight;
                      const color = QUARTER_COLORS[qIdx % QUARTER_COLORS.length];

                      return (
                        <rect
                          key={q}
                          x={barX + 2}
                          y={barY}
                          width={Math.max(2, barWidth - 4)}
                          height={barHeight}
                          fill={color}
                          rx="3"
                          className="transition-all duration-150 cursor-pointer hover:opacity-85 hover:brightness-105"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredBar({
                              title: `${reg} • ${q}`,
                              subtitle: `Revenue: ${formatUSD(rev)}`,
                              value: rev,
                              extra: `Quarter ${q} Contribution`,
                              x: barX + barWidth / 2,
                              y: barY,
                            });
                          }}
                          onMouseLeave={() => setHoveredBar(null)}
                        />
                      );
                    })}

                    {/* Region X-axis Label */}
                    <text
                      x={groupX + groupWidth / 2}
                      y={svgHeight - padding.bottom + 22}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="600"
                      className="fill-slate-800"
                    >
                      {reg}
                    </text>
                    {isTopMover && hasQ2AndQ3 && (
                      <text
                        x={groupX + groupWidth / 2}
                        y={svgHeight - padding.bottom + 36}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="700"
                        className="fill-indigo-600"
                      >
                        ★ Greatest Q2→Q3 Shift
                      </text>
                    )}
                  </g>
                );
              })}
            </>
          )}

          {/* Mode 2: Q2 vs Q3 Delta Variance View */}
          {chartMode === 'q2-q3-delta' && (
            <>
              {regions.map((reg, rIdx) => {
                const groupWidth = chartWidth / regions.length;
                const groupX = padding.left + rIdx * groupWidth;
                const row = matrix.find((m) => m.region === reg);
                const q2Rev = row?.q2Revenue || 0;
                const q3Rev = row?.q3Revenue || 0;
                const change = q3Rev - q2Rev;
                const isPositive = change >= 0;

                const q2Height = (q2Rev / maxBarValue) * chartHeight;
                const q3Height = (q3Rev / maxBarValue) * chartHeight;

                const barWidth = (groupWidth - 40) / 2;
                const q2X = groupX + 20;
                const q3X = q2X + barWidth + 6;

                const q2Y = padding.top + chartHeight - q2Height;
                const q3Y = padding.top + chartHeight - q3Height;

                return (
                  <g key={reg}>
                    {/* Q2 Bar */}
                    <rect
                      x={q2X}
                      y={q2Y}
                      width={barWidth}
                      height={Math.max(3, q2Height)}
                      fill="#06b6d4"
                      rx="3"
                      className="cursor-pointer hover:opacity-85"
                      onMouseEnter={() =>
                        setHoveredBar({
                          title: `${reg} • ${q2Key}`,
                          subtitle: `Baseline Revenue: ${formatUSD(q2Rev)}`,
                          value: q2Rev,
                          x: q2X + barWidth / 2,
                          y: q2Y,
                        })
                      }
                      onMouseLeave={() => setHoveredBar(null)}
                    />

                    {/* Q3 Bar */}
                    <rect
                      x={q3X}
                      y={q3Y}
                      width={barWidth}
                      height={Math.max(3, q3Height)}
                      fill="#f59e0b"
                      rx="3"
                      className="cursor-pointer hover:opacity-85"
                      onMouseEnter={() =>
                        setHoveredBar({
                          title: `${reg} • ${q3Key}`,
                          subtitle: `Comparison Revenue: ${formatUSD(q3Rev)}`,
                          value: q3Rev,
                          extra: `Shift: ${isPositive ? '+' : ''}${formatUSD(change)} (${row?.percentageChange.toFixed(1)}%)`,
                          x: q3X + barWidth / 2,
                          y: q3Y,
                        })
                      }
                      onMouseLeave={() => setHoveredBar(null)}
                    />

                    {/* Delta Pill on top of bars */}
                    <g
                      transform={`translate(${groupX + groupWidth / 2}, ${
                        Math.min(q2Y, q3Y) - 14
                      })`}
                    >
                      <rect
                        x="-38"
                        y="-10"
                        width="76"
                        height="18"
                        rx="4"
                        fill={isPositive ? '#ecfdf5' : '#fff1f2'}
                        stroke={isPositive ? '#a7f3d0' : '#fecdd3'}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="2"
                        textAnchor="middle"
                        fontSize="9.5"
                        fontWeight="700"
                        fill={isPositive ? '#065f46' : '#9f1239'}
                      >
                        {isPositive ? '+' : ''}
                        {formatCompactUSD(change)}
                      </text>
                    </g>

                    {/* Region Label */}
                    <text
                      x={groupX + groupWidth / 2}
                      y={svgHeight - padding.bottom + 22}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="600"
                      className="fill-slate-800"
                    >
                      {reg}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {/* Mode 3: Grouped by Quarter (Regions side-by-side) */}
          {chartMode === 'by-quarter' && (
            <>
              {quarters.map((q, qIdx) => {
                const groupWidth = chartWidth / quarters.length;
                const groupX = padding.left + qIdx * groupWidth;
                const innerPadding = groupWidth * 0.15;
                const usableGroupWidth = groupWidth - innerPadding * 2;
                const barWidth = usableGroupWidth / regions.length;

                return (
                  <g key={q}>
                    {regions.map((reg, rIdx) => {
                      const row = matrix.find((m) => m.region === reg);
                      const rev = row?.quarterRevenues[q] || 0;
                      const barHeight = Math.max(3, (rev / maxBarValue) * chartHeight);
                      const barX = groupX + innerPadding + rIdx * barWidth;
                      const barY = padding.top + chartHeight - barHeight;
                      const color = REGION_PALETTE[rIdx % REGION_PALETTE.length];

                      return (
                        <rect
                          key={reg}
                          x={barX + 2}
                          y={barY}
                          width={Math.max(2, barWidth - 4)}
                          height={barHeight}
                          fill={color}
                          rx="3"
                          className="cursor-pointer hover:opacity-85"
                          onMouseEnter={() =>
                            setHoveredBar({
                              title: `${q} • ${reg}`,
                              subtitle: `Revenue: ${formatUSD(rev)}`,
                              value: rev,
                              x: barX + barWidth / 2,
                              y: barY,
                            })
                          }
                          onMouseLeave={() => setHoveredBar(null)}
                        />
                      );
                    })}

                    <text
                      x={groupX + groupWidth / 2}
                      y={svgHeight - padding.bottom + 22}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="600"
                      className="fill-slate-800"
                    >
                      Quarter {q}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {/* Hover Tooltip in SVG */}
          {hoveredBar && (
            <g
              transform={`translate(${Math.max(
                90,
                Math.min(svgWidth - 110, hoveredBar.x)
              )}, ${Math.max(45, hoveredBar.y - 12)})`}
              className="pointer-events-none transition-all duration-100"
            >
              <rect
                x="-80"
                y="-42"
                width="160"
                height="46"
                rx="6"
                fill="#0f172a"
                className="drop-shadow-lg"
              />
              <text
                x="0"
                y="-26"
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="#ffffff"
              >
                {hoveredBar.title}
              </text>
              <text
                x="0"
                y="-11"
                textAnchor="middle"
                fontSize="11"
                fontWeight="500"
                fill="#38bdf8"
              >
                {hoveredBar.subtitle}
              </text>
            </g>
          )}
        </svg>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4 text-xs">
          {chartMode === 'by-region' ? (
            quarters.map((q, idx) => (
              <div key={q} className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-xs shrink-0"
                  style={{ backgroundColor: QUARTER_COLORS[idx % QUARTER_COLORS.length] }}
                />
                <span className="text-slate-600 font-medium">Quarter {q}</span>
              </div>
            ))
          ) : chartMode === 'q2-q3-delta' ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#06b6d4]" />
                <span className="text-slate-600 font-medium">{q2Key} Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#f59e0b]" />
                <span className="text-slate-600 font-medium">{q3Key} Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-500" />
                <span className="text-slate-600 font-medium">Net Q2→Q3 Growth Pill</span>
              </div>
            </>
          ) : (
            regions.map((r, idx) => (
              <div key={r} className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-xs shrink-0"
                  style={{ backgroundColor: REGION_PALETTE[idx % REGION_PALETTE.length] }}
                />
                <span className="text-slate-600 font-medium">{r}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
