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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type Product = {
  id: string;
  name: string;
  company: string;
  formula: string;
  barcode: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  boxQty: number;
  section: string;
};

const INITIAL_PRODUCTS: Product[] = [
  { id: "1", name: "Panadol 500mg", company: "GSK", formula: "Paracetamol", barcode: "890123001", costPrice: 80, salePrice: 120, stock: 45, boxQty: 100, section: "OTC" },
  { id: "2", name: "Brufen 400mg", company: "Abbott", formula: "Ibuprofen", barcode: "890123002", costPrice: 120, salePrice: 180, stock: 32, boxQty: 50, section: "OTC" },
  { id: "3", name: "Augmentin 625mg", company: "GSK", formula: "Amoxicillin+Clavulanate", barcode: "890123003", costPrice: 600, salePrice: 850, stock: 8, boxQty: 20, section: "Rx" },
  { id: "4", name: "Flagyl 400mg", company: "Sanofi", formula: "Metronidazole", barcode: "890123004", costPrice: 60, salePrice: 95, stock: 60, boxQty: 100, section: "Rx" },
  { id: "5", name: "Amoxil 250mg", company: "GSK", formula: "Amoxicillin", barcode: "890123005", costPrice: 140, salePrice: 210, stock: 25, boxQty: 50, section: "Rx" },
  { id: "6", name: "Disprin", company: "Reckitt", formula: "Aspirin", barcode: "890123006", costPrice: 25, salePrice: 45, stock: 100, boxQty: 200, section: "OTC" },
  { id: "7", name: "Ponstan 500mg", company: "Pfizer", formula: "Mefenamic Acid", barcode: "890123007", costPrice: 175, salePrice: 260, stock: 5, boxQty: 30, section: "Rx" },
  { id: "8", name: "Risek 20mg", company: "Getz", formula: "Omeprazole", barcode: "890123008", costPrice: 250, salePrice: 380, stock: 22, boxQty: 30, section: "Rx" },
  { id: "9", name: "Calpol Syrup", company: "GSK", formula: "Paracetamol", barcode: "890123009", costPrice: 95, salePrice: 150, stock: 35, boxQty: 24, section: "OTC" },
  { id: "10", name: "Ventolin Inhaler", company: "GSK", formula: "Salbutamol", barcode: "890123010", costPrice: 420, salePrice: 650, stock: 3, boxQty: 1, section: "Rx" },
  { id: "11", name: "Rigix 10mg", company: "Sami", formula: "Cetirizine", barcode: "890123011", costPrice: 80, salePrice: 125, stock: 40, boxQty: 50, section: "OTC" },
  { id: "12", name: "Arinac Forte", company: "Abbott", formula: "Pseudoephedrine+Ibuprofen", barcode: "890123012", costPrice: 130, salePrice: 195, stock: 55, boxQty: 50, section: "OTC" },
  { id: "13", name: "Nexium 40mg", company: "AstraZeneca", formula: "Esomeprazole", barcode: "890123013", costPrice: 420, salePrice: 580, stock: 12, boxQty: 14, section: "Rx" },
  { id: "14", name: "Lipitor 20mg", company: "Pfizer", formula: "Atorvastatin", barcode: "890123014", costPrice: 350, salePrice: 520, stock: 7, boxQty: 30, section: "Rx" },
  { id: "15", name: "Zithromax 500mg", company: "Pfizer", formula: "Azithromycin", barcode: "890123015", costPrice: 280, salePrice: 420, stock: 18, boxQty: 6, section: "Rx" },
];

const emptyProduct: Omit<Product, "id"> = {
  name: "", company: "", formula: "", barcode: "", costPrice: 0, salePrice: 0, stock: 0, boxQty: 0, section: "OTC",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [sortKey, setSortKey] = useState<keyof Product>("name");
  const [sortAsc, setSortAsc] = useState(true);

  const criticalCount = products.filter((p) => p.stock < 10).length;
  const totalValue = products.reduce((s, p) => s + p.salePrice * p.stock, 0);

  const filtered = products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.company.toLowerCase().includes(search.toLowerCase()) ||
        p.formula.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search)
    )
    .sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") {
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortAsc ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });

  function toggleSort(key: keyof Product) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyProduct);
    setDialogOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({ name: product.name, company: product.company, formula: product.formula, barcode: product.barcode, costPrice: product.costPrice, salePrice: product.salePrice, stock: product.stock, boxQty: product.boxQty, section: product.section });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.name || !form.salePrice) {
      toast.error("Name and sale price are required");
      return;
    }
    if (editing) {
      setProducts((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...form } : p)));
      toast.success("Product updated");
    } else {
      setProducts((prev) => [...prev, { id: Date.now().toString(), ...form }]);
      toast.success("Product added");
    }
    setDialogOpen(false);
  }

  function handleDelete(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Product deleted");
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {products.length} products · Stock value Rs {totalValue.toLocaleString("en-PK")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {criticalCount > 0 && (
            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 gap-1">
              <AlertTriangle className="w-3 h-3" /> {criticalCount} Critical
            </Badge>
          )}
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-1" /> Add Product
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
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
                  { key: "name", label: "Name" },
                  { key: "company", label: "Company" },
                  { key: "formula", label: "Formula" },
                  { key: "costPrice", label: "Cost" },
                  { key: "salePrice", label: "Sale Price" },
                  { key: "stock", label: "Stock" },
                  { key: "section", label: "Section" },
                ].map((col) => (
                  <TableHead
                    key={col.key}
                    className="cursor-pointer select-none hover:text-foreground"
                    onClick={() => toggleSort(col.key as keyof Product)}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && (
                        <ArrowUpDown className="w-3 h-3" />
                      )}
                    </span>
                  </TableHead>
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filtered.map((product) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`border-b hover:bg-muted/50 transition-colors ${
                      product.stock < 10 ? "border-l-2 border-l-red-500" : ""
                    }`}
                  >
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-muted-foreground">{product.company}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{product.formula}</TableCell>
                    <TableCell>Rs {product.costPrice}</TableCell>
                    <TableCell className="font-medium">Rs {product.salePrice}</TableCell>
                    <TableCell>
                      <span className={product.stock < 10 ? "text-red-400 font-bold" : ""}>
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{product.section}</Badge>
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
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-2">
              <Label>Product Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Formula</Label>
              <Input value={form.formula} onChange={(e) => setForm({ ...form, formula: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Barcode</Label>
              <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <Input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Cost Price</Label>
              <Input type="number" value={form.costPrice || ""} onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Sale Price *</Label>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Add"} Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
