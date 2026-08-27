"use client";

import React, { useState } from "react";
import { X, StickyNote } from "lucide-react";

interface HoldSaleDialogProps {
  onHold: (note?: string) => void;
  onCancel: () => void;
}

export function HoldSaleDialog({ onHold, onCancel }: HoldSaleDialogProps) {
  const [note, setNote] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold">Hold Sale</h2>
            </div>
            <button onClick={onCancel} className="p-1 rounded-lg hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            This sale will be held. You can resume it later.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)"
            className="w-full h-20 p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="p-6 border-t flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onHold(note || undefined)}
            className="flex-1 h-10 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600"
          >
            Hold Sale
          </button>
        </div>
      </div>
    </div>
  );
}
