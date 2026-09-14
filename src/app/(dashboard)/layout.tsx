"use client";

import { useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { useInventoryStore } from "@/store/useInventoryStore";
import { useOrderStore } from "@/store/useOrderStore";
import { check } from "@tauri-apps/plugin-updater";
import { toast } from "sonner";
import { registerAutoSync } from "@/lib/sync";
import { GlobalA4ReceiptPrinter } from "@/components/GlobalA4ReceiptPrinter";
import { GlobalReceiptPrinter } from "@/components/GlobalReceiptPrinter";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { fetchItems, subscribeToRealtime, initialized } = useInventoryStore();
  const { fetchOrders, subscribeToRealtime: subscribeToOrders, initialized: ordersInitialized } = useOrderStore();

  useEffect(() => {
    registerAutoSync();
  }, []);

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

  useEffect(() => {
    async function checkForUpdates() {
      try {
        const update = await check();
        if (update?.available) {
          toast.success(`Update ${update.version} available! Downloading...`);
          await update.downloadAndInstall();
          toast.success("Update installed! Restarting...");
          // Optionally prompt user to restart
        }
      } catch (e) {
        console.error("Update check failed", e);
      }
    }
    checkForUpdates();
  }, []);

  return (
    <>
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 md:pt-0 pt-14 overflow-auto">
          {children}
        </main>
      </div>
      <GlobalReceiptPrinter />
      <GlobalA4ReceiptPrinter />
    </>
  );
}
