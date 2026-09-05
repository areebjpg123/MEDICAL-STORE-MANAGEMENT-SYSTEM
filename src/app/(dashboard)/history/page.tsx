"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Eye,
  Filter,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useOrderStore, Order } from "@/store/useOrderStore";
import { Separator } from "@/components/ui/separator";

function statusColor(status: string) {
  switch (status) {
    case "DISPATCHED": return "bg-green-500/15 text-green-400 border-green-500/20";
    case "PENDING": return "bg-yellow-500/15 text-yellow-400 border-yellow-500/20";
    case "CANCELLED": return "bg-red-500/15 text-red-400 border-red-500/20";
    case "REPLACED": return "bg-purple-500/15 text-purple-400 border-purple-500/20";
    default: return "";
  }
}

export default function HistoryPage() {
  const { orders, processReplacement } = useOrderStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Replacement modal state
  const [replaceModalOpen, setReplaceModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [returnMap, setReturnMap] = useState<{ [itemName: string]: number }>({});

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.clientName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

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
    toast.info("All items selected for return. Click 'Confirm Replacement' to submit.");
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
      toast.error("Please select at least 1 item or quantity to return.");
      return;
    }

    const { refundTotal, itemsRestockedCount } = processReplacement(selectedOrder.id, returnMap);

    toast.success(
      `Replacement complete! ${itemsRestockedCount} items restocked to inventory. Rs ${refundTotal.toLocaleString(
        "en-PK"
      )} refunded and deducted from total revenue.`
    );

    setReplaceModalOpen(false);
    setSelectedOrder(null);
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Order History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View past sales and process itemized medicine replacements
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by receipt # or client..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-[160px]">
            <Filter className="w-3 h-3 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="DISPATCHED">Dispatched</SelectItem>
            <SelectItem value="REPLACED">Replaced</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map((order) => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card
                className="cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              >
                <CardContent className="p-4">
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
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

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
