"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, FileText, Activity, TrendingUp, TrendingDown, Wallet, Calendar } from "lucide-react";
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
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-sm font-medium">Loading Analytics...</p>
      </div>
    );
  }

  // --- Data Processing for Charts ---
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
    <div className="min-h-screen p-8 space-y-8">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your financial performance.</p>
        </div>
        {/* Glass Effect on Pill */}
        <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white/40 shadow-sm text-sm text-slate-600">
           <Calendar className="w-4 h-4 text-blue-500" />
           <span>Fiscal Year: <span className="font-semibold text-slate-900">2024-2025</span></span>
        </div>
      </div>

      {/* --- 1. KEY METRICS CARDS (Glass Effect) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Revenue */}
        <Card className="glass hover:-translate-y-1 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Revenue</CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(Number(stats?.totalRevenue || 0))}
            </div>
            <p className="text-xs text-green-600 mt-2 flex items-center font-medium bg-green-50/50 w-fit px-2 py-1 rounded-md">
               <TrendingUp className="w-3 h-3 mr-1" /> +12.5% vs last month
            </p>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="glass hover:-translate-y-1 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Expenses</CardTitle>
            <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(Number(stats?.totalExpense || 0))}
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center">
               <span className="text-red-600 flex items-center mr-1"><TrendingDown className="w-3 h-3 mr-1" /> 4.3%</span> vs last month
            </p>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className="glass hover:-translate-y-1 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Net Profit</CardTitle>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${Number(stats?.netProfit) >= 0 ? 'bg-green-50' : 'bg-orange-50'}`}>
                <Activity className={`h-5 w-5 ${Number(stats?.netProfit) >= 0 ? 'text-green-600' : 'text-orange-600'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${Number(stats?.netProfit) >= 0 ? 'text-green-700' : 'text-orange-700'}`}>
              {formatCurrency(Number(stats?.netProfit || 0))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
               {Number(stats?.netProfit) >= 0 ? "Healthy Margins" : "Action Required"}
            </p>
          </CardContent>
        </Card>

        {/* Total Invoices */}
        <Card className="glass hover:-translate-y-1 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Invoices Issued</CardTitle>
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-slate-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats?.totalInvoices || 0}</div>
            <p className="text-xs text-slate-500 mt-2">
               Lifetime records generated
            </p>
          </CardContent>
        </Card>

      </div>

      {/* --- 2. CHARTS SECTION (Glass Effect) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART A */}
        <Card className="glass">
            <CardHeader>
                <CardTitle className="text-lg">Cash Flow</CardTitle>
                <CardDescription>Monthly Revenue vs Expenses</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                        <XAxis 
                            dataKey="name" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            stroke="#64748b"
                            dy={10}
                        />
                        <YAxis 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            stroke="#64748b"
                            tickFormatter={(val) => `₹${val/1000}k`} 
                        />
                        <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{ 
                                borderRadius: '12px', 
                                border: '1px solid rgba(255,255,255,0.8)', 
                                backgroundColor: 'rgba(255,255,255,0.8)', 
                                backdropFilter: 'blur(4px)',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' 
                            }}
                            cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                        <Bar 
                            dataKey="revenue" 
                            name="Revenue" 
                            fill="hsl(221, 83%, 53%)" 
                            radius={[6, 6, 0, 0]} 
                            barSize={20} 
                        />
                        <Bar 
                            dataKey="expense" 
                            name="Expenses" 
                            fill="hsl(0, 84%, 60%)" 
                            radius={[6, 6, 0, 0]} 
                            barSize={20} 
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        {/* CHART B */}
        <Card className="glass">
            <CardHeader>
                <CardTitle className="text-lg">Profitability Trend</CardTitle>
                <CardDescription>Net Profit Growth over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15}/>
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                        <XAxis 
                            dataKey="name" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            stroke="#64748b"
                            dy={10}
                        />
                        <YAxis 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false}
                            stroke="#64748b"
                            tickFormatter={(val) => `₹${val/1000}k`}
                        />
                        <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{ 
                                borderRadius: '12px', 
                                border: '1px solid rgba(255,255,255,0.8)', 
                                backgroundColor: 'rgba(255,255,255,0.8)', 
                                backdropFilter: 'blur(4px)',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' 
                            }} 
                        />
                        <Area 
                            type="monotone" 
                            dataKey="profit" 
                            name="Net Profit" 
                            stroke="#16a34a" 
                            strokeWidth={3}
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