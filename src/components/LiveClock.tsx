"use client";

import React, { useState, useEffect } from 'react';

export default function LiveClock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Hydration fix: only render time on client
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex px-3 py-1.5 h-7 min-w-[140px] bg-card/50 backdrop-blur-md rounded-full border border-border shadow-sm self-start text-xs font-semibold text-muted-foreground animate-pulse" />
    );
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 px-3 py-1.5 bg-card/50 backdrop-blur-md rounded-full border border-border shadow-sm self-start text-xs font-semibold text-foreground/80">
      <span className="tracking-wide whitespace-nowrap">{currentTime.toLocaleDateString('en-GB', { timeZone }).replace(/\//g, '-')}</span>
      <span className="hidden sm:inline opacity-50">&bull;</span>
      <span className="tracking-wide whitespace-nowrap">{currentTime.toLocaleTimeString('en-US', { timeZone, hour12: true })}</span>
    </div>
  );
}
