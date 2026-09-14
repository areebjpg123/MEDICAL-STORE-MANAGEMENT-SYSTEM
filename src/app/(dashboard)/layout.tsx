"use client";

import { useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { useInventoryStore } from "@/store/useInventoryStore";
import { useOrderStore } from "@/store/useOrderStore";
import { check } from "@tauri-apps/plugin-updater";
import { toast } from "sonner";
import { registerAutoSync } from "@/lib/sync";

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
        if (update) {
          toast.info(`Update v${update.version} available! Installing now...`, { duration: 5000 });
          await update.downloadAndInstall();
          toast.success("Update installed. Please restart the app.");
        }
      } catch (error) {
        console.log("Auto-updater check skipped or failed (might not be in Tauri env).", error);
      }
    }
    checkForUpdates();
  }, []);

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 md:pt-0 pt-14 overflow-auto">
        {children}
      </main>
    </div>
  );
}
