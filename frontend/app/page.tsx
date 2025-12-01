"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, FileText, Activity, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  AreaChart, 
  Area 
} from "recharts";
import { format } from "date-fns";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch (error) {
        console.error("Dashboard Load Failed", error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-10 flex items-center justify-center text-slate-400">
        Loading Analytics...
      </div>
    );
  }

  // --- Data Processing for Charts ---
  // We merge Revenue and Expense arrays based on the "month" key to plot them together
  const chartData = stats?.revenueChart?.map((r: any) => {
    const expenseItem = stats?.expenseChart?.find((e: any) => e.month === r.month);
    const revenue = Number(r.amount);
    const expense = expenseItem ? Number(expenseItem.amount) : 0;
    
    return {
      name: r.month,
      revenue: revenue,
      expense: expense,
      profit: revenue - expense
    };
  }) || [];

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="min-h-screen bg-slate-50 p-8 space-y-8">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Financial Overview & Analytics</p>
        </div>
        <div className="text-sm font-medium bg-white px-4 py-2 rounded-md border shadow-sm text-slate-600">
           Fiscal Year: 2024-2025
        </div>
      </div>

      {/* --- 1. KEY METRICS CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Revenue */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(Number(stats?.totalRevenue || 0))}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
               <TrendingUp className="w-3 h-3 mr-1 text-green-500" /> Income
            </p>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="border-l-4 border-l-red-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Expenses</CardTitle>
            <Wallet className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(Number(stats?.totalExpense || 0))}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
               <TrendingDown className="w-3 h-3 mr-1 text-red-500" /> Costs
            </p>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className={`border-l-4 shadow-sm ${Number(stats?.netProfit) >= 0 ? 'border-l-green-500' : 'border-l-orange-500'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Net Profit</CardTitle>
            <Activity className={`h-4 w-4 ${Number(stats?.netProfit) >= 0 ? 'text-green-600' : 'text-orange-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${Number(stats?.netProfit) >= 0 ? 'text-green-700' : 'text-orange-700'}`}>
              {formatCurrency(Number(stats?.netProfit || 0))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
               {Number(stats?.netProfit) >= 0 ? "Healthy Margins" : "Check Expenses"}
            </p>
          </CardContent>
        </Card>

        {/* Total Invoices */}
        <Card className="border-l-4 border-l-slate-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Invoices Issued</CardTitle>
            <FileText className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats?.totalInvoices || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
               Lifetime records
            </p>
          </CardContent>
        </Card>

      </div>

      {/* --- 2. CHARTS SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART A: Revenue vs Expense Comparison */}
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>Cash Flow</CardTitle>
                <CardDescription>Monthly Revenue vs Expenses</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            tickFormatter={(val) => `₹${val/1000}k`} 
                        />
                        <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />
                        <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                        <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        {/* CHART B: Profit Trend */}
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>Profitability Trend</CardTitle>
                <CardDescription>Net Profit over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false}
                            tickFormatter={(val) => `₹${val/1000}k`}
                        />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Area 
                            type="monotone" 
                            dataKey="profit" 
                            name="Net Profit" 
                            stroke="#16a34a" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorProfit)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}