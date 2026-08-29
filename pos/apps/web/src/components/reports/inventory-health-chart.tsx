"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, PackageX, TrendingDown } from "lucide-react";

interface InventoryHealthProps {
  totalSkus: number;
  healthyCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  overstockedCount: number;
}

export function InventoryHealthChart({
  totalSkus,
  healthyCount,
  lowStockCount,
  outOfStockCount,
  overstockedCount,
}: InventoryHealthProps) {
  const safeTotal = totalSkus || 1;
  const healthyPct = Math.round((healthyCount / safeTotal) * 100);
  const lowPct = Math.round((lowStockCount / safeTotal) * 100);
  const outPct = Math.round((outOfStockCount / safeTotal) * 100);
  const overPct = Math.max(0, 100 - healthyPct - lowPct - outPct);

  return (
    <div className="space-y-4">
      {/* Progress Bar Distribution */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-bold text-slate-700">
          <span>Overall Catalog Health</span>
          <span className="text-emerald-600">{healthyPct}% Optimal Levels</span>
        </div>
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${healthyPct}%` }}
            className="bg-emerald-500 transition-all duration-500"
            title={`Healthy Stock: ${healthyCount} SKUs (${healthyPct}%)`}
          />
          <div
            style={{ width: `${lowPct}%` }}
            className="bg-amber-500 transition-all duration-500"
            title={`Low Stock Warning: ${lowStockCount} SKUs (${lowPct}%)`}
          />
          <div
            style={{ width: `${outPct}%` }}
            className="bg-rose-500 transition-all duration-500"
            title={`Out of Stock: ${outOfStockCount} SKUs (${outPct}%)`}
          />
          <div
            style={{ width: `${overPct}%` }}
            className="bg-blue-400 transition-all duration-500"
            title={`Overstocked: ${overstockedCount} SKUs (${overPct}%)`}
          />
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
          <div className="flex items-center gap-1 text-emerald-700 text-xs font-bold">
            <CheckCircle2 className="h-3.5 w-3.5" /> Healthy
          </div>
          <p className="text-lg font-black text-slate-900">{healthyCount}</p>
          <p className="text-[10px] text-emerald-600 font-semibold">{healthyPct}% in stock</p>
        </div>

        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
          <div className="flex items-center gap-1 text-amber-700 text-xs font-bold">
            <AlertTriangle className="h-3.5 w-3.5" /> Low Stock
          </div>
          <p className="text-lg font-black text-slate-900">{lowStockCount}</p>
          <p className="text-[10px] text-amber-700 font-semibold">Below min reorder</p>
        </div>

        <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
          <div className="flex items-center gap-1 text-rose-700 text-xs font-bold">
            <PackageX className="h-3.5 w-3.5" /> Out of Stock
          </div>
          <p className="text-lg font-black text-slate-900">{outOfStockCount}</p>
          <p className="text-[10px] text-rose-600 font-semibold">Zero units remaining</p>
        </div>

        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
          <div className="flex items-center gap-1 text-blue-700 text-xs font-bold">
            <TrendingDown className="h-3.5 w-3.5" /> Overstock
          </div>
          <p className="text-lg font-black text-slate-900">{overstockedCount}</p>
          <p className="text-[10px] text-blue-600 font-semibold">&gt;60 days stock</p>
        </div>
      </div>
    </div>
  );
}
