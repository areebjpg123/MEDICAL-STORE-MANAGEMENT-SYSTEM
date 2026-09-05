"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Package,
  ArrowUpDown,
  Calendar,
  Image as ImageIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useInventoryStore, InventoryItem } from "@/store/useInventoryStore";
import { parseExpiryDate } from "@/lib/expiry";

const emptyItem: Omit<InventoryItem, "id"> = {
  name: "",
  company: "",
  formula: "",
  expDate: "12-2026",
  costPrice: 0,
  salePrice: 0,
  stock: 0,
  boxQty: 0,
  section: "OTC",
  category: "medicine",
  orderNumber: "",
  orderDate: "",
  billImage: "",
};

export default function ProductsPage() {
  const { items: products, addItem, updateItem, deleteItem } = useInventoryStore();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState(emptyItem);
  const [sortKey, setSortKey] = useState<keyof InventoryItem>("name");
  const [sortAsc, setSortAsc] = useState(true);

  const criticalCount = products.filter((p) => p.stock < 10).length;
  const expiringSoonCount = products.filter(
    (p) => parseExpiryDate(p.expDate).isExpiringSoon
  ).length;
  const totalValue = products.reduce((s, p) => s + p.salePrice * p.stock, 0);

  const filtered = products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.company.toLowerCase().includes(search.toLowerCase()) ||
        p.formula.toLowerCase().includes(search.toLowerCase()) ||
        p.expDate.includes(search)
    )
    .sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") {
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortAsc ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });

  function toggleSort(key: keyof InventoryItem) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyItem);
    setDialogOpen(true);
  }

  function openAddExtra() {
    setEditing(null);
    setForm({ ...emptyItem, category: "extras" });
    setDialogOpen(true);
  }

  function openEdit(product: InventoryItem) {
    setEditing(product);
    setForm({
      name: product.name,
      company: product.company,
      formula: product.formula,
      expDate: product.expDate,
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      stock: product.stock,
      boxQty: product.boxQty,
      section: product.section,
      category: product.category || "medicine",
      orderNumber: product.orderNumber || "",
      orderDate: product.orderDate || "",
      billImage: product.billImage || "",
    });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.name || !form.salePrice) {
      toast.error("Medicine name and sale price are required");
      return;
    }
    if (!form.expDate) {
      toast.error("Expiry date (MM-YYYY) is required");
      return;
    }

    if (editing) {
      updateItem(editing.id, form);
      toast.success("Inventory item updated");
    } else {
      addItem(form);
      toast.success("Inventory item added");
    }
    setDialogOpen(false);
  }

  function handleDelete(id: string) {
    deleteItem(id);
    toast.success("Inventory item deleted");
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {products.length} items in inventory · Stock value Rs {totalValue.toLocaleString("en-PK")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {expiringSoonCount > 0 && (
            <Badge variant="destructive" className="bg-red-600 hover:bg-red-700 text-white font-bold gap-1.5 py-1 px-3 shadow-md shadow-red-600/30">
              <AlertTriangle className="w-4 h-4 animate-bounce" /> {expiringSoonCount} CRITICAL EXPIRY (&le; 7 mos)
            </Badge>
          )}
          {criticalCount > 0 && (
            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 gap-1 py-1 px-2.5">
              <AlertTriangle className="w-3.5 h-3.5" /> {criticalCount} Low Stock
            </Badge>
          )}
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-1" /> Add Inventory Item
          </Button>
          <Button variant="outline" onClick={openAddExtra}>
            <Plus className="w-4 h-4 mr-1" /> Add Extras
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search inventory by name, company, formula, exp date..."
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <ScrollArea className="h-[calc(100vh-300px)]">
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  { key: "name", label: "Medicine Name" },
                  { key: "company", label: "Company" },
                  { key: "formula", label: "Formula" },
                  { key: "expDate", label: "Exp Date (MM-YYYY)" },
                  { key: "costPrice", label: "Cost Price" },
                  { key: "salePrice", label: "Sale Price" },
                  { key: "stock", label: "Stock" },
                  { key: "section", label: "Section" },
                  { key: "orderNumber", label: "Order No." },
                ].map((col) => (
                  <TableHead
                    key={col.key}
                    className="cursor-pointer select-none hover:text-foreground"
                    onClick={() => toggleSort(col.key as keyof InventoryItem)}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && <ArrowUpDown className="w-3 h-3" />}
                    </span>
                  </TableHead>
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filtered.map((product) => {
                  const expStatus = parseExpiryDate(product.expDate);
                  const isCriticalStock = product.stock < 10;
                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`border-b hover:bg-muted/50 transition-colors ${
                        expStatus.isExpiringSoon
                          ? "border-l-4 border-l-red-600 bg-red-500/10 font-medium"
                          : isCriticalStock
                          ? "border-l-4 border-l-red-500"
                          : ""
                      }`}
                    >
                      <TableCell className="font-bold">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground">{product.company}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{product.formula}</TableCell>
                      <TableCell>
                        {expStatus.isExpiringSoon ? (
                          <Badge variant="destructive" className="bg-red-600 text-white font-bold gap-1 font-mono text-xs shadow-sm">
                            <Calendar className="w-3 h-3" />
                            {product.expDate} ({expStatus.monthsRemaining}m left)
                          </Badge>
                        ) : (
                          <span className="font-mono text-sm">{product.expDate}</span>
                        )}
                      </TableCell>
                      <TableCell>Rs {product.costPrice}</TableCell>
                      <TableCell className="font-medium">Rs {product.salePrice}</TableCell>
                      <TableCell>
                        <span className={isCriticalStock ? "text-red-400 font-bold" : ""}>
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{product.section}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{product.orderNumber || "-"}</span>
                          {product.billImage && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                              const w = window.open("");
                              if (w) w.document.write(`<img src="${product.billImage}" style="max-width:100%;height:auto;" />`);
                            }}>
                              <ImageIcon className="w-4 h-4 text-blue-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(product)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-300" onClick={() => handleDelete(product.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Inventory Item" : "Add Inventory Item"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-2">
              <Label>Medicine Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Panadol 500mg" />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="e.g. GSK" />
            </div>
            <div className="space-y-2">
              <Label>Formula</Label>
              <Input value={form.formula} onChange={(e) => setForm({ ...form, formula: e.target.value })} placeholder="e.g. Paracetamol" />
            </div>
            <div className="space-y-2">
              <Label>Expiry Date (MM-YYYY) *</Label>
              <Input value={form.expDate} onChange={(e) => setForm({ ...form, expDate: e.target.value })} placeholder="11-2026" />
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <Input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} placeholder="OTC or Rx" />
            </div>
            <div className="space-y-2">
              <Label>Cost Price (Rs)</Label>
              <Input type="number" value={form.costPrice || ""} onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Sale Price (Rs) *</Label>
              <Input type="number" value={form.salePrice || ""} onChange={(e) => setForm({ ...form, salePrice: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Stock Quantity</Label>
              <Input type="number" value={form.stock || ""} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Box Quantity</Label>
              <Input type="number" value={form.boxQty || ""} onChange={(e) => setForm({ ...form, boxQty: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={form.category || "medicine"}
                onChange={(e) => setForm({ ...form, category: e.target.value as "medicine" | "extras" })}
              >
                <option value="medicine">Medicine</option>
                <option value="extras">Extras</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Order Number</Label>
              <Input value={form.orderNumber || ""} onChange={(e) => setForm({ ...form, orderNumber: e.target.value })} placeholder="e.g. ORD-123" />
            </div>
            <div className="space-y-2">
              <Label>Order Date</Label>
              <Input type="date" value={form.orderDate || ""} onChange={(e) => setForm({ ...form, orderDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Bill Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setForm({ ...form, billImage: reader.result as string });
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Add"} Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
