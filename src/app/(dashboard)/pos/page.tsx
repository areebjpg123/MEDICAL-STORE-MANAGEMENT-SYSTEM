"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  X,
  Trash2,
  Receipt,
  CreditCard,
  Banknote,
  Percent,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Product = {
  id: string;
  name: string;
  company: string;
  salePrice: number;
  stock: number;
  barcode: string;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  discount: number;
};

const MOCK_PRODUCTS: Product[] = [
  { id: "1", name: "Panadol 500mg", company: "GSK", salePrice: 120, stock: 45, barcode: "8901234001" },
  { id: "2", name: "Brufen 400mg", company: "Abbott", salePrice: 180, stock: 32, barcode: "8901234002" },
  { id: "3", name: "Augmentin 625mg", company: "GSK", salePrice: 850, stock: 18, barcode: "8901234003" },
  { id: "4", name: "Flagyl 400mg", company: "Sanofi", salePrice: 95, stock: 60, barcode: "8901234004" },
  { id: "5", name: "Amoxil 250mg", company: "GSK", salePrice: 210, stock: 25, barcode: "8901234005" },
  { id: "6", name: "Disprin", company: "Reckitt", salePrice: 45, stock: 100, barcode: "8901234006" },
  { id: "7", name: "Ponstan 500mg", company: "Pfizer", salePrice: 260, stock: 15, barcode: "8901234007" },
  { id: "8", name: "Risek 20mg", company: "Getz", salePrice: 380, stock: 22, barcode: "8901234008" },
  { id: "9", name: "Calpol Syrup", company: "GSK", salePrice: 150, stock: 35, barcode: "8901234009" },
  { id: "10", name: "Ventolin Inhaler", company: "GSK", salePrice: 650, stock: 8, barcode: "8901234010" },
  { id: "11", name: "Rigix 10mg", company: "Sami", salePrice: 125, stock: 40, barcode: "8901234011" },
  { id: "12", name: "Arinac Forte", company: "Abbott", salePrice: 195, stock: 55, barcode: "8901234012" },
];

