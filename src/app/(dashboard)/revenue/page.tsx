"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrderStore } from "@/store/useOrderStore";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { subDays, isAfter, startOfDay } from "date-fns";
import { TrendingUp, Package, Home, DollarSign } from "lucide-react";

const COLORS = ['#10b981', '#6366f1'];

export default function RevenuePage() {
  const { orders } = useOrderStore();

  const metrics = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const lastWeek = subDays(now, 7);
    const lastMonth = subDays(now, 30);

    let todayRev = 0, todayProfit = 0;
    let weekRev = 0, weekProfit = 0;
    let monthRev = 0, monthProfit = 0;

    let shopSales = 0, homeSales = 0;

    const dailyMap: Record<string, { name: string, sales: number, profit: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = subDays(now, i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyMap[dateStr] = { name: dateStr, sales: 0, profit: 0 };
    }

    orders.forEach(order => {
      if (order.status === "CANCELLED") return;

      const orderDate = new Date(order.date);
      if (isNaN(orderDate.getTime())) return;

      const rev = order.total;
      const profit = Math.max(0, order.total - (order.costTotal || 0));

      if (isAfter(orderDate, today)) {
        todayRev += rev;
        todayProfit += profit;
      }
      if (isAfter(orderDate, lastWeek)) {
        weekRev += rev;
        weekProfit += profit;

        const dateKey = orderDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (dailyMap[dateKey]) {
          dailyMap[dateKey].sales += rev;
          dailyMap[dateKey].profit += profit;
        }

        if (order.deliveryMethod === "home_delivery") homeSales += rev;
        else shopSales += rev;
      }
      if (isAfter(orderDate, lastMonth)) {
        monthRev += rev;
        monthProfit += profit;
      }
    });

    return {
      todayRev, todayProfit,
      weekRev, weekProfit,
      monthRev, monthProfit,
      shopSales, homeSales,
      dailyData: Object.values(dailyMap)
    };
  }, [orders]);

  const deliveryData = [
    { name: 'Shop Sales', value: metrics.shopSales },
    { name: 'Home Delivery', value: metrics.homeSales },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Revenue & Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete flow of money, sales trends, and profit margins.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Revenue</p>
                <h3 className="text-3xl font-bold mt-2">Rs {metrics.todayRev.toLocaleString("en-PK")}</h3>
                <p className="text-sm text-green-600 mt-1 flex items-center font-medium">
                  <TrendingUp className="w-4 h-4 mr-1" /> Profit: Rs {metrics.todayProfit.toLocaleString("en-PK")}
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg text-primary">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last 7 Days (Revenue)</p>
                <h3 className="text-3xl font-bold mt-2">Rs {metrics.weekRev.toLocaleString("en-PK")}</h3>
                <p className="text-sm text-green-600 mt-1 flex items-center font-medium">
                  <TrendingUp className="w-4 h-4 mr-1" /> Profit: Rs {metrics.weekProfit.toLocaleString("en-PK")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last 30 Days (Revenue)</p>
                <h3 className="text-3xl font-bold mt-2">Rs {metrics.monthRev.toLocaleString("en-PK")}</h3>
                <p className="text-sm text-green-600 mt-1 flex items-center font-medium">
                  <TrendingUp className="w-4 h-4 mr-1" /> Profit: Rs {metrics.monthProfit.toLocaleString("en-PK")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales vs Profit (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} width={60} tickFormatter={(value) => `Rs ${value}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`Rs ${value.toLocaleString("en-PK")}`, undefined]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Area type="monotone" dataKey="sales" name="Revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                  <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Source (7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deliveryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {deliveryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`Rs ${value.toLocaleString("en-PK")}`, undefined]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="w-full space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <Package className="w-4 h-4 text-muted-foreground" /> Shop Sales
                </div>
                <span className="font-bold">Rs {metrics.shopSales.toLocaleString("en-PK")}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  <Home className="w-4 h-4 text-muted-foreground" /> Home Delivery
                </div>
                <span className="font-bold">Rs {metrics.homeSales.toLocaleString("en-PK")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
