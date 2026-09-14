'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical root layout crash caught by global-error.tsx:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 p-4 text-white">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-xl flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mb-2">
              <AlertTriangle className="text-red-500 w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Critical System Error</h2>
              <p className="text-zinc-400 text-sm">
                A fatal error occurred at the root level of the application. Your offline data is safe.
              </p>
            </div>

            <div className="w-full bg-black p-3 rounded-md text-left overflow-auto max-h-32 text-xs font-mono text-red-500 border border-zinc-800">
              {error.message || "Unknown fatal error"}
            </div>

            <button 
              onClick={() => reset()} 
              className="w-full font-bold shadow-lg mt-4 bg-white text-black py-3 rounded-md flex items-center justify-center"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Attempt Full Recovery
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
