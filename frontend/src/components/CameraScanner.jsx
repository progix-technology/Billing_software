import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

const CameraScanner = ({ onScanSuccess, onClose }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    // Configuration for scanner
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 100 },
      rememberLastUsedCamera: true,
      supportedScanTypes: [] // Empty defaults to all supported formats (QR, EAN, UPC, CODE128 etc)
    };

    // Initialize scanner
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "reader",
      config,
      /* verbose= */ false
    );

    const onScan = (decodedText) => {
      // Play a beep sound on scan success if available
      try {
        const audio = new Audio('/beep.mp3');
        audio.play().catch(e => console.log('Audio play error', e));
      } catch (e) { }

      onScanSuccess(decodedText);
    };

    html5QrcodeScanner.render(onScan, (error) => {
      // We don't need to alert on every scan failure
    });

    scannerRef.current = html5QrcodeScanner;

    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex flex-col justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in relative">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-800 dark:text-white">Scan Barcode</h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-950 min-h-[300px]">
          {/* Reader Target Div */}
          <div id="reader" className="w-full rounded-xl overflow-hidden shadow-inner border-2 border-primary-500/20"></div>

          <p className="text-center text-xs text-slate-500 mt-4">
            Point your camera at a barcode to scan it. <br />
            Make sure you have granted camera permissions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CameraScanner;
