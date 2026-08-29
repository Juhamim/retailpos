"use client";

import React, { useState } from "react";
import { Clock, Flame } from "lucide-react";

export interface HourlySalesData {
  hour: number; // 0 to 23
  label: string; // e.g. "9 AM", "2 PM"
  orders: number;
  revenue: number;
}

interface HourlyVelocityChartProps {
  data: HourlySalesData[];
}

export function HourlyVelocityChart({ data }: HourlyVelocityChartProps) {
  const [hoveredHour, setHoveredHour] = useState<HourlySalesData | null>(null);

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const maxOrders = Math.max(...data.map((d) => d.orders), 1);
  const peakHour = [...data].sort((a, b) => b.revenue - a.revenue)[0];

  // Filter to active operating hours (e.g. 8 AM to 11 PM) or full hours
  const activeHours = data.filter((d) => d.hour >= 7 && d.hour <= 23);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-800">Peak Store Hours Velocity</span>
        </div>

        {peakHour && peakHour.revenue > 0 && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs font-bold">
            <Flame className="h-3.5 w-3.5 text-amber-600" />
            <span>Peak Rush: {peakHour.label} (₹{peakHour.revenue.toFixed(0)})</span>
          </div>
        )}
      </div>

      {hoveredHour && (
        <div className="text-xs font-bold text-slate-800 bg-indigo-50 border border-indigo-200 p-2 rounded-xl text-center">
          Hour <span className="text-indigo-600 font-extrabold">{hoveredHour.label}</span>: ₹{hoveredHour.revenue.toFixed(2)} revenue across {hoveredHour.orders} checkout orders
        </div>
      )}

      {/* Hourly Bar Columns */}
      <div className="grid grid-cols-8 sm:grid-cols-17 gap-1 pt-4 items-end h-36 bg-slate-50/60 p-3 rounded-2xl border border-slate-100">
        {activeHours.map((d) => {
          const heightPercent = Math.max(8, (d.revenue / maxRevenue) * 100);
          const isPeak = peakHour && peakHour.hour === d.hour && d.revenue > 0;
          return (
            <div
              key={d.hour}
              className="flex flex-col items-center h-full justify-end group cursor-pointer"
              onMouseEnter={() => setHoveredHour(d)}
              onMouseLeave={() => setHoveredHour(null)}
            >
              {/* Bar Fill */}
              <div
                className={`w-full max-w-[18px] rounded-t-md transition-all duration-300 ${
                  isPeak
                    ? "bg-gradient-to-t from-amber-500 to-amber-400 shadow-xs"
                    : d.revenue > 0
                    ? "bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:from-indigo-700 group-hover:to-indigo-500"
                    : "bg-slate-200/80"
                }`}
                style={{ height: `${heightPercent}%` }}
              />
              {/* Hour Label */}
              <span className="text-[9px] font-bold text-slate-400 mt-1 truncate group-hover:text-indigo-600">
                {d.hour > 12 ? `${d.hour - 12}p` : d.hour === 12 ? "12p" : `${d.hour}a`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
