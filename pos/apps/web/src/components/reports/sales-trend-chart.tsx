"use client";

import React, { useState } from "react";

export interface DataPoint {
  label: string;
  revenue: number;
  profit: number;
  orders: number;
}

interface SalesTrendChartProps {
  data: DataPoint[];
  height?: number;
}

export function SalesTrendChart({ data, height = 240 }: SalesTrendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-60 flex items-center justify-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400 font-medium">
        No sales data available for the selected period
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 100);
  const paddingX = 40;
  const paddingY = 24;
  const chartWidth = 700;
  const chartHeight = height;

  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  // Calculate coordinates for points
  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(data.length - 1, 1)) * innerWidth;
    const yRevenue = chartHeight - paddingY - (d.revenue / maxRevenue) * innerHeight;
    const yProfit = chartHeight - paddingY - (Math.max(0, d.profit) / maxRevenue) * innerHeight;
    return { x, yRevenue, yProfit, ...d };
  });

  // Generate SVG path strings
  const revenuePath = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.yRevenue}` : `${acc} L ${p.x} ${p.yRevenue}`), "");
  const profitPath = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.yProfit}` : `${acc} L ${p.x} ${p.yProfit}`), "");

  const revenueArea = `${revenuePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;
  const profitArea = `${profitPath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;

  return (
    <div className="relative w-full overflow-x-auto select-none">
      {/* Legend & Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2 px-1">
        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5 text-indigo-600">
            <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block shadow-xs" />
            <span>Gross Sales Revenue (₹)</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-xs" />
            <span>Gross Profit Margin (₹)</span>
          </div>
        </div>
        {hoveredIdx !== null && points[hoveredIdx] && (
          <div className="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200 animate-in fade-in">
            {points[hoveredIdx].label}: <span className="text-indigo-600">₹{points[hoveredIdx].revenue.toFixed(2)}</span> • Profit: <span className="text-emerald-600">₹{points[hoveredIdx].profit.toFixed(2)}</span> ({points[hoveredIdx].orders} orders)
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-auto overflow-visible"
        style={{ minWidth: "500px" }}
      >
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = chartHeight - paddingY - ratio * innerHeight;
          const val = Math.round(ratio * maxRevenue);
          return (
            <g key={idx}>
              <line
                x1={paddingX}
                y1={y}
                x2={chartWidth - paddingX}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={paddingX - 6}
                y={y + 3}
                textAnchor="end"
                fontSize="9"
                fontWeight="600"
                fill="#94a3b8"
              >
                ₹{val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
              </text>
            </g>
          );
        })}

        {/* Filled Area Layers */}
        <path d={revenueArea} fill="url(#revenueGrad)" />
        <path d={profitArea} fill="url(#profitGrad)" />

        {/* Line strokes */}
        <path
          d={revenuePath}
          fill="none"
          stroke="#4f46e5"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={profitPath}
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points & Interactive Hover Verticals */}
        {points.map((p, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
              {/* Invisible touch target column */}
              <rect
                x={p.x - 15}
                y={paddingY}
                width="30"
                height={innerHeight}
                fill="transparent"
              />

              {/* Hover vertical guideline */}
              {isHovered && (
                <line
                  x1={p.x}
                  y1={paddingY}
                  x2={p.x}
                  y2={chartHeight - paddingY}
                  stroke="#6366f1"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
              )}

              {/* Profit circle */}
              <circle
                cx={p.x}
                cy={p.yProfit}
                r={isHovered ? "5" : "3"}
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="1.5"
              />

              {/* Revenue circle */}
              <circle
                cx={p.x}
                cy={p.yRevenue}
                r={isHovered ? "6" : "4"}
                fill="#4f46e5"
                stroke="#ffffff"
                strokeWidth="2"
                className="transition-all"
              />

              {/* X-axis date labels */}
              {(points.length <= 12 || i % Math.ceil(points.length / 10) === 0) && (
                <text
                  x={p.x}
                  y={chartHeight - paddingY + 14}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight={isHovered ? "bold" : "600"}
                  fill={isHovered ? "#0f172a" : "#64748b"}
                >
                  {p.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
