"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Store,
  Printer,
  Moon,
  Sun,
  Download,
  Upload,
  Trash2,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function SettingsPage() {
  const [storeName, setStoreName] = useState("Hassan Medical Store");
  const [storeAddress, setStoreAddress] = useState("Shop #12, Main Bazaar, Lahore");
  const [storePhone, setStorePhone] = useState("0300-1234567");
  const [receiptHeader, setReceiptHeader] = useState("Hassan Medical Store");
  const [receiptFooter, setReceiptFooter] = useState("Thank you for your business!");
  const [isDark, setIsDark] = useState(true);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  function handleSave() {
    toast.success("Settings saved successfully");
  }

  function toggleDark(checked: boolean) {
    setIsDark(checked);
    document.documentElement.classList.toggle("dark", checked);
  }

  function handleExport() {
    toast.info("Exporting data...");
  }

  function handleImport() {
    toast.info("Import dialog opening...");
  }

  function handleClearAll() {
    setClearDialogOpen(false);
    toast.success("All data has been cleared");
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your store and application preferences
        </p>
      </div>

      {/* Store Information */}
      <motion.div {...fadeIn}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="w-4 h-4 text-primary" /> Store Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Store Name</Label>
              <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={storePhone} onChange={(e) => setStorePhone(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Receipt Settings */}
      <motion.div {...fadeIn} transition={{ delay: 0.05 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Printer className="w-4 h-4 text-primary" /> Receipt Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Receipt Header</Label>
              <Input value={receiptHeader} onChange={(e) => setReceiptHeader(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Receipt Footer</Label>
              <Input value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">
              Receipts are optimized for 80mm thermal printers.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Theme */}
      <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {isDark ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
              Theme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Dark Mode</p>
                <p className="text-xs text-muted-foreground">
                  Toggle between dark and light themes
                </p>
              </div>
              <Switch checked={isDark} onCheckedChange={toggleDark} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Data Management */}
      <motion.div {...fadeIn} transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="w-4 h-4 text-primary" /> Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" /> Export Data
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleImport}>
                <Upload className="w-4 h-4 mr-2" /> Import Data
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full text-red-400 border-red-500/20 hover:bg-red-500/10"
              onClick={() => setClearDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Clear All Data
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* About */}
      <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="w-4 h-4 text-primary" /> About
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>Medical Store ERP v2.0.0</p>
            <p>Built with Next.js, Shadcn UI, and Framer Motion</p>
            <p>Offline-first architecture with IndexedDB</p>
          </CardContent>
        </Card>
      </motion.div>

      <Separator />

      <Button onClick={handleSave} className="w-full sm:w-auto">
        Save Settings
      </Button>

      {/* Clear Confirmation */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Data?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete all products, orders, and client data.
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearAll}>
              Yes, Clear Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
