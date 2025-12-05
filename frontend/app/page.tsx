"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Activity, TrendingUp, Wallet, AlertCircle, Loader2, Calendar as CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LineChart, Line
} from "recharts";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Date Range State
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const fetchData = async () => {
    setLoading(true);
    try {
        // Construct Query Params for Filtering
        let query = "";
        if (dateRange?.from) {
            const fromStr = dateRange.from.toISOString();
            const toStr = dateRange.to ? dateRange.to.toISOString() : fromStr;
            query = `?from=${fromStr}&to=${toStr}`;
        }

        const res = await api.get(`/dashboard/stats${query}`);
        setData(res.data);
    } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data.");
    } finally {
        setLoading(false);
    }
  };

  // Fetch on Mount and whenever Date Range changes
  useEffect(() => {
    fetchData();
  }, [dateRange]);

  if (loading && !data) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Loading Analytics...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
        <div className="p-8 text-center text-red-500">
            <AlertCircle className="mx-auto h-10 w-10 mb-2" />
            <p>{error}</p>
        </div>
    );
  }

  const { summary, charts, tables } = data || { summary: {}, charts: {}, tables: {} };
  
  const monthlyStats = charts?.monthlyStats || [];
  const topUnpaid = tables?.topUnpaid || [];
  const lastAvgSale = monthlyStats.length > 0 ? monthlyStats[monthlyStats.length - 1].avgSale : 0;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="p-6 space-y-6">
      
      {/* HEADER WITH FILTER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Financial Overview & Analytics</p>
        </div>

        {/* Date Picker */}
        <div className="flex items-center gap-2 bg-card p-1 rounded-lg border shadow-sm">
             <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" className={cn("w-[260px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                            dateRange.to ? (
                                <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>
                            ) : format(dateRange.from, "LLL dd, y")
                        ) : <span>Filter by Date Range</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                    />
                </PopoverContent>
             </Popover>
             {dateRange && (
                 <Button variant="ghost" size="icon" onClick={() => setDateRange(undefined)} title="Clear Filter">
                     <X className="w-4 h-4" />
                 </Button>
             )}
        </div>
      </div>
      
      {/* 1. TOP METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Revenue" value={summary?.totalRevenue || 0} icon={<DollarSign />} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-900/20" />
        <MetricCard title="Total Expenses" value={summary?.totalExpense || 0} icon={<Wallet />} color="text-red-600" bg="bg-red-50 dark:bg-red-900/20" />
        <MetricCard title="Net Profit" value={summary?.netProfit || 0} icon={<Activity />} color="text-green-600" bg="bg-green-50 dark:bg-green-900/20" />
        <MetricCard title="Avg Sale" value={lastAvgSale} icon={<TrendingUp />} color="text-purple-600" bg="bg-purple-50 dark:bg-purple-900/20" />
      </div>

      {/* 2. CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <Card className="shadow-horizon border-none bg-card">
            <CardHeader>
                <CardTitle>Sales vs Expenses</CardTitle>
                <CardDescription>Performance over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyStats}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} dy={10} />
                        <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" tickFormatter={(val) => `₹${val/1000}k`} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{fill: 'hsl(var(--muted)/0.2)'}} contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{paddingTop: '20px'}} />
                        <Bar dataKey="revenue" name="Sales" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                        <Bar dataKey="expense" name="Expenses" fill="hsl(var(--destructive))" radius={[4,4,0,0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        <Card className="shadow-horizon border-none bg-card">
            <CardHeader>
                <CardTitle>Net Balance Trend</CardTitle>
                <CardDescription>Cumulative growth</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyStats}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} dy={10} />
                        <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{paddingTop: '20px'}} />
                        <Line type="monotone" dataKey="balance" name="Net Balance" stroke="#10b981" strokeWidth={3} dot={{r:4, fill:'#10b981'}} />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>

      {/* 3. TABLES ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-horizon border-none bg-card">
            <CardHeader><CardTitle>Recent Balances</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead>Month</TableHead>
                            <TableHead className="text-right">Revenue</TableHead>
                            <TableHead className="text-right">Expense</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {monthlyStats.slice(-5).reverse().map((m: any) => (
                            <TableRow key={m.month}>
                                <TableCell className="font-medium text-foreground">{m.month}</TableCell>
                                <TableCell className="text-right text-green-600">+{formatCurrency(m.revenue)}</TableCell>
                                <TableCell className="text-right text-red-600">-{formatCurrency(m.expense)}</TableCell>
                                <TableCell className={`text-right font-bold ${m.balance >= 0 ? 'text-primary' : 'text-orange-600'}`}>
                                    {formatCurrency(m.balance)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <Card className="shadow-horizon border-none bg-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" /> Pending Payments
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead>Invoice</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {topUnpaid.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No pending invoices!</TableCell></TableRow>
                        ) : topUnpaid.map((inv: any) => (
                            <TableRow key={inv.id}>
                                <TableCell className="font-mono text-xs text-foreground">{inv.invoice_number}</TableCell>
                                <TableCell className="text-muted-foreground">{inv.client?.company_name || "Unknown"}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{inv.due_date ? format(new Date(inv.due_date), "dd MMM") : "-"}</TableCell>
                                <TableCell className="text-right font-bold text-foreground">
                                    {formatCurrency(Number(inv.grand_total))}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Reusable Metric Card
function MetricCard({ title, value, icon, color, bg }: any) {
    const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    return (
        <Card className="shadow-horizon border-none bg-card hover:scale-[1.02] transition-transform duration-200">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <h3 className="text-2xl font-bold text-foreground mt-1">{formatCurrency(Number(value))}</h3>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${bg} ${color}`}>
                    {React.isValidElement(icon) 
                      ? React.cloneElement(icon as React.ReactElement<any>, { className: "h-6 w-6" }) 
                      : icon}
                </div>
            </CardContent>
        </Card>
    )
}

const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    borderColor: 'hsl(var(--border))',
    color: 'hsl(var(--foreground))',
    borderRadius: '12px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    padding: '12px',
    border: '1px solid hsl(var(--border))'
};