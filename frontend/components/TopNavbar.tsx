"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, Bell, LogOut, User } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const pageTitle = pathname === "/" 
    ? "Dashboard" 
    : pathname.split('/').filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' / ');

  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear auth
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex flex-col gap-4 md:flex-row md:items-center justify-between p-4 md:p-6 bg-background/80 backdrop-blur-xl border-b border-border/40 transition-all duration-200">
      
      {/* LEFT: Mobile Toggle & Title */}
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden shrink-0">
              <Menu className="h-6 w-6 text-foreground" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px] border-r border-border bg-card">
             <div className="h-full py-4">
                <Sidebar className="flex w-full border-none h-full static" />
             </div>
          </SheetContent>
        </Sheet>

        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-medium">Pages / {pageTitle}</span>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{pageTitle.split(' / ').pop()}</h1>
        </div>
      </div>

      {/* RIGHT: Search & Actions */}
      <div className="flex items-center gap-3 bg-card p-2 rounded-full shadow-sm border border-border/50">
         <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-9 h-9 w-40 md:w-60 rounded-full bg-background border-none focus-visible:ring-0" 
            />
         </div>
         
         <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary">
            <Bell className="h-5 w-5" />
         </Button>
         
         {/* User Dropdown with Logout */}
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 overflow-hidden border-2 border-border hover:border-primary transition-colors">
                    <div className="h-full w-full bg-gradient-to-tr from-primary to-purple-400 flex items-center justify-center text-white font-bold text-xs">
                        AD
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                    <User className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>
      </div>

    </header>
  );
}