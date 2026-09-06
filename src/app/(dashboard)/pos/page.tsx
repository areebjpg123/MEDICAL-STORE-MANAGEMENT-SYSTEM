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
  DollarSign,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [deliveryMethod, setDeliveryMethod] = useState<"shop" | "home_delivery">("shop");
  const [phone, setPhone] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const filtered = inventoryItems.filter(
    (p) =>
      p.category !== "extras" &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.company.toLowerCase().includes(search.toLowerCase()) ||
      p.expDate.includes(search))
  );

  function handleAddItem(product: InventoryItem) {
    const item: CartItem = {
      id: product.id,
      name: product.name,
      price: product.salePrice,
      costPrice: product.costPrice,
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
      deliveryMethod,
      items: officialCart.map((i) => ({
        name: i.name,
        qty: i.quantity,
        price: i.price,
        costPrice: i.costPrice,
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
      <div className="w-full xl:w-[55%] flex flex-col p-4 lg:p-6 overflow-hidden border-b xl:border-b-0 xl:border-r">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Point of Sale</h1>
            <p className="text-xs text-muted-foreground">Select inventory items to bill</p>
          </div>
          <div className="relative flex-1 max-w-[400px] flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, company, exp..."
                className="pl-9 text-sm"
              />
            </div>
            <Select onValueChange={(val) => {
              const item = inventoryItems.find(i => i.id === val);
              if (item) handleAddItem(item);
            }}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Extras" />
              </SelectTrigger>
              <SelectContent>
                {inventoryItems.filter(i => i.category === "extras").map(item => (
                  <SelectItem key={item.id} value={item.id}>{item.name} (Exp: {item.expDate}, Rs {item.salePrice}, Qty: {item.stock})</SelectItem>
                ))}
              </SelectContent>
            </Select>
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

{/* Right Section — DUAL CALCULATION PANELS (Tabs instead of side-by-side) */}
      <div className="w-full xl:w-[45%] flex flex-col bg-card/30 overflow-hidden border-t xl:border-t-0">
        <Tabs defaultValue="official" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-3 pt-3 border-b flex-shrink-0 bg-background/50 backdrop-blur-sm z-10">
            <TabsList className="grid w-full grid-cols-2 h-11">
              <TabsTrigger value="official" className="text-xs sm:text-sm">
                <Receipt className="w-4 h-4 mr-2" />
                Official Receipt
                <Badge variant="secondary" className="ml-2 bg-background shadow-sm">{officialCart.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="rough" className="text-xs sm:text-sm">
                <Calculator className="w-4 h-4 mr-2" />
                Calculation Pad
                <Badge variant="outline" className="ml-2">{roughCart.length}</Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden relative">
            {/* Panel 1: Official Printable Bill */}
            <TabsContent value="official" className="absolute inset-0 flex flex-col m-0 border-none data-[state=inactive]:hidden bg-background">
              <div className="p-3 border-b bg-muted/20 flex items-center justify-between">
                <h2 className="font-semibold text-sm text-foreground">Official Billing Terminal</h2>
                {officialCart.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-red-500" onClick={clearOfficial}>
                    Clear Cart
                  </Button>
                )}
              </div>

              {/* Official Items List */}
              <div className="flex-1 overflow-y-auto p-2 sm:p-4 min-h-0">
                {officialCart.length === 0 ? (
                  <div className="text-center text-muted-foreground py-16 text-sm flex flex-col items-center">
                    <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
                    <p>No items in official bill</p>
                    <p className="text-xs opacity-60 mt-1">Select items from the inventory to add</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {officialCart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 py-2 border-b border-border/50 last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Rs {item.price} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5 border">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-md hover:bg-background shadow-sm"
                            onClick={() => updateOfficialQty(item.id, -1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-xs font-semibold">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-md hover:bg-background shadow-sm"
                            onClick={() => updateOfficialQty(item.id, 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-sm font-bold w-20 text-right tabular-nums text-foreground">
                          Rs {(item.price * item.quantity).toLocaleString("en-PK")}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => removeOfficialItem(item.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Official Totals & Actions */}
              <div className="p-4 border-t bg-muted/10 space-y-3 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Set Official Discount %"
                    className="h-9 text-sm font-medium bg-background"
                    value={officialDiscountPct || ""}
                    onChange={(e) => {
                      let val = Number(e.target.value);
                      if (val > 100) val = 100;
                      if (val < 0) val = 0;
                      setOfficialDiscountPct(val);
                    }}
                    min={0}
                    max={100}
                  />
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>Rs {officialSubtotal.toLocaleString("en-PK")}</span>
                  </div>
                  {officialDiscountPct > 0 && (
                    <div className="flex justify-between text-red-500 font-medium">
                      <span>Discount ({officialDiscountPct}%)</span>
                      <span>-Rs {officialDiscountAmt.toLocaleString("en-PK")}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t mt-1 text-foreground">
                    <span>Total Amount</span>
                    <span className="text-primary">Rs {officialTotal.toLocaleString("en-PK")}</span>
                  </div>
                </div>

                <Button className="w-full h-11 text-base shadow-sm shrink-0" size="lg" onClick={handleCheckout}>
                  <Receipt className="w-5 h-5 mr-2" />
                  Checkout & Print
                </Button>
              </div>
            </TabsContent>

            {/* Panel 2: Working / Calculation Pad */}
            <TabsContent value="rough" className="absolute inset-0 flex flex-col m-0 border-none data-[state=inactive]:hidden bg-muted/5">
              <div className="p-3 border-b bg-muted/20 flex items-center justify-between">
                <h2 className="font-semibold text-sm text-foreground">Working Calculation Pad</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs bg-background"
                    onClick={() => {
                      syncRoughToOfficial();
                      toast.success("Applied Calculation Pad to Official Bill!");
                    }}
                  >
                    Sync to Official
                  </Button>
                  {roughCart.length > 0 && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-red-500" onClick={clearRough}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Working Calculation Items List */}
              <div className="flex-1 overflow-y-auto p-2 sm:p-4 min-h-0">
                {roughCart.length === 0 ? (
                  <div className="text-center text-muted-foreground py-16 text-sm flex flex-col items-center">
                    <Calculator className="w-12 h-12 mb-3 opacity-20" />
                    <p>Calculation Pad Empty</p>
                    <p className="text-xs opacity-60 mt-1">Use this space for scratchpad calculations</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {roughCart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 py-2 border-b border-border/50 last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Rs {item.price} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5 border">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-md hover:bg-background shadow-sm"
                            onClick={() => updateRoughQty(item.id, -1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-xs font-semibold">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-md hover:bg-background shadow-sm"
                            onClick={() => updateRoughQty(item.id, 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-sm font-bold w-20 text-right tabular-nums text-foreground">
                          Rs {(item.price * item.quantity).toLocaleString("en-PK")}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => removeRoughItem(item.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Working Totals */}
              <div className="p-4 border-t bg-muted/10 space-y-3 shrink-0">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Set Discount %</Label>
                    <div className="relative">
                      <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        type="number"
                        className="pl-8 h-9 bg-background focus-visible:ring-primary"
                        value={roughDiscountPct || ""}
                        onChange={(e) => {
                          let val = Number(e.target.value);
                          if (val > 100) val = 100;
                          if (val < 0) val = 0;
                          setRoughDiscountPct(val);
                        }}
                        min={0}
                        max={100}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Set Flat Discount (Rs)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        type="number"
                        className="pl-8 h-9 bg-background focus-visible:ring-primary"
                        value={roughDiscountFixed || ""}
                        onChange={(e) => setRoughDiscountFixed(Number(e.target.value))}
                        min={0}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm pt-2">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>Rs {roughSubtotal.toLocaleString("en-PK")}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-1 text-foreground">
                    <span>Working Total</span>
                    <span>Rs {roughTotal.toLocaleString("en-PK")}</span>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full h-10 shrink-0 bg-background" onClick={() => handleAddExtra("rough")}>
                  <Plus className="w-4 h-4 mr-2" /> Add Extra Charge
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
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
            <div className="space-y-2">
              <Label>Delivery Method</Label>
              <Select value={deliveryMethod} onValueChange={(v) => setDeliveryMethod(v as "shop" | "home_delivery")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shop">Shop Sales</SelectItem>
                  <SelectItem value="home_delivery">Home Delivery</SelectItem>
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
        <div className="text-center mb-4 flex flex-col items-center">
          <img src="/receipt-logo.jpg" alt="MediStore Logo" className="w-16 h-16 mb-2 object-contain" />
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
