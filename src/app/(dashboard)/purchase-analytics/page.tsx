"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ArrowUpDown,
  PieChart,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInventoryStore, InventoryItem } from "@/store/useInventoryStore";

export default function PurchaseAnalyticsPage() {
  const { items: products } = useInventoryStore();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof InventoryItem>("name");
  const [sortAsc, setSortAsc] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Filter out items that have no base amount (assuming they were added before analytics was introduced)
  const analyticsProducts = products.filter(p => p.baseAmount && p.baseAmount > 0);

  const filtered = analyticsProducts
    .filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.company.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const av = a[sortKey] || 0;
      const bv = b[sortKey] || 0;
      if (typeof av === "string" && typeof bv === "string") {
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortAsc ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedProducts = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  function toggleSort(key: keyof InventoryItem) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const totalBaseValue = analyticsProducts.reduce((sum, p) => sum + (p.baseAmount || 0) * p.stock, 0);
  const totalNetValue = analyticsProducts.reduce((sum, p) => sum + (p.netCost || 0) * p.stock, 0);
  const totalDiscountsReceived = totalBaseValue - totalNetValue;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <PieChart className="w-6 h-6 text-blue-600" /> Purchase Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Detailed cost breakdowns for your inventory purchases
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-white dark:bg-zinc-900 border-l-4 border-l-blue-500">
          <p className="text-sm font-medium text-slate-500">Tracked Items</p>
          <p className="text-2xl font-bold">{analyticsProducts.length}</p>
        </Card>
        <Card className="p-4 bg-white dark:bg-zinc-900 border-l-4 border-l-emerald-500">
          <p className="text-sm font-medium text-slate-500">Total Net Investment</p>
          <p className="text-2xl font-bold text-emerald-600">Rs {totalNetValue.toLocaleString("en-PK", { maximumFractionDigits: 2 })}</p>
        </Card>
        <Card className="p-4 bg-white dark:bg-zinc-900 border-l-4 border-l-amber-500">
          <p className="text-sm font-medium text-slate-500">Total Savings (Discounts/Bonus)</p>
          <p className="text-2xl font-bold text-amber-600">Rs {totalDiscountsReceived.toLocaleString("en-PK", { maximumFractionDigits: 2 })}</p>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by medicine or company name..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <ScrollArea className="h-[calc(100vh-350px)]">
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  { key: "name", label: "Medicine Details" },
                  { key: "purchaseSource", label: "Source" },
                  { key: "baseAmount", label: "Base Amount" },
                  { key: "tradeDiscount", label: "TP Disc" },
                  { key: "extraDiscount", label: "Extra Disc" },
                  { key: "taxPercentage", label: "Tax" },
                  { key: "stock", label: "Paid Qty" },
                  { key: "bonusQuantity", label: "Bonus Qty" },
                  { key: "netCost", label: "Net Cost (Per Unit)" },
                ].map((col) => (
                  <TableHead
                    key={col.key}
                    className="cursor-pointer select-none hover:text-foreground text-xs"
                    onClick={() => toggleSort(col.key as keyof InventoryItem)}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && <ArrowUpDown className="w-3 h-3" />}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={9} className="h-32 text-center text-slate-500">
                     <Package className="w-8 h-8 mx-auto mb-2 opacity-20" />
                     No purchase analytics data found for the current search.
                   </TableCell>
                 </TableRow>
              ) : (
                <AnimatePresence>
                  {paginatedProducts.map((product) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <TableCell>
                        <div className="font-bold text-slate-900 dark:text-white leading-tight">{product.name}</div>
                        <div className="text-muted-foreground text-xs mt-1">{product.company}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={product.purchaseSource === 'company' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-700 border-slate-200'}>
                          {product.purchaseSource?.toUpperCase() || 'MARKET'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        Rs {product.baseAmount}
                      </TableCell>
                      <TableCell className="text-amber-600 font-medium">
                        {product.tradeDiscount}%
                      </TableCell>
                      <TableCell className="text-amber-600 font-medium">
                        {product.extraDiscount || 0}%
                      </TableCell>
                      <TableCell className="text-red-500">
                        {product.taxPercentage || 0}%
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.stock}
                      </TableCell>
                      <TableCell className="text-emerald-600 font-bold">
                        +{product.bonusQuantity || 0}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-blue-600">Rs {(product.netCost || 0).toFixed(2)}</div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-4 py-4 border-t border-slate-200 dark:border-zinc-800">
          <div className="text-sm text-slate-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} products
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Previous
            </Button>
            <span className="flex items-center px-3 text-sm font-medium">
              Page {currentPage} of {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
