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
  Calculator,
  ArrowRight,
  Calendar,
  Check,
  AlertTriangle,
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
import { useInventoryStore, InventoryItem } from "@/store/useInventoryStore";
import { useOrderStore } from "@/store/useOrderStore";
import { useCartStore, CartItem } from "@/store/useCartStore";
import { parseExpiryDate } from "@/lib/expiry";

export default function POSPage() {
  const { items: inventoryItems, deductStockById } = useInventoryStore();
  const { addOrder } = useOrderStore();
  const {
    officialCart,
    roughCart,
    officialDiscountPct,
    roughDiscountPct,
    roughDiscountFixed,
    addToOfficial,
    addToRough,
    updateOfficialQty,
    updateRoughQty,
    removeOfficialItem,
    removeRoughItem,
    setOfficialDiscountPct,
    setRoughDiscountPct,
    setRoughDiscountFixed,
    clearOfficial,
    clearRough,
    syncRoughToOfficial,
  } = useCartStore();

  const [search, setSearch] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("cash");
  const [phone, setPhone] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const filtered = inventoryItems.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.company.toLowerCase().includes(search.toLowerCase()) ||
      p.expDate.includes(search)
  );

  function handleAddItem(product: InventoryItem) {
    const item: CartItem = {
      id: product.id,
      name: product.name,
      price: product.salePrice,
      quantity: 1,
      discount: 0,
    };
    addToOfficial(item);
    addToRough(item);
    toast.success(`Added ${product.name} to Official & Calculation Pad`, { duration: 1000 });
  }

  // Official Calculations
  const officialSubtotal = officialCart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const officialDiscountAmt = (officialSubtotal * officialDiscountPct) / 100;
  const officialTotal = officialSubtotal - officialDiscountAmt;

  // Working Calculation Pad Calculations
  const roughSubtotal = roughCart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const roughPctDiscountAmt = (roughSubtotal * roughDiscountPct) / 100;
  const roughTotal = Math.max(0, roughSubtotal - roughPctDiscountAmt - roughDiscountFixed);

  function handleAddExtra(target: "official" | "rough") {
    const name = prompt("Extra charge name (e.g. Delivery Fee):");
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

    if (target === "official") addToOfficial(extraItem);
    else addToRough(extraItem);

    toast.success(`Added extra: ${name}`);
  }

  function handleCheckout() {
    if (officialCart.length === 0) {
      toast.error("Official cart is empty");
      return;
    }
    setCheckoutOpen(true);
  }

  function handleDispatchOrder() {
    // 1. Record order in Order Store
    addOrder({
      receiptNumber: `RCP-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: clientName || "Walk-in Customer",
      total: officialTotal,
      originalTotal: officialSubtotal,
      items: officialCart.map((i) => ({
        name: i.name,
        qty: i.quantity,
        price: i.price,
      })),
    });

    // 2. Deduct stock from Inventory Store
    officialCart.forEach((i) => {
      if (!i.id.startsWith("extra-")) {
        deductStockById(i.id, i.quantity);
      }
    });

    toast.success("Order dispatched & inventory updated!");
    clearOfficial();
    setCheckoutOpen(false);
    setClientName("");
    setPhone("");
  }

  return (
    <div className="flex flex-col xl:flex-row h-[calc(100vh-0px)] md:h-screen overflow-hidden">
      {/* Left Section — Inventory Search Catalog */}
      <div className="w-full xl:w-[45%] flex flex-col p-4 lg:p-6 overflow-hidden border-b xl:border-b-0 xl:border-r">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Point of Sale</h1>
            <p className="text-xs text-muted-foreground">Select inventory items to bill</p>
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, company, exp..."
              className="pl-9 text-sm"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pr-2">
            {filtered.map((product) => {
              const expStatus = parseExpiryDate(product.expDate);
              return (
                <motion.div
                  key={product.id}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Card
                    className={`cursor-pointer hover:border-primary/50 transition-colors ${
                      expStatus.isExpiringSoon ? "border-amber-500/40 bg-amber-500/5" : ""
                    }`}
                    onClick={() => handleAddItem(product)}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-sm leading-tight truncate">{product.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{product.company}</p>
                      
                      <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground font-mono">
                        <Calendar className="w-3 h-3" />
                        <span className={expStatus.isExpiringSoon ? "text-amber-400 font-bold" : ""}>
                          Exp: {product.expDate}
                        </span>
                      </div>

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
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Right Section — DUAL CALCULATION PANELS (Official Bill + Working Calculation Pad) */}
      <div className="flex-1 flex flex-col md:flex-row bg-card/30 overflow-hidden">
        {/* Panel 1: Official Printable Bill */}
        <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r">
          <div className="p-3.5 border-b bg-card/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-sm">Official Receipt</h2>
              <Badge variant="default" className="text-xs">
                {officialCart.length} items
              </Badge>
            </div>
            {officialCart.length > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={clearOfficial}>
                Clear
              </Button>
            )}
          </div>

          {/* Official Items List */}
          <ScrollArea className="flex-1 p-3">
            <AnimatePresence mode="popLayout">
              {officialCart.length === 0 ? (
                <div className="text-center text-muted-foreground py-12 text-sm">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No items in official bill
                </div>
              ) : (
                officialCart.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-2 py-2 border-b border-border/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Rs {item.price} × {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 rounded-full"
                        onClick={() => updateOfficialQty(item.id, -1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 rounded-full"
                        onClick={() => updateOfficialQty(item.id, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-xs font-bold w-16 text-right">
                      Rs {(item.price * item.quantity).toLocaleString("en-PK")}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-red-400"
                      onClick={() => removeOfficialItem(item.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </ScrollArea>

          {/* Official Totals & Actions */}
          <div className="p-3 border-t bg-card/40 space-y-2.5">
            <div className="flex items-center gap-2">
              <Percent className="w-3.5 h-3.5 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Set Official Discount %"
                className="h-7 text-xs"
                value={officialDiscountPct || ""}
                onChange={(e) => setOfficialDiscountPct(Number(e.target.value))}
                min={0}
                max={100}
              />
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>Rs {officialSubtotal.toLocaleString("en-PK")}</span>
              </div>
              {officialDiscountPct > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Discount ({officialDiscountPct}%)</span>
                  <span>-Rs {officialDiscountAmt.toLocaleString("en-PK")}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1">
                <span>Official Bill</span>
                <span className="text-primary">Rs {officialTotal.toLocaleString("en-PK")}</span>
              </div>
            </div>

            <Button className="w-full h-9" size="sm" onClick={handleCheckout}>
              <Receipt className="w-4 h-4 mr-1.5" />
              Checkout Official Bill
            </Button>
          </div>
        </div>

        {/* Panel 2: Working / Calculation Pad (Beside Official Bill) */}
        <div className="flex-1 flex flex-col bg-purple-500/5">
          <div className="p-3.5 border-b bg-purple-500/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-purple-400" />
              <h2 className="font-bold text-sm text-purple-300">Calculation Pad</h2>
              <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-300">
                Draft / Working
              </Badge>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-purple-300 hover:bg-purple-500/20"
                onClick={() => {
                  syncRoughToOfficial();
                  toast.success("Applied Calculation Pad to Official Bill!");
                }}
              >
                Sync to Official
              </Button>
            </div>
          </div>

          {/* Working Calculation Items List */}
          <ScrollArea className="flex-1 p-3">
            <AnimatePresence mode="popLayout">
              {roughCart.length === 0 ? (
                <div className="text-center text-muted-foreground py-12 text-sm">
                  <Calculator className="w-8 h-8 mx-auto mb-2 opacity-30 text-purple-400" />
                  Calculation Pad Empty
                </div>
              ) : (
                roughCart.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 py-2 border-b border-purple-500/10"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Rs {item.price} × {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 rounded-full"
                        onClick={() => updateRoughQty(item.id, -1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 rounded-full"
                        onClick={() => updateRoughQty(item.id, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-xs font-bold w-16 text-right text-purple-300">
                      Rs {(item.price * item.quantity).toLocaleString("en-PK")}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-red-400"
                      onClick={() => removeRoughItem(item.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </ScrollArea>

          {/* Working Calculation Set Discount & Totals */}
          <div className="p-3 border-t bg-purple-500/10 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Set Discount %</Label>
                <Input
                  type="number"
                  placeholder="%"
                  className="h-7 text-xs"
                  value={roughDiscountPct || ""}
                  onChange={(e) => setRoughDiscountPct(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Set Flat Discount (Rs)</Label>
                <Input
                  type="number"
                  placeholder="Rs"
                  className="h-7 text-xs"
                  value={roughDiscountFixed || ""}
                  onChange={(e) => setRoughDiscountFixed(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>Rs {roughSubtotal.toLocaleString("en-PK")}</span>
              </div>
              {roughDiscountPct > 0 && (
                <div className="flex justify-between text-purple-300">
                  <span>Pct Discount ({roughDiscountPct}%)</span>
                  <span>-Rs {roughPctDiscountAmt.toLocaleString("en-PK")}</span>
                </div>
              )}
              {roughDiscountFixed > 0 && (
                <div className="flex justify-between text-purple-300">
                  <span>Flat Discount</span>
                  <span>-Rs {roughDiscountFixed.toLocaleString("en-PK")}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1 border-t border-purple-500/20">
                <span>Working Calculation Total</span>
                <span className="text-purple-300">Rs {roughTotal.toLocaleString("en-PK")}</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full h-9 text-xs border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
              onClick={() => handleAddExtra("rough")}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Extra Charge to Calculation
            </Button>
          </div>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Official Checkout & Print</DialogTitle>
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
              <span>Total Payable</span>
              <span className="text-primary">Rs {officialTotal.toLocaleString("en-PK")}</span>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                toast.info("Preparing receipt for printing...");
                setTimeout(() => window.print(), 100);
              }}
            >
              <Receipt className="w-4 h-4 mr-2" /> Print Receipt
            </Button>
            <Button onClick={handleDispatchOrder}>
              <Check className="w-4 h-4 mr-1" />
              Dispatch Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden Printable Thermal Receipt */}
      <div className="hidden print:block receipt-printable bg-white text-black p-4 text-[12px] leading-tight font-mono w-[80mm] absolute top-0 left-0">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold mb-1">MediStore ERP</h2>
          <p>Client: {clientName || "Walk-in Customer"}</p>
          <p>{phone ? `Phone: ${phone}` : ""}</p>
          <p>Date: {new Date().toLocaleString()}</p>
        </div>
        <div className="border-b border-black border-dashed mb-2 pb-1 flex justify-between font-bold">
          <span className="w-1/2">Medicine</span>
          <span className="w-1/6 text-center">Qty</span>
          <span className="w-1/3 text-right">Total</span>
        </div>
        <div className="space-y-1 mb-2">
          {officialCart.map((item) => (
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
            <span>Rs {officialSubtotal.toLocaleString()}</span>
          </div>
          {officialDiscountPct > 0 && (
            <div className="flex justify-between">
              <span>Discount ({officialDiscountPct}%):</span>
              <span>-Rs {officialDiscountAmt.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm mt-1">
            <span>Total Amount:</span>
            <span>Rs {officialTotal.toLocaleString()}</span>
          </div>
        </div>
        <div className="text-center mt-6 text-[10px]">
          <p>Thank you for visiting MediStore!</p>
        </div>
      </div>
    </div>
  );
}
