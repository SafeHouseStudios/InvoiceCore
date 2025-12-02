"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileText, Users, Settings, Wallet } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/invoices", label: "Invoices", icon: FileText },
    { href: "/clients", label: "Clients", icon: Users },
    { href: "/expenses", label: "Expenses", icon: Wallet },
    { href: "/quotations", label: "Quotations", icon: FileText },
  ];

  // Helper to check active state (handles sub-pages like /invoices/new)
  const isLinkActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  return (
    <aside className="w-64 glass-panel min-h-screen flex flex-col hidden md:flex sticky top-0 z-50">
      
      {/* Logo Area */}
      <div className="h-20 flex items-center px-6 mb-2">
         <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                <span className="text-white font-bold text-xl">I</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-800">InvoiceCore</h2>
         </div>
      </div>
      
      {/* Main Navigation */}
      <nav className="space-y-1 flex-1 px-3">
        {navItems.map((item) => {
            const active = isLinkActive(item.href);
            return (
                <Link 
                    key={item.href}
                    href={item.href} 
                    className={cn(
                        "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group",
                        active 
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/25" 
                            : "text-slate-500 hover:bg-white/60 hover:text-blue-600 hover:shadow-sm"
                    )}
                >
                    <item.icon className={cn(
                        "h-5 w-5 mr-3 transition-colors", 
                        active ? "text-white" : "text-slate-400 group-hover:text-blue-500"
                    )} />
                    {item.label}
                </Link>
            );
        })}
      </nav>

      {/* Footer Settings */}
      <div className="p-4 mt-auto">
         <div className="pt-4 border-t border-slate-200/50">
            <Link 
                href="/settings"
                className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group",
                    isLinkActive("/settings")
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                        : "text-slate-500 hover:bg-white/60 hover:text-blue-600 hover:shadow-sm"
                )}
            >
                <Settings className={cn(
                    "h-5 w-5 mr-3 transition-colors", 
                    isLinkActive("/settings") ? "text-white" : "text-slate-400 group-hover:text-blue-500"
                )} />
                Settings
            </Link>
         </div>
      </div>
    </aside>
  );
}