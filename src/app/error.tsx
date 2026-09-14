'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error("Global application crash caught by error.tsx:", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full p-8 flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-2">
          <AlertTriangle className="text-red-600 dark:text-red-500 w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Something went wrong!</h2>
          <p className="text-muted-foreground text-sm">
            An unexpected error caused the interface to crash. Don't worry, your offline data is safe in the local database.
          </p>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-900 p-3 rounded-md text-left overflow-auto max-h-32 text-xs font-mono text-red-500 border border-slate-200 dark:border-slate-800">
          {error.message || "Unknown rendering error"}
        </div>

        <Button 
          onClick={() => reset()} 
          size="lg" 
          className="w-full font-bold shadow-lg mt-4"
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          Recover & Reload View
        </Button>
      </Card>
    </div>
  );
}
