"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  DollarSign,
  ShoppingBag,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Eye,
  Minus,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useOrderStore, Order } from "@/store/useOrderStore";
import { useInventoryStore, getExpiringSoonItems } from "@/store/useInventoryStore";
import { parseExpiryDate } from "@/lib/expiry";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

function statusColor(status: string) {
  switch (status) {
    case "DISPATCHED": return "bg-green-500/15 text-green-400 border-green-500/20";
    case "PENDING": return "bg-yellow-500/15 text-yellow-400 border-yellow-500/20";
    case "CANCELLED": return "bg-red-500/15 text-red-400 border-red-500/20";
    case "REPLACED": return "bg-purple-500/15 text-purple-400 border-purple-500/20";
    default: return "";
  }
}

export default function DashboardPage() {
  const { orders, totalRevenue, processReplacement } = useOrderStore();
  const { items: inventoryItems } = useInventoryStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Replacement Modal State
  const [replaceModalOpen, setReplaceModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [returnMap, setReturnMap] = useState<{ [itemName: string]: number }>({});

  const expiringItems = getExpiringSoonItems(inventoryItems);

  const statsData = [
    {
      title: "Today's Revenue",
      value: `Rs ${totalRevenue.toLocaleString("en-PK")}`,
      change: "Live Revenue",
      trend: "up" as const,
      icon: DollarSign,
    },
    {
      title: "Total Orders",
      value: orders.length.toString(),
      change: "Active Sales",
      trend: "up" as const,
      icon: ShoppingBag,
    },
    {
      title: "Inventory Items",
      value: inventoryItems.length.toString(),
      change: `${inventoryItems.filter((i) => i.stock < 10).length} low stock`,
      trend: "down" as const,
      icon: Package,
    },
    {
      title: "Expiring Soon (≤ 7 mos)",
      value: expiringItems.length.toString(),
      change: "ALERT: Expiring items",
      trend: "down" as const,
      icon: AlertTriangle,
      isAlert: true,
    },
  ];

  function openReplaceModal(order: Order) {
    setSelectedOrder(order);
    const initialReturns: { [itemName: string]: number } = {};
    order.items.forEach((i) => {
      initialReturns[i.name] = 0;
    });
    setReturnMap(initialReturns);
    setReplaceModalOpen(true);
  }

  function handleReplaceWholeOrder() {
    if (!selectedOrder) return;
    const fullReturns: { [itemName: string]: number } = {};
    selectedOrder.items.forEach((i) => {
      fullReturns[i.name] = i.qty;
    });
    setReturnMap(fullReturns);
    toast.info("All items selected for return.");
  }

  function updateReturnQty(itemName: string, maxQty: number, delta: number) {
    setReturnMap((prev) => {
      const current = prev[itemName] || 0;
      const next = Math.max(0, Math.min(maxQty, current + delta));
      return { ...prev, [itemName]: next };
    });
  }

  const calculatedRefundTotal = selectedOrder
    ? selectedOrder.items.reduce((sum, i) => sum + (returnMap[i.name] || 0) * i.price, 0)
    : 0;

  function confirmReplacementSubmit() {
    if (!selectedOrder) return;
    if (calculatedRefundTotal === 0) {
      toast.error("Please select at least 1 item to return.");
      return;
    }

    const { refundTotal, itemsRestockedCount } = processReplacement(selectedOrder.id, returnMap);

    toast.success(
      `Replacement complete! ${itemsRestockedCount} items restocked to inventory. Rs ${refundTotal.toLocaleString(
        "en-PK"
      )} refunded.`
    );

    setReplaceModalOpen(false);
    setSelectedOrder(null);
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Business overview and expiry alerts
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/pos">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              New Sale
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statsData.map((stat) => {
          const Icon = stat.icon;
          const isRevenue = stat.title === "Today's Revenue";
          
          const cardContent = (
            <Card className={`relative overflow-hidden ${isRevenue ? "hover:border-primary/50 cursor-pointer transition-colors" : ""} ${stat.isAlert && expiringItems.length > 0 ? "border-2 border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20" : ""}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className={`text-sm font-medium ${stat.isAlert && expiringItems.length > 0 ? "text-red-400 font-bold" : "text-muted-foreground"}`}>
                  {stat.title}
                </CardTitle>
                <div className={`flex items-center justify-center w-8 h-8 rounded-md ${stat.isAlert && expiringItems.length > 0 ? "bg-red-500/20 text-red-500" : "bg-primary/10 text-primary"}`}>
                  <Icon className={`w-4 h-4 ${stat.isAlert && expiringItems.length > 0 ? "animate-pulse" : ""}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.isAlert && expiringItems.length > 0 ? "text-red-500" : ""}`}>{stat.value}</div>
                <div className="flex items-center mt-1 text-xs">
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-red-500 mr-1" />
                  )}
                  <span className={stat.trend === "up" ? "text-green-500" : "text-red-500 font-semibold"}>
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          );

          return (
            <motion.div key={stat.title} variants={item}>
              {isRevenue ? <Link href="/revenue">{cardContent}</Link> : cardContent}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Expiry Alerts Section — BOLD VIBRANT ALERT RED */}
      {expiringItems.length > 0 && (
        <Card className="border-2 border-red-500 bg-red-500/10 shadow-xl shadow-red-500/10">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between bg-red-500/15 border-b border-red-500/30">
            <div className="flex items-center gap-2 text-red-500 font-bold text-base tracking-wide">
              <AlertTriangle className="w-5 h-5 text-red-500 animate-bounce" />
              <span>CRITICAL EXPIRY ALERT (&le; 7 Months Remaining)</span>
            </div>
            <Link href="/products">
              <Button variant="destructive" size="sm" className="text-xs bg-red-600 hover:bg-red-700 font-bold">
                View All Inventory &rarr;
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {expiringItems.slice(0, 6).map((med) => {
                const status = parseExpiryDate(med.expDate);
                return (
                  <div key={med.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-red-500/40 shadow-sm text-xs">
                    <div>
                      <p className="font-bold text-red-400">{med.name}</p>
                      <p className="text-muted-foreground">{med.company}</p>
                    </div>
                    <Badge variant="destructive" className="bg-red-600 text-white font-bold border-red-700 font-mono text-xs px-2 py-1">
                      <Calendar className="w-3 h-3 mr-1" /> {med.expDate} ({status.monthsRemaining}m left)
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders (Full Width) */}
      <motion.div variants={item} initial="hidden" animate="show">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold">Recent Orders</CardTitle>
            <Link href="/history">
              <Button variant="ghost" size="sm" className="text-xs">
                View All History &rarr;
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orders.slice(0, 6).map((order) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 cursor-pointer hover:border-primary/40 transition-colors bg-card"
                  onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-mono text-sm font-bold">{order.receiptNumber}</p>
                        <p className="text-sm text-muted-foreground">{order.clientName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold">Rs {order.total.toLocaleString("en-PK")}</p>
                        <p className="text-xs text-muted-foreground">{order.date}</p>
                      </div>
                      <Badge variant="outline" className={statusColor(order.status)}>
                        {order.status}
                      </Badge>
                      {expandedId === order.id ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedId === order.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t space-y-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {item.name} × {item.qty}
                                {item.returnedQty && item.returnedQty > 0 ? (
                                  <span className="text-purple-400 text-xs ml-2 font-medium">
                                    ({item.returnedQty} returned)
                                  </span>
                                ) : null}
                              </span>
                              <span>Rs {(item.price * item.qty).toLocaleString("en-PK")}</span>
                            </div>
                          ))}
                          <div className="flex gap-2 pt-3">
                            {(order.status === "DISPATCHED" || order.status === "REPLACED") && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-purple-400 border-purple-500/20 hover:bg-purple-500/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openReplaceModal(order);
                                }}
                              >
                                <RotateCcw className="w-3 h-3 mr-1" /> Replace
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.info("Preparing receipt for printing...");
                                setTimeout(() => window.print(), 100);
                              }}
                            >
                              <Eye className="w-3 h-3 mr-1" /> View Receipt
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Replacement Modal */}
      <Dialog open={replaceModalOpen} onOpenChange={setReplaceModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-purple-400" />
              Order Replacement & Return Pad
            </DialogTitle>
            <DialogDescription>
              {selectedOrder ? `Receipt: ${selectedOrder.receiptNumber} (${selectedOrder.clientName})` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Select medicines/tablets to return:</span>
              <Button variant="secondary" size="sm" className="text-xs h-7" onClick={handleReplaceWholeOrder}>
                Replace Whole Order
              </Button>
            </div>

            <div className="border rounded-lg p-3 space-y-3 bg-card/40 max-h-[260px] overflow-y-auto">
              {selectedOrder?.items.map((item) => {
                const returnQty = returnMap[item.name] || 0;
                return (
                  <div key={item.name} className="flex items-center justify-between gap-3 text-sm py-1 border-b border-border/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Bought: {item.qty} | Unit: Rs {item.price}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-full"
                        onClick={() => updateReturnQty(item.name, item.qty, -1)}
                        disabled={returnQty <= 0}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-bold text-purple-400">
                        {returnQty}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-full"
                        onClick={() => updateReturnQty(item.name, item.qty, 1)}
                        disabled={returnQty >= item.qty}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator />

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Calculated Refund Total:</span>
                <span className="font-bold text-red-400">
                  -Rs {calculatedRefundTotal.toLocaleString("en-PK")}
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Inventory Restock:</span>
                <span className="text-green-400">
                  +{Object.values(returnMap).reduce((a, b) => a + b, 0)} units will be returned to stock
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setReplaceModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmReplacementSubmit} className="bg-purple-600 hover:bg-purple-700">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Confirm Replacement & Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