export default function POSPage() {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [roughCart, setRoughCart] = useState<CartItem[]>([]);
  const [isRoughPad, setIsRoughPad] = useState(false);
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("cash");
  const [phone, setPhone] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const activeCart = isRoughPad ? roughCart : cart;
  const setActiveCart = isRoughPad ? setRoughCart : setCart;

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const filtered = MOCK_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.company.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search)
  );

  function addToCart(product: Product) {
    setActiveCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        { id: product.id, name: product.name, price: product.salePrice, quantity: 1, discount: 0 },
      ];
    });
    toast.success(`Added ${product.name}`, { duration: 1000 });
  }

  function updateQty(id: string, delta: number) {
    setActiveCart((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        if (item.quantity + delta === 0) {
          toast.info(`${item.name} removed from cart`);
        }
      }
      return prev
        .map((i) => (i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0);
    });
  }

  function removeItem(id: string) {
    setActiveCart((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) toast.info(`${item.name} removed from cart`);
      return prev.filter((i) => i.id !== id);
    });
  }

  function addExtra() {
    const name = prompt("Extra item name (e.g. Delivery Fee):");
    if (!name) return;
    const amountStr = prompt("Amount (Rs):");
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) return;
    const extraItem: CartItem = {
      id: `extra-${Date.now()}`,
      name,
      price: amount,
      quantity: 1,
      discount: 0,
    };
    setActiveCart((prev) => [...prev, extraItem]);
    toast.success(`Added extra: ${name}`);
  }

  const subtotal = activeCart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount = (subtotal * overallDiscount) / 100;
  const total = subtotal - discountAmount;

  function handleCheckout() {
    if (activeCart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setCheckoutOpen(true);
  }

  function handleDispatch() {
    toast.success("Order dispatched successfully!");
    setActiveCart([]);
    setCheckoutOpen(false);
    setClientName("");
    setPhone("");
    setOverallDiscount(0);
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-0px)] md:h-screen">
      {/* Left Panel — Product Search */}
      <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or scan barcode..."
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((product) => (
              <motion.div
                key={product.id}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Card
                  className="cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-3">
                    <p className="font-medium text-sm leading-tight">{product.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{product.company}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-primary">
                        Rs {product.salePrice}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          product.stock < 10
                            ? "border-red-500/30 text-red-400"
                            : "border-green-500/30 text-green-400"
                        }`}
                      >
                        {product.stock} left
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel — Cart */}
      <div className="w-full lg:w-[380px] xl:w-[420px] border-t lg:border-t-0 lg:border-l flex flex-col bg-card/30">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">
                {isRoughPad ? "Rough Pad" : "Cart"}
              </h2>
              <Badge variant="secondary" className="text-xs">
                {activeCart.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="cart-toggle" className="text-xs text-muted-foreground">
                Rough Pad
              </Label>
              <Switch
                id="cart-toggle"
                checked={isRoughPad}
                onCheckedChange={(checked) => {
                  setIsRoughPad(checked);
                  toast.info(checked ? "Switched to Rough Pad" : "Switched to Main Cart");
                }}
              />
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <AnimatePresence mode="popLayout">
            {activeCart.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-muted-foreground py-12 text-sm"
              >
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No items in {isRoughPad ? "rough pad" : "cart"}
              </motion.div>
            ) : (
              activeCart.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 py-2.5 border-b border-border/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Rs {item.price} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-full"
                      onClick={() => updateQty(item.id, -1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-full"
                      onClick={() => updateQty(item.id, 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-sm font-semibold w-20 text-right">
                    Rs {(item.price * item.quantity).toLocaleString("en-PK")}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-red-400"
                    onClick={() => removeItem(item.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </ScrollArea>

        {/* Totals & Actions */}
        <div className="p-4 border-t space-y-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={addExtra}
          >
            <Plus className="w-3 h-3 mr-1" /> Add Extra
          </Button>

          <div className="flex items-center gap-2">
            <Percent className="w-3.5 h-3.5 text-muted-foreground" />
            <Input
              type="number"
              placeholder="Discount %"
              className="h-8 text-sm"
              value={overallDiscount || ""}
              onChange={(e) => setOverallDiscount(Number(e.target.value))}
              min={0}
              max={100}
            />
          </div>

          <Separator />

          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>Rs {subtotal.toLocaleString("en-PK")}</span>
            </div>
            {overallDiscount > 0 && (
              <div className="flex justify-between text-red-400">
                <span>Discount ({overallDiscount}%)</span>
                <span>-Rs {discountAmount.toLocaleString("en-PK")}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-1">
              <span>Total</span>
              <span className="text-primary">Rs {total.toLocaleString("en-PK")}</span>
            </div>
          </div>

          <Button className="w-full" size="lg" onClick={handleCheckout}>
            <Receipt className="w-4 h-4 mr-2" />
            Checkout
          </Button>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Client Name</Label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Walk-in customer"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03XX-XXXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Terms</Label>
              <Select value={paymentTerms} onValueChange={(v) => setPaymentTerms(v ?? "cash")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <span className="flex items-center gap-2">
                      <Banknote className="w-4 h-4" /> Cash
                    </span>
                  </SelectItem>
                  <SelectItem value="credit">
                    <span className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Credit
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">Rs {total.toLocaleString("en-PK")}</span>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => {
              toast.info("Preparing receipt for printing...");
              setTimeout(() => window.print(), 100);
            }}>
              <Receipt className="w-4 h-4 mr-2" /> Print Receipt
            </Button>
            <Button onClick={handleDispatch}>
              Dispatch Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden Printable Receipt (Visible only on print) */}
      <div className="hidden print:block receipt-printable bg-white text-black p-4 text-[12px] leading-tight font-mono w-[80mm] absolute top-0 left-0">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold mb-1">MediStore</h2>
          <p>Client: {clientName || "Walk-in"}</p>
          <p>{phone ? `Phone: ${phone}` : ""}</p>
          <p>Date: {new Date().toLocaleString()}</p>
        </div>
        <div className="border-b border-black border-dashed mb-2 pb-1 flex justify-between font-bold">
          <span className="w-1/2">Item</span>
          <span className="w-1/6 text-center">Qty</span>
          <span className="w-1/3 text-right">Total</span>
        </div>
        <div className="space-y-1 mb-2">
          {activeCart.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span className="w-1/2 truncate pr-1">{item.name}</span>
              <span className="w-1/6 text-center">{item.quantity}</span>
              <span className="w-1/3 text-right">{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-black border-dashed pt-2 space-y-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>Rs {subtotal.toLocaleString()}</span>
          </div>
          {overallDiscount > 0 && (
            <div className="flex justify-between">
              <span>Discount ({overallDiscount}%):</span>
              <span>-Rs {discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm mt-1">
            <span>Total:</span>
            <span>Rs {total.toLocaleString()}</span>
          </div>
        </div>
        <div className="text-center mt-6 text-[10px]">
          <p>Thank you for visiting MediStore!</p>
          <p>Powered by MediStore ERP</p>
        </div>
      </div>
    </div>
  );
}
