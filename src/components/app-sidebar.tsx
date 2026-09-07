"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BookOpen,
  History,
  Settings,
  Pill,
  Menu,
  X,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "Point of Sale", icon: ShoppingCart },
  { href: "/products", label: "Inventory", icon: Package },
  { href: "/revenue", label: "Revenue & Analytics", icon: LayoutDashboard },
  { href: "/ledger", label: "Ledger", icon: BookOpen },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavContent({ pathname }: { pathname: string }) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-4">
        <img src="/icon.png" alt="Hassan Medical Store Logo" className="w-12 h-12 object-contain drop-shadow-sm rounded-lg" />
        <span className="font-bold text-lg leading-tight">
          Hassan Medical<br />Store
        </span>
      </div>

      <Separator className="mb-2" />

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Online Status */}
      <div className="px-4 py-3 mt-auto">
        <Separator className="mb-3" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <Wifi className="w-3 h-3" />
                Online
              </>
            ) : (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <WifiOff className="w-3 h-3" />
                Offline Mode
              </>
            )}
          </div>
          <span className="font-mono text-[10px] font-medium tracking-widest opacity-50">v0.1.1</span>
        </div>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[260px] min-h-screen border-r bg-card/50">
        <NavContent pathname={pathname} />
      </aside>

      {/* Mobile Sheet */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center h-14 px-4 border-b bg-card/80 backdrop-blur-md">
        <Sheet>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" className="mr-3" />}
          >
            <Menu className="w-5 h-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[260px] p-0">
            <NavContent pathname={pathname} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <img src="/icon.png" alt="Hassan Medical Store Logo" className="w-8 h-8 object-contain drop-shadow-sm rounded-md" />
          <span className="font-bold text-sm hidden sm:inline-block">Hassan Medical Store</span>
        </div>
      </div>
    </>
  );
}
