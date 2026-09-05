"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  DollarSign,
  ShoppingBag,
  Package,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statsData = [
  {
    title: "Today's Revenue",
    value: "Rs 24,580",
    change: "+12.5%",
    trend: "up" as const,
    icon: DollarSign,
  },
  {
    title: "Total Orders",
    value: "18",
    change: "+3",
    trend: "up" as const,
    icon: ShoppingBag,
  },
  {
    title: "Products in Stock",
    value: "342",
    change: "-5",
    trend: "down" as const,
    icon: Package,
  },
  {
    title: "Pending Payments",
    value: "Rs 8,200",
    change: "4 clients",
    trend: "down" as const,
    icon: Clock,
  },
];

const recentOrders = [
  { id: "RCP-001", client: "Walk-in", items: 3, total: 1250, status: "DISPATCHED", date: "Today, 2:30 PM" },
  { id: "RCP-002", client: "Ali Medical", items: 12, total: 8500, status: "DISPATCHED", date: "Today, 1:15 PM" },
  { id: "RCP-003", client: "City Pharmacy", items: 5, total: 3200, status: "PENDING", date: "Today, 11:00 AM" },
  { id: "RCP-004", client: "Walk-in", items: 1, total: 450, status: "DISPATCHED", date: "Today, 10:30 AM" },
  { id: "RCP-005", client: "Hameed Medicos", items: 8, total: 6100, status: "DISPATCHED", date: "Yesterday" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

function statusColor(status: string) {
  switch (status) {
    case "DISPATCHED": return "bg-green-500/15 text-green-400 border-green-500/20";
    case "PENDING": return "bg-yellow-500/15 text-yellow-400 border-yellow-500/20";
    case "CANCELLED": return "bg-red-500/15 text-red-400 border-red-500/20";
    default: return "";
  }
}

export default function DashboardPage() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Business overview and quick actions
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/pos">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              New Sale
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statsData.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.title} variants={item}>
              <Card className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center mt-1 text-xs">
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-red-400 mr-1" />
                    )}
                    <span className={stat.trend === "up" ? "text-green-500" : "text-red-400"}>
                      {stat.change}
                    </span>
                    <span className="text-muted-foreground ml-1">from yesterday</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Quick Actions + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Quick Actions */}
        <motion.div variants={item} initial="hidden" animate="show">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/pos" className="block">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <ShoppingBag className="w-4 h-4" /> New Sale
                </Button>
              </Link>
              <Link href="/products" className="block">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Package className="w-4 h-4" /> Add Product
                </Button>
              </Link>
              <Link href="/ledger" className="block">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <BookOpen className="w-4 h-4" /> View Ledger
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          variants={item}
          initial="hidden"
          animate="show"
          className="lg:col-span-3"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{order.id}</TableCell>
                      <TableCell>{order.client}</TableCell>
                      <TableCell className="text-center">{order.items}</TableCell>
                      <TableCell className="text-right font-medium">
                        Rs {order.total.toLocaleString("en-PK")}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={statusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {order.date}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
