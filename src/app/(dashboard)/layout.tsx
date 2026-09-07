"use client";

import { useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { useInventoryStore } from "@/store/useInventoryStore";
import { useOrderStore } from "@/store/useOrderStore";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { fetchItems, subscribeToRealtime, initialized } = useInventoryStore();
  const { fetchOrders, subscribeToRealtime: subscribeToOrders, initialized: ordersInitialized } = useOrderStore();

  useEffect(() => {
    if (!initialized) {
      fetchItems();
      subscribeToRealtime();
    }
  }, [fetchItems, subscribeToRealtime, initialized]);

  useEffect(() => {
    if (!ordersInitialized) {
      fetchOrders();
      subscribeToOrders();
    }
  }, [fetchOrders, subscribeToOrders, ordersInitialized]);

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 md:pt-0 pt-14 overflow-auto">
        {children}
      </main>
    </div>
  );
}
