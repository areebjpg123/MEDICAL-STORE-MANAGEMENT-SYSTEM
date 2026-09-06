"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  CheckCircle2,
  Plus,
  MessageSquare,
  Phone,
  Calendar,
  Settings2,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type ClientBalance = {
  id: string;
  name: string;
  phone: string;
  date: string;
  totalBilled: number;
  totalPaid: number;
};

type Payment = {
  id: string;
  clientName: string;
  phone: string;
  amount: number;
  date: string;
  notes: string;
};

const INITIAL_CLIENTS: ClientBalance[] = [
  { id: "1", name: "Ali Medical Store", phone: "923001234567", date: "2026-09-01", totalBilled: 45000, totalPaid: 37000 },
  { id: "2", name: "City Pharmacy", phone: "923219876543", date: "2026-09-02", totalBilled: 32000, totalPaid: 32000 },
  { id: "3", name: "Hameed Medicos", phone: "923334567890", date: "2026-09-03", totalBilled: 28500, totalPaid: 20000 },
  { id: "4", name: "New Life Pharmacy", phone: "923125554433", date: "2026-09-04", totalBilled: 18000, totalPaid: 10000 },
  { id: "5", name: "Care Pharma", phone: "923456667788", date: "2026-09-05", totalBilled: 55000, totalPaid: 50000 },
];

