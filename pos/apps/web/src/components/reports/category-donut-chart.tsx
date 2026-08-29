"use client";

import React, { useState } from "react";

export interface CategoryData {
  name: string;
  revenue: number;
  units: number;
  color: string;
}

interface CategoryDonutChartProps {
  data: CategoryData[];
  totalRevenue: number;
}

const DEFAULT_COLORS = [
  "#4f46e5", // Indigo
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Violet
  "#64748b", // Slate
];

export function CategoryDonutChart({ data, totalRevenue }: CategoryDonutChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const categories = data.map((d, i) => ({
    ...d,
    color: d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    percentage: totalRevenue > 0 ? (d.revenue / totalRevenue) * 100 : 0,
  }));

  if (categories.length === 0 || totalRevenue === 0) {
    return (
      <div className="h-60 flex items-center justify-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400 font-medium">
        No category revenue data available
      </div>
    );
  }

  // Calculate SVG donut stroke-dasharray and stroke-dashoffset
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  const slices = categories.map((cat, i) => {
    const strokeDasharray = `${(cat.percentage * circumference) / 100} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent * circumference) / 100);
    accumulatedPercent += cat.percentage;
    return {
      ...cat,
      strokeDasharray,
      strokeDashoffset,
      index: i,
    };
  });

  const activeCategory = hoveredIdx !== null ? categories[hoveredIdx] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
      {/* SVG Donut Center */}
      <div className="relative w-52 h-52 shrink-0 flex items-center justify-center">
        <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90 transform">
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth="24"
          />
          {slices.map((slice) => (
            <circle
              key={slice.name}
              cx="90"
              cy="90"
              r={radius}
              fill="transparent"
              stroke={slice.color}
              strokeWidth={hoveredIdx === slice.index ? "28" : "24"}
              strokeDasharray={slice.strokeDasharray}
              strokeDashoffset={slice.strokeDashoffset}
              strokeLinecap="round"
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredIdx(slice.index)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
          {activeCategory ? (
            <>
              <p className="text-[10px] uppercase font-bold text-slate-400 truncate max-w-[110px]">
                {activeCategory.name}
              </p>
              <p className="text-base font-black text-slate-900 leading-tight">
                {activeCategory.percentage.toFixed(1)}%
              </p>
              <p className="text-[10px] font-bold text-indigo-600">
                ₹{activeCategory.revenue.toFixed(0)}
              </p>
            </>
          ) : (
            <>
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Revenue</p>
              <p className="text-base font-black text-slate-900 leading-tight">
                ₹{totalRevenue >= 1000 ? `${(totalRevenue / 1000).toFixed(1)}k` : totalRevenue.toFixed(0)}
              </p>
              <p className="text-[10px] font-semibold text-slate-400">
                {categories.length} Categories
              </p>
            </>
          )}
        </div>
      </div>

      {/* Legend List */}
      <div className="flex-1 w-full space-y-2.5 max-h-56 overflow-y-auto pr-1">
        {categories.map((cat, idx) => (
          <div
            key={cat.name}
            className={`p-2 rounded-xl transition-all border flex items-center justify-between cursor-pointer ${
              hoveredIdx === idx
                ? "bg-slate-100/80 border-slate-300 shadow-2xs"
                : "bg-slate-50/50 border-slate-100 hover:bg-slate-100/50"
            }`}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div className="flex items-center gap-2 overflow-hidden pr-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-xs font-bold text-slate-800 truncate">{cat.name}</span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-black text-slate-900">₹{cat.revenue.toFixed(2)}</span>
              <span className="text-[10px] font-semibold text-slate-400 block">
                {cat.percentage.toFixed(1)}% • {cat.units} units
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
