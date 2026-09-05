"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  CheckCircle2,
  Plus,
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
  name: string;
  totalBilled: number;
  totalPaid: number;
};

type Payment = {
  id: string;
  clientName: string;
  amount: number;
  date: string;
  notes: string;
};

const INITIAL_CLIENTS: ClientBalance[] = [
  { name: "Ali Medical Store", totalBilled: 45000, totalPaid: 37000 },
  { name: "City Pharmacy", totalBilled: 32000, totalPaid: 32000 },
  { name: "Hameed Medicos", totalBilled: 28500, totalPaid: 20000 },
  { name: "New Life Pharmacy", totalBilled: 18000, totalPaid: 10000 },
  { name: "Care Pharma", totalBilled: 55000, totalPaid: 50000 },
];

const INITIAL_PAYMENTS: Payment[] = [
  { id: "1", clientName: "Ali Medical Store", amount: 5000, date: "2024-01-15", notes: "Partial payment" },
  { id: "2", clientName: "Hameed Medicos", amount: 10000, date: "2024-01-14", notes: "Cheque cleared" },
  { id: "3", clientName: "Care Pharma", amount: 25000, date: "2024-01-12", notes: "Bank transfer" },
];

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function LedgerPage() {
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [payments, setPayments] = useState(INITIAL_PAYMENTS);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ clientName: "", amount: 0, notes: "" });

  const totalReceivables = clients.reduce((s, c) => s + (c.totalBilled - c.totalPaid), 0);

  function markPaid(clientName: string, balance: number) {
    const newPayment: Payment = {
      id: Date.now().toString(),
      clientName,
      amount: balance,
      date: new Date().toISOString().split("T")[0],
      notes: "Full balance settled",
    };
    setPayments((prev) => [newPayment, ...prev]);
    setClients((prev) =>
      prev.map((c) =>
        c.name === clientName ? { ...c, totalPaid: c.totalBilled } : c
      )
    );
    toast.success(`Marked ${clientName} as fully paid (Rs ${balance.toLocaleString("en-PK")})`);
  }

  function addPayment() {
    if (!paymentForm.clientName || !paymentForm.amount) {
      toast.error("Client name and amount are required");
      return;
    }
    const newPayment: Payment = {
      id: Date.now().toString(),
      ...paymentForm,
      date: new Date().toISOString().split("T")[0],
    };
    setPayments((prev) => [newPayment, ...prev]);
    setClients((prev) =>
      prev.map((c) =>
        c.name === paymentForm.clientName
          ? { ...c, totalPaid: c.totalPaid + paymentForm.amount }
          : c
      )
    );
    setPaymentDialogOpen(false);
    setPaymentForm({ clientName: "", amount: 0, notes: "" });
    toast.success("Payment recorded");
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ledger</h1>
          <p className="text-sm text-muted-foreground mt-1">Track client balances and payments</p>
        </div>
        <Button onClick={() => setPaymentDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Payment
        </Button>
      </div>

      {/* Summary Card */}
      <motion.div {...fadeIn}>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Receivables</p>
              <p className="text-2xl font-bold text-primary">
                Rs {totalReceivables.toLocaleString("en-PK")}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="balances">
        <TabsList>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="balances">
          <motion.div {...fadeIn}>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead className="text-right">Total Billed</TableHead>
                    <TableHead className="text-right">Total Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((c) => {
                    const balance = c.totalBilled - c.totalPaid;
                    return (
                      <TableRow key={c.name}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-right">
                          Rs {c.totalBilled.toLocaleString("en-PK")}
                        </TableCell>
                        <TableCell className="text-right">
                          Rs {c.totalPaid.toLocaleString("en-PK")}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={balance > 0 ? "text-red-400 font-bold" : "text-green-400"}>
                            Rs {balance.toLocaleString("en-PK")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {balance > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-400 border-green-500/20 hover:bg-green-500/10"
                              onClick={() => markPaid(c.name, balance)}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Paid
                            </Button>
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
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-muted-foreground">{p.date}</TableCell>
                      <TableCell className="font-medium">{p.clientName}</TableCell>
                      <TableCell className="text-right font-medium text-green-400">
                        Rs {p.amount.toLocaleString("en-PK")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Add Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Client Name</Label>
              <Input value={paymentForm.clientName} onChange={(e) => setPaymentForm({ ...paymentForm, clientName: e.target.value })} placeholder="Enter client name" />
            </div>
            <div className="space-y-2">
              <Label>Amount (Rs)</Label>
              <Input type="number" value={paymentForm.amount || ""} onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} placeholder="Optional note" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button onClick={addPayment}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
