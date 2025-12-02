"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useConfigurator } from "@/hooks/use-configurator"; // Ensure this hook exists from previous step
import { 
  LayoutDashboard, FileText, Users, Settings, Wallet, 
  ChevronLeft, ChevronRight, PieChart, Package 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { sidebarType, setSidebarType } = useConfigurator();
  const isMini = sidebarType === 'mini';

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/invoices", label: "Invoices", icon: FileText },
    { href: "/quotations", label: "Quotations", icon: FileText },
    { href: "/clients", label: "Clients", icon: Users },
    { href: "/expenses", label: "Expenses", icon: Wallet },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const isLinkActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  return (
    <aside 
      className={cn(
        "hidden md:flex flex-col bg-card border-r border-border/50 h-screen sticky top-0 transition-all duration-300 ease-in-out z-40",
        isMini ? "w-[80px]" : "w-[290px]",
        className
      )}
    >
      {/* --- LOGO AREA --- */}
      <div className={cn("h-24 flex items-center px-8", isMini && "justify-center px-0")}>
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 text-white font-black text-xl shrink-0">
                IC
            </div>
            {!isMini && (
              <h2 className="text-2xl font-bold tracking-tight text-foreground transition-opacity duration-300">
                Invoice<span className="text-primary">Core</span>
              </h2>
            )}
         </div>
      </div>

      {/* --- SEPARATOR --- */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-6 mx-6" />
      
      {/* --- NAVIGATION --- */}
      <nav className="space-y-2 flex-1 px-4">
        {navItems.map((item) => {
            const active = isLinkActive(item.href);
            return (
                <Link 
                    key={item.href}
                    href={item.href} 
                    className={cn(
                        "flex items-center relative group transition-all duration-200 rounded-xl",
                        isMini ? "justify-center py-4" : "px-5 py-4",
                        active 
                            ? "bg-primary text-white shadow-md shadow-primary/25 font-semibold" 
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                    title={isMini ? item.label : undefined}
                >
                    <item.icon className={cn(
                        "shrink-0 transition-transform duration-200", 
                        isMini ? "h-6 w-6" : "h-5 w-5 mr-4",
                        active && !isMini && "scale-110"
                    )} />
                    
                    {!isMini && (
                      <span className="truncate">{item.label}</span>
                    )}

                    {/* Active Indicator for Mini Mode */}
                    {active && isMini && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-l-full" />
                    )}
                </Link>
            );
        })}
      </nav>

      {/* --- TOGGLE BUTTON --- */}
      <div className="p-4 mt-auto border-t border-border/50">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-center text-muted-foreground hover:text-primary"
          onClick={() => setSidebarType(isMini ? 'default' : 'mini')}
        >
          {isMini ? <ChevronRight className="h-5 w-5" /> : (
            <div className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs uppercase tracking-widest font-bold">Collapse</span>
            </div>
          )}
        </Button>
      </div>
    </aside>
  );
}