import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { scanImageData } from '@undecaf/zbar-wasm';
import { 
  MultiFormatReader, 
  BarcodeFormat, 
  DecodeHintType, 
  RGBLuminanceSource, 
  BinaryBitmap, 
  HybridBinarizer 
} from '@zxing/library';
import { X, Camera, Zap, ZapOff } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Types ──
interface DetectionResult {
  value: string;
  type: string;
}

interface CodeScannerProps {
  onDetected: (result: DetectionResult) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

const CodeScanner: React.FC<CodeScannerProps> = ({ onDetected, onError, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [isMirrored, setIsMirrored] = useState(false);
  const [boxSize, setBoxSize] = useState(250); // Initial box size
  const [engineUsed, setEngineUsed] = useState<string>('INITIALIZING...');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const lastCodeRef = useRef<string>('');
  const lastCodeTimeRef = useRef<number>(0);
  const onDetectedRef = useRef(onDetected);
  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  const lastScannedCodeRef = useRef<string | null>(null);
  const consecutiveMatchCount = useRef<number>(0);

  const handleDetection = useCallback((value: string, type: string) => {
    // Basic length filter for 1D barcodes to prevent partial reads
    if ((type.includes('code') || type.includes('ean') || type.includes('upc') || type === 'zbar') && value.length < 5) {
      return;
    }

    if (value === lastScannedCodeRef.current) {
      consecutiveMatchCount.current += 1;
    } else {
      lastScannedCodeRef.current = value;
      consecutiveMatchCount.current = 1;
    }

    // Require 3 consecutive matches for 1D barcodes to prevent partial reads.
    // QR codes have built-in error correction, so 1 or 2 is enough.
    const requiredMatches = type.includes('qr') ? 1 : 3;

    if (consecutiveMatchCount.current >= requiredMatches) {
      const now = Date.now();
      if (value === lastCodeRef.current && now - lastCodeTimeRef.current < 2000) {
        return; 
      }
      lastCodeRef.current = value;
      lastCodeTimeRef.current = now;

      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
      onDetectedRef.current({ value, type });
      
      consecutiveMatchCount.current = 0;
    }
  }, []);

  const killCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => { t.stop(); t.enabled = false; });
      streamRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => { t.stop(); t.enabled = false; });
      videoRef.current.srcObject = null;
    }
  }, []);

  // ── Resize Logic ──
  const isResizing = useRef(false);
  const startY = useRef(0);
  const startSize = useRef(0);

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!isResizing.current) return;
      // If we drag down, increase size.
      const dy = e.clientY - startY.current;
      let newSize = startSize.current + dy * 2; 
      if (newSize < 150) newSize = 150;
      if (newSize > 500) newSize = 500;
      setBoxSize(newSize);
    };
    const handleUp = () => {
      isResizing.current = false;
      document.body.style.userSelect = 'auto'; // restore
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, []);

  const handleResizeStart = (e: React.PointerEvent) => {
    isResizing.current = true;
    startY.current = e.clientY;
    startSize.current = boxSize;
    document.body.style.userSelect = 'none'; // prevent text selection while dragging
    e.preventDefault();
  };

  useEffect(() => {
    let rafId: number;
    let isMounted = true;
    let barcodeDetector: any = null;
    let zxingReader: MultiFormatReader | null = null;

    // 1. Initialize Native BarcodeDetector (if available)
    if ('BarcodeDetector' in window) {
      try {
        barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf']
        });
      } catch (e) {
        try { barcodeDetector = new (window as any).BarcodeDetector(); } catch (e2) {}
      }
    }

    // 2. Initialize ZXing Fallback
    zxingReader = new MultiFormatReader();
    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.ITF
    ]);
    zxingReader.setHints(hints);

    if (barcodeDetector) {
      setEngineUsed('WATERFALL: NATIVE > ZBAR > ZXING');
    } else {
      setEngineUsed('WATERFALL: ZBAR > ZXING');
    }

    const startScanner = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        
        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current!;
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

        video.srcObject = stream;
        await video.play();

        let scanning = false;
        const scan = async () => {
          if (!isMounted) return;
          rafId = requestAnimationFrame(scan);
          
          if (scanning || !video.videoWidth || video.paused) return;
          scanning = true;

          try {
            const vWidth = video.videoWidth;
            const vHeight = video.videoHeight;
            const cWidth = video.clientWidth;
            const cHeight = video.clientHeight;

            if (vWidth && vHeight && cWidth && cHeight) {
              const s = Math.max(cWidth / vWidth, cHeight / vHeight);
              const sWidth = boxSize / s;
              const sHeight = boxSize / s;
              const sx = (vWidth - sWidth) / 2;
              const sy = (vHeight - sHeight) / 2;

              const destSize = 640;
              canvas.width = destSize;
              canvas.height = destSize;

              ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, destSize, destSize);

              const imgData = ctx.getImageData(0, 0, destSize, destSize);
              const data = imgData.data;

              // Preprocess for WASM / ZXing (Native usually doesn't need this, but we use it for all)
              for (let y = 0; y < destSize; y++) {
                for (let x = 0; x < destSize; x++) {
                  const idx = (y * destSize + x) * 4;
                  const r = data[idx];
                  const g = data[idx + 1];
                  const b = data[idx + 2];
                  if (r > 150 && g < 100 && b < 100) {
                    const replaceY = Math.max(0, y - 5);
                    const replaceIdx = (replaceY * destSize + x) * 4;
                    data[idx] = data[replaceIdx];
                    data[idx + 1] = data[replaceIdx + 1];
                    data[idx + 2] = data[replaceIdx + 2];
                  }
                }
              }

              // Basic image processing: convert to grayscale and increase contrast
              const contrast: number = 1.5;
              const grayBuffer = new Uint8ClampedArray(destSize * destSize);
              for (let i = 0; i < destSize * destSize; i++) {
                const idx = i * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                let gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                if (contrast !== 1.0) {
                  gray = 128 + (gray - 128) * contrast;
                  gray = Math.max(0, Math.min(255, gray));
                }
                const roundedGray = Math.round(gray);
                data[idx] = roundedGray;
                data[idx + 1] = roundedGray;
                data[idx + 2] = roundedGray;
                grayBuffer[i] = roundedGray;
              }
              ctx.putImageData(imgData, 0, 0);

              let found = false;

              // STAGE 1: NATIVE
              if (barcodeDetector && !found) {
                try {
                  const symbols = await barcodeDetector.detect(imgData);
                  if (symbols && symbols.length > 0) {
                    handleDetection(symbols[0].rawValue, symbols[0].format.toLowerCase());
                    found = true;
                  }
                } catch (e) {}
              }

              // STAGE 2: ZBAR WASM (pyzbar equivalent)
              if (!found) {
                try {
                  const symbols = await scanImageData(imgData);
                  if (symbols && symbols.length > 0) {
                    const s = symbols[0];
                    let val = '';
                    if (typeof s.decode === 'function') {
                      val = s.decode();
                    } else {
                      val = String.fromCharCode.apply(null, Array.from(new Uint8Array(s.data)));
                    }
                    handleDetection(val, s.typeName.toLowerCase());
                    found = true;
                  }
                } catch (e) {}
              }

              // STAGE 3: ZXING LIBRARY
              if (!found) {
                try {
                  const luminanceSource = new RGBLuminanceSource(grayBuffer, destSize, destSize);
                  const binarizer = new HybridBinarizer(luminanceSource);
                  const bitmap = new BinaryBitmap(binarizer);
                  const result = zxingReader!.decode(bitmap);
                  if (result) {
                    const val = result.getText();
                    const formatEnum = result.getBarcodeFormat();
                    const formatStr = BarcodeFormat[formatEnum] || 'unknown';
                    handleDetection(val, formatStr.toLowerCase());
                    found = true;
                  }
                } catch (e) {}
              }

            }
          } catch {
          } finally {
            scanning = false;
          }
        };

        rafId = requestAnimationFrame(scan);

      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : String(err);
          setError(message || 'Camera permission denied or scanner initialization failed.');
          onError?.(message || 'Scanner failed.');
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      cancelAnimationFrame(rafId);
      killCamera();
    };
  }, [boxSize, killCamera, onError, handleDetection]);

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    try {
      const track = streamRef.current.getVideoTracks()[0];
      await track.applyConstraints({
        advanced: [{ torch: !torchOn } as unknown as MediaTrackConstraintSet],
      });
      setTorchOn(!torchOn);
    } catch {
      toast.error('Flashlight not supported on this device.');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200">
      <canvas ref={canvasRef} className="hidden" />
      <div className="absolute top-0 left-0 right-0 z-20 p-4 md:p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center backdrop-blur-md border border-blue-500/30">
            <Camera size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg tracking-wide leading-tight">Barcode Scanner</h3>
            <p className="text-blue-200/70 text-xs font-medium">Position code inside the box</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button onClick={() => setIsMirrored(!isMirrored)} className={`p-2 rounded-full transition-colors text-white text-xs font-bold ${isMirrored ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-800 hover:bg-slate-700'}`}>
            FLIP
          </button>
          <button onClick={toggleTorch} className={`p-2 rounded-full transition-colors ${torchOn ? 'bg-yellow-500 text-black' : 'bg-slate-800 text-white hover:bg-slate-700'}`}>
            {torchOn ? <Zap size={20} /> : <ZapOff size={20} />}
          </button>
          {onClose && (
            <button onClick={() => { killCamera(); onClose(); }} className="p-2 bg-red-600 rounded-full hover:bg-red-700 transition-colors">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-black">
        {error ? (
          <div className="text-red-400 p-6 text-center max-w-sm bg-red-950/30 rounded-2xl border border-red-900/50 backdrop-blur-md z-20">
            <p className="font-bold text-lg mb-2 flex items-center justify-center gap-2">
              <X size={20} /> Scanner Error
            </p>
            <p className="text-sm opacity-80">{error}</p>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
              playsInline 
              muted 
              autoPlay 
              style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
            />
            
            <div className="absolute inset-0 z-10 pointer-events-none bg-black/50" style={{
              clipPath: `polygon(
                0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
                calc(50% - ${boxSize/2}px) calc(50% - ${boxSize/2}px),
                calc(50% - ${boxSize/2}px) calc(50% + ${boxSize/2}px),
                calc(50% + ${boxSize/2}px) calc(50% + ${boxSize/2}px),
                calc(50% + ${boxSize/2}px) calc(50% - ${boxSize/2}px),
                calc(50% - ${boxSize/2}px) calc(50% - ${boxSize/2}px)
              )`
            }}></div>

            <div 
              className="relative z-20"
              style={{ width: `${boxSize}px`, height: `${boxSize}px` }}
            >
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl pointer-events-none"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl pointer-events-none"></div>

              <div 
                className="absolute -bottom-3 -right-3 w-10 h-10 cursor-se-resize flex items-center justify-center touch-none bg-transparent hover:bg-blue-500/20 rounded-full transition-colors"
                onPointerDown={handleResizeStart}
              >
                <div className="w-4 h-4 bg-blue-500 rounded-full shadow-lg border-2 border-white"></div>
              </div>

              <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_8px_2px_rgba(239,68,68,0.8)] animate-[scan_2s_ease-in-out_infinite] pointer-events-none"></div>

              <style>{`
                @keyframes scan {
                  0% { top: 5%; opacity: 0; }
                  10% { opacity: 1; }
                  90% { opacity: 1; }
                  100% { top: 95%; opacity: 0; }
                }
              `}</style>
            </div>
          </>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 pb-safe bg-gradient-to-t from-black to-transparent pt-12 pb-8 pointer-events-none">
        <div className="max-w-md mx-auto px-6 flex flex-col items-center gap-4">
          <p className="text-blue-400 text-[10px] uppercase tracking-widest font-bold">
            ENGINE: {engineUsed}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CodeScanner;
