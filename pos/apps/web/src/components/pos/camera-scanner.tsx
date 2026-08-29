import React, { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface CameraScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export function CameraScanner({ onScanSuccess, onClose }: CameraScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Initialize html5-qrcode scanner
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader-container",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.777778
      },
      /* verbose= */ false
    );

    scannerRef.current.render(
      (decodedText) => {
        onScanSuccess(decodedText);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(err => console.error("Error clearing scanner", err));
        }
        onClose();
      },
      (error) => {
        // Silent logging to avoid console clutter
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Clean up error", err));
      }
    };
  }, [onScanSuccess, onClose]);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-sm text-gray-900">Scan Barcode with Camera</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 font-bold"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4 flex flex-col items-center">
          <div id="qr-reader-container" className="w-full rounded-xl overflow-hidden border border-gray-200 shadow-inner bg-slate-950 min-h-[250px]" />
          <p className="text-[10px] text-gray-400 mt-3 font-semibold uppercase tracking-wider text-center">
            Position the product barcode in front of the camera frame
          </p>
        </div>
      </div>
    </div>
  );
}