const INITIAL_PAYMENTS: Payment[] = [
  { id: "1", clientName: "Ali Medical Store", phone: "923001234567", amount: 5000, date: "2026-09-03", notes: "Partial payment" },
  { id: "2", clientName: "Hameed Medicos", phone: "923334567890", amount: 10000, date: "2026-09-04", notes: "Cheque cleared" },
  { id: "3", clientName: "Care Pharma", phone: "923456667788", amount: 25000, date: "2026-09-05", notes: "Bank transfer" },
];

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function LedgerPage() {
  const [clients, setClients] = useState<ClientBalance[]>(INITIAL_CLIENTS);
  const [payments, setPayments] = useState<Payment[]>(INITIAL_PAYMENTS);

  // Default customizable note for all clients
  const [customNote, setCustomNote] = useState("Kindly pay your dues.");

  // Dialog States
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [clientForm, setClientForm] = useState({
    name: "",
    phone: "",
    date: new Date().toISOString().split("T")[0],
    totalBilled: 0,
    totalPaid: 0,
  });

  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    clientName: "",
    phone: "",
    amount: 0,
    notes: "",
  });

  const totalReceivables = clients.reduce((s, c) => s + (c.totalBilled - c.totalPaid), 0);

  function markPaid(client: ClientBalance) {
    const balance = client.totalBilled - client.totalPaid;
    const newPayment: Payment = {
      id: Date.now().toString(),
      clientName: client.name,
      phone: client.phone,
      amount: balance,
      date: new Date().toISOString().split("T")[0],
      notes: "Full balance settled",
    };
    setPayments((prev) => [newPayment, ...prev]);
    setClients((prev) =>
      prev.map((c) => (c.id === client.id ? { ...c, totalPaid: c.totalBilled } : c))
    );
    toast.success(`Marked ${client.name} as fully paid (Rs ${balance.toLocaleString("en-PK")})`);
  }

  function handleSendWhatsAppReminder(client: ClientBalance) {
    const balance = client.totalBilled - client.totalPaid;
    let cleanPhone = client.phone.replace(/[^0-9]/g, "");

    if (cleanPhone.startsWith("0")) {
      cleanPhone = "92" + cleanPhone.slice(1);
    }

    const messageText = `Hello ${client.name},\n\nThis is a reminder regarding your pending ledger balance of Rs ${balance.toLocaleString(
      "en-PK"
    )} for invoice dated ${client.date}.\n\nNote: ${customNote}\n\nThank you,\nHassan Medical Store Management`;

    const encodedText = encodeURIComponent(messageText);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

    window.open(waUrl, "whatsapp_web");
    toast.success(`Opening WhatsApp chat for ${client.name}...`);
  }

  function handleAddClientSubmit() {
    if (!clientForm.name || !clientForm.totalBilled) {
      toast.error("Client name and billed amount are required");
      return;
    }

    const newClient: ClientBalance = {
      id: Date.now().toString(),
      name: clientForm.name,
      phone: clientForm.phone || "923000000000",
      date: clientForm.date || new Date().toISOString().split("T")[0],
      totalBilled: Number(clientForm.totalBilled),
      totalPaid: Number(clientForm.totalPaid) || 0,
    };

    setClients((prev) => [newClient, ...prev]);
    setAddClientOpen(false);
    setClientForm({
      name: "",
      phone: "",
      date: new Date().toISOString().split("T")[0],
      totalBilled: 0,
      totalPaid: 0,
    });
    toast.success("New ledger entry added!");
  }

  function handleAddPaymentSubmit() {
    if (!paymentForm.clientName || !paymentForm.amount) {
      toast.error("Client name and payment amount are required");
      return;
    }

    const newPayment: Payment = {
      id: Date.now().toString(),
      clientName: paymentForm.clientName,
      phone: paymentForm.phone,
      amount: Number(paymentForm.amount),
      date: new Date().toISOString().split("T")[0],
      notes: paymentForm.notes || "Partial payment",
    };

    setPayments((prev) => [newPayment, ...prev]);
    setClients((prev) =>
      prev.map((c) =>
        c.name.toLowerCase() === paymentForm.clientName.toLowerCase()
          ? { ...c, totalPaid: c.totalPaid + Number(paymentForm.amount) }
          : c
      )
    );

    setAddPaymentOpen(false);
    setPaymentForm({ clientName: "", phone: "", amount: 0, notes: "" });
    toast.success("Payment recorded!");
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ledger & Receivables</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage client balances, dates, phone numbers, and WhatsApp reminders
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAddPaymentOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Record Payment
          </Button>
          <Button onClick={() => setAddClientOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Ledger Entry
          </Button>
        </div>
      </div>

      {/* Summary Card + Customizable WhatsApp Note Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div {...fadeIn} className="lg:col-span-1">
          <Card className="h-full flex items-center">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Pending Receivables</p>
                <p className="text-2xl font-bold text-red-400">
                  Rs {totalReceivables.toLocaleString("en-PK")}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Customizable Reminder Note Setting */}
        <motion.div {...fadeIn} className="lg:col-span-2">
          <Card className="h-full border-green-500/30 bg-green-500/5">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-green-400 font-bold text-xs">
                <Settings2 className="w-4 h-4" />
                <span>Customizable WhatsApp Reminder Note (Sent to All Clients)</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g. Kindly pay your dues"
                  className="bg-card text-xs font-medium border-green-500/30"
                />
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white shrink-0 text-xs">
                  Save Note
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                This note will be automatically attached when clicking the <strong>Reminder</strong> button for any client with a pending balance.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="balances">
        <TabsList>
          <TabsTrigger value="balances">Client Balances ({clients.length})</TabsTrigger>
          <TabsTrigger value="payments">Payment Log ({payments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="balances">
          <motion.div {...fadeIn}>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Invoice Date</TableHead>
                    <TableHead className="text-right">Total Billed</TableHead>
                    <TableHead className="text-right">Total Paid</TableHead>
                    <TableHead className="text-right">Balance Due</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((c) => {
                    const balance = c.totalBilled - c.totalPaid;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-bold">{c.name}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {c.phone}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs font-mono">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {c.date}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          Rs {c.totalBilled.toLocaleString("en-PK")}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-400">
                          Rs {c.totalPaid.toLocaleString("en-PK")}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={balance > 0 ? "text-red-400 font-bold" : "text-green-400 font-bold"}>
                            Rs {balance.toLocaleString("en-PK")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {balance > 0 ? (
                            <div className="flex justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-green-600/10 text-green-400 border-green-500/30 hover:bg-green-600/20 text-xs px-2.5"
                                onClick={() => handleSendWhatsAppReminder(c)}
                              >
                                <Send className="w-3 h-3 mr-1 text-green-400" /> Reminder
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-400 border-green-500/20 hover:bg-green-500/10 text-xs px-2.5"
                                onClick={() => markPaid(c)}
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Paid
                              </Button>
                            </div>
                          ) : (
                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                              Fully Settled
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="payments">
          <motion.div {...fadeIn}>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Amount Paid</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-muted-foreground font-mono text-xs">{p.date}</TableCell>
                      <TableCell className="font-bold">{p.clientName}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{p.phone}</TableCell>
                      <TableCell className="text-right font-bold text-green-400">
                        Rs {p.amount.toLocaleString("en-PK")}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{p.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Add New Ledger Entry Dialog */}
      <Dialog open={addClientOpen} onOpenChange={setAddClientOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Ledger Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Client Name *</Label>
              <Input
                value={clientForm.name}
                onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                placeholder="e.g. Ali Medical Store"
              />
            </div>
            <div className="space-y-1">
              <Label>Phone Number *</Label>
              <Input
                value={clientForm.phone}
                onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                placeholder="e.g. 923001234567 or 03001234567"
              />
            </div>
            <div className="space-y-1">
              <Label>Invoice Date *</Label>
              <Input
                type="date"
                value={clientForm.date}
                onChange={(e) => setClientForm({ ...clientForm, date: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Total Billed Amount (Rs) *</Label>
              <Input
                type="number"
                value={clientForm.totalBilled || ""}
                onChange={(e) => setClientForm({ ...clientForm, totalBilled: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label>Initial Amount Paid (Rs)</Label>
              <Input
                type="number"
                value={clientForm.totalPaid || ""}
                onChange={(e) => setClientForm({ ...clientForm, totalPaid: Number(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddClientOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddClientSubmit}>Add Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={addPaymentOpen} onOpenChange={setAddPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Client Name *</Label>
              <Input
                value={paymentForm.clientName}
                onChange={(e) => setPaymentForm({ ...paymentForm, clientName: e.target.value })}
                placeholder="e.g. Ali Medical Store"
              />
            </div>
            <div className="space-y-1">
              <Label>Phone Number</Label>
              <Input
                value={paymentForm.phone}
                onChange={(e) => setPaymentForm({ ...paymentForm, phone: e.target.value })}
                placeholder="e.g. 923001234567"
              />
            </div>
            <div className="space-y-1">
              <Label>Payment Amount (Rs) *</Label>
              <Input
                type="number"
                value={paymentForm.amount || ""}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Input
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="e.g. Cash payment / Cheque"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPaymentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPaymentSubmit}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
