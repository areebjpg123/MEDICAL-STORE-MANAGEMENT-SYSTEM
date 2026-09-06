"use client";

import { useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { useInventoryStore } from "@/store/useInventoryStore";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { fetchItems, subscribeToRealtime, initialized } = useInventoryStore();

  useEffect(() => {
    if (!initialized) {
      fetchItems();
      subscribeToRealtime();
    }
  }, [fetchItems, subscribeToRealtime, initialized]);

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 md:pt-0 pt-14 overflow-auto">
        {children}
      </main>
    </div>
  );
}
