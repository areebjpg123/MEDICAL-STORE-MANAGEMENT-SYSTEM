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
import { toast } from "sonner";

type OrderItem = { name: string; qty: number; price: number };

type Order = {
  id: string;
  receiptNumber: string;
  clientName: string;
  date: string;
  total: number;
  status: "DISPATCHED" | "PENDING" | "CANCELLED";
  items: OrderItem[];
};

const MOCK_ORDERS: Order[] = [
  { id: "1", receiptNumber: "RCP-001", clientName: "Walk-in", date: "2024-01-15 14:30", total: 1250, status: "DISPATCHED", items: [{ name: "Panadol 500mg", qty: 2, price: 120 }, { name: "Brufen 400mg", qty: 1, price: 180 }, { name: "Disprin", qty: 3, price: 45 }] },
  { id: "2", receiptNumber: "RCP-002", clientName: "Ali Medical", date: "2024-01-15 13:15", total: 8500, status: "DISPATCHED", items: [{ name: "Augmentin 625mg", qty: 5, price: 850 }, { name: "Amoxil 250mg", qty: 10, price: 210 }, { name: "Risek 20mg", qty: 3, price: 380 }] },
  { id: "3", receiptNumber: "RCP-003", clientName: "City Pharmacy", date: "2024-01-15 11:00", total: 3200, status: "PENDING", items: [{ name: "Ponstan 500mg", qty: 5, price: 260 }, { name: "Flagyl 400mg", qty: 10, price: 95 }] },
  { id: "4", receiptNumber: "RCP-004", clientName: "Walk-in", date: "2024-01-15 10:30", total: 450, status: "DISPATCHED", items: [{ name: "Calpol Syrup", qty: 1, price: 150 }, { name: "Rigix 10mg", qty: 2, price: 125 }] },
  { id: "5", receiptNumber: "RCP-005", clientName: "Hameed Medicos", date: "2024-01-14 16:00", total: 6100, status: "DISPATCHED", items: [{ name: "Ventolin Inhaler", qty: 2, price: 650 }, { name: "Nexium 40mg", qty: 4, price: 580 }, { name: "Arinac Forte", qty: 8, price: 195 }] },
  { id: "6", receiptNumber: "RCP-006", clientName: "Walk-in", date: "2024-01-14 09:45", total: 520, status: "CANCELLED", items: [{ name: "Lipitor 20mg", qty: 1, price: 520 }] },
];

function statusColor(status: string) {
  switch (status) {
    case "DISPATCHED": return "bg-green-500/15 text-green-400 border-green-500/20";
    case "PENDING": return "bg-yellow-500/15 text-yellow-400 border-yellow-500/20";
    case "CANCELLED": return "bg-red-500/15 text-red-400 border-red-500/20";
    default: return "";
  }
}

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = MOCK_ORDERS.filter((o) => {
    const matchSearch =
      o.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.clientName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function handleReturn(order: Order) {
    toast.info(`Return process initiated for ${order.receiptNumber}. Full returns modal coming soon.`);
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Order History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage past orders
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
                              </span>
                              <span>Rs {(item.price * item.qty).toLocaleString("en-PK")}</span>
                            </div>
                          ))}
                          <div className="flex gap-2 pt-3">
                            {order.status === "DISPATCHED" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-400 border-red-500/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReturn(order);
                                }}
                              >
                                <RotateCcw className="w-3 h-3 mr-1" /> Process Return
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
    </div>
  );
}
