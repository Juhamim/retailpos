"use client";

import React, { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon, CheckCircle, RefreshCw } from "lucide-react";

interface LogoUploaderProps {
  currentLogo?: string;
  onLogoChange: (base64: string) => void;
  shopName?: string;
}

export function LogoUploader({ currentLogo, onLogoChange, shopName }: LogoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, SVG, or WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size exceeds 5MB limit");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Optimize logo dimensions with canvas (max width 600px, max height 300px)
        const maxWidth = 600;
        const maxHeight = 300;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedDataUrl = canvas.toDataURL("image/png", 0.9);
          onLogoChange(optimizedDataUrl);
        } else {
          onLogoChange(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          Store Logo / Brand Icon
        </label>
        {currentLogo && (
          <button
            type="button"
            onClick={() => onLogoChange("")}
            className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Remove Logo
          </button>
        )}
      </div>

      {currentLogo ? (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="h-20 w-32 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-2 flex items-center justify-center overflow-hidden">
              <img
                src={currentLogo}
                alt={shopName || "Store Logo"}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                Custom Logo Active
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Will be printed on A4 Tax Invoices, thermal receipts, and header.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-9 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Replace Logo
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30"
              : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/80"
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center mx-auto mb-2 text-indigo-600 dark:text-indigo-400">
            <Upload className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Click to upload or drag & drop store logo
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            PNG, JPG, WebP or SVG (Recommended: 400x160px transparent PNG)
          </p>
        </div>
      )}

      {error && <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
