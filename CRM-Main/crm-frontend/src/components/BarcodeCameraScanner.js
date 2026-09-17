"use client";

import { useEffect, useRef } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

/**
 * Super-Optimized Barcode Scanner using Html5Qrcode Core
 * This version uses the low-level API for instant camera opening.
 */
const BarcodeCameraScanner = ({ onScanSuccess, onScanError }) => {
  const scannerRef = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    let html5QrCode;

    // Small delay to ensure the UI has finished animating (instant feel)
    const timer = setTimeout(async () => {
      if (!isMounted.current) return;

      try {
        html5QrCode = new Html5Qrcode("barcode-scanner-container");
        scannerRef.current = html5QrCode;

        const config = {
          fps: 8,                    // Low FPS for fast processing
          qrbox: { width: 220, height: 120 }, // Focused scan area
          aspectRatio: 1.333333,     // 4:3 for 640x480
          videoConstraints: {
            facingMode: "environment",
            width: 640,
            height: 480
          }
        };

        // specifically enable barcode formats
        const formats = [ 
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.QR_CODE
        ];

        await html5QrCode.start(
          { facingMode: "environment" }, 
          { ...config, formatsToSupport: formats },
          (decodedText) => {
            console.log("Scan Success:", decodedText);
            if (onScanSuccess) onScanSuccess(decodedText);
          },
          (errorMessage) => {
            // Low-level noise, ignore
            if (onScanError) onScanError(errorMessage);
          }
        );
      } catch (err) {
        console.error("Camera Hardware Error:", err);
      }
    }, 150); // 150ms delay for UI to settle

    return () => {
      isMounted.current = false;
      clearTimeout(timer);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(e => console.warn("Stop Error:", e));
      }
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div className="w-full bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-800 relative group transition-all duration-300">
      {/* Target for html5-qrcode - using the core container for maximum speed */}
      <div id="barcode-scanner-container" className="w-full min-h-[300px] bg-black"></div>
      
      {/* Scanning Sight Overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
         <div className="w-[220px] h-[120px] border-2 border-blue-500/50 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] relative">
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-blue-500 rounded-tl-sm"></div>
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-blue-500 rounded-tr-sm"></div>
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-blue-500 rounded-bl-sm"></div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-blue-500 rounded-br-sm"></div>
            
            {/* Animated Scanning Line */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500/50 shadow-[0_0_8px_blue] animate-badge-pulse opacity-50"></div>
         </div>
      </div>

      {/* Status Badge */}
      <div className="absolute top-4 left-4 z-10">
         <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-xl">
           <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
           <span className="text-[10px] font-bold text-white tracking-widest uppercase">HD Scanner</span>
         </div>
      </div>

      <style jsx global>{`
        #barcode-scanner-container video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            transition: opacity 0.3s ease;
        }
        @keyframes badge-pulse {
            0%, 100% { top: 0%; opacity: 0.3; }
            50% { top: 100%; opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default BarcodeCameraScanner;
