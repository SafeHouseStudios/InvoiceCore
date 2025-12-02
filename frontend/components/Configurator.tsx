"use client";

import React, { useEffect } from 'react';
import { useConfigurator } from '@/hooks/use-configurator';
import { useTheme } from 'next-themes';
import { Button } from "@/components/ui/button";
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription
} from "@/components/ui/sheet";
import { Settings, Moon, Sun, Monitor, Layout, Maximize, Check, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function Configurator() {
  const { theme, setTheme } = useTheme();
  const { 
    sidebarType, setSidebarType, 
    contrastMode, setContrastMode,
    primaryColor, setPrimaryColor,
    resetConfig
  } = useConfigurator();

  // --- CRITICAL FIX: Apply Colors on Client Side ---
  useEffect(() => {
    const root = document.documentElement;
    const hsl = hexToHsl(primaryColor);
    root.style.setProperty('--primary', hsl);
    root.style.setProperty('--ring', hsl);
  }, [primaryColor]);

  const brandColors = [
    "#4318FF", // Horizon Purple
    "#39B8FF", // Blue
    "#7B61FF", // Violet
    "#00B69B", // Green
    "#FFB547", // Orange
    "#E31A1A", // Red
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-[0_20px_25px_-5px_rgba(0,0,0,0.3)] z-50 bg-primary hover:bg-primary/90 transition-all hover:scale-110 active:scale-95 border-4 border-white/20 dark:border-navy-900"
          size="icon"
        >
          <Settings className="h-7 w-7 text-white animate-spin-slow" />
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-[90%] sm:w-[400px] border-l border-border bg-background/95 backdrop-blur-xl p-0 shadow-2xl flex flex-col h-full">
        
        {/* Header */}
        <div className="px-6 py-6 border-b border-border bg-card/50 flex justify-between items-start">
          <div className="space-y-1">
             <SheetTitle className="text-xl font-bold text-foreground">Configurator</SheetTitle>
             <SheetDescription className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
               Horizon UI Customizer
             </SheetDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={resetConfig} title="Reset Default">
             <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* 1. Color Mode */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">Color Mode</h3>
            <div className="grid grid-cols-2 gap-4">
              <OptionCard 
                label="Light" 
                active={theme === 'light'} 
                onClick={() => setTheme('light')}
              >
                <div className="w-full h-12 bg-[#F4F7FE] rounded-lg border border-slate-200 relative overflow-hidden shadow-inner">
                    <div className="absolute top-2 left-2 right-2 h-2 bg-white rounded-sm shadow-sm" />
                    <div className="absolute top-6 left-2 w-8 h-2 bg-slate-200 rounded-sm" />
                </div>
              </OptionCard>

              <OptionCard 
                label="Dark" 
                active={theme === 'dark'} 
                onClick={() => setTheme('dark')}
              >
                <div className="w-full h-12 bg-[#0B1437] rounded-lg border border-slate-700 relative overflow-hidden shadow-inner">
                    <div className="absolute top-2 left-2 right-2 h-2 bg-[#111C44] rounded-sm" />
                    <div className="absolute top-6 left-2 w-8 h-2 bg-slate-700 rounded-sm" />
                </div>
              </OptionCard>
            </div>
          </div>

          {/* 2. Contrast */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">Contrast</h3>
            <div className="grid grid-cols-2 gap-4">
              <OptionCard 
                label="Glass" 
                active={contrastMode === 'transparent'} 
                onClick={() => setContrastMode('transparent')}
              >
                 <div className="w-full h-12 bg-gradient-to-br from-blue-50 to-transparent rounded-lg border border-blue-200 relative flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-white/50 backdrop-blur-sm border border-white/40" />
                 </div>
              </OptionCard>

              <OptionCard 
                label="Solid" 
                active={contrastMode === 'filled'} 
                onClick={() => setContrastMode('filled')}
              >
                 <div className="w-full h-12 bg-slate-100 rounded-lg border border-slate-200 relative flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm" />
                 </div>
              </OptionCard>
            </div>
          </div>

          {/* 3. Sidebar */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">Sidebar</h3>
            <div className="grid grid-cols-2 gap-4">
              <OptionCard 
                label="Default" 
                active={sidebarType === 'default'} 
                onClick={() => setSidebarType('default')}
              >
                 <div className="flex h-12 w-full gap-1 p-1 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="w-1/3 h-full bg-primary/20 rounded-md" />
                    <div className="flex-1 h-full bg-white rounded-md border border-slate-100 shadow-sm" />
                 </div>
              </OptionCard>

              <OptionCard 
                label="Mini" 
                active={sidebarType === 'mini'} 
                onClick={() => setSidebarType('mini')}
              >
                 <div className="flex h-12 w-full gap-1 p-1 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="w-2 h-full bg-primary/20 rounded-md" />
                    <div className="flex-1 h-full bg-white rounded-md border border-slate-100 shadow-sm" />
                 </div>
              </OptionCard>
            </div>
          </div>

          {/* 4. Brand Color */}
          <div className="space-y-3 pt-4 border-t border-border">
            <h3 className="text-sm font-bold text-foreground">Brand Color</h3>
            <div className="flex flex-wrap gap-3">
              {brandColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setPrimaryColor(color)}
                  className={cn(
                    "h-8 w-8 rounded-full transition-all flex items-center justify-center shadow-sm relative ring-offset-background",
                    primaryColor === color ? "scale-110 ring-2 ring-offset-2 ring-primary" : "hover:scale-105"
                  )}
                  style={{ backgroundColor: color }}
                >
                  {primaryColor === color && (
                    <Check className="h-4 w-4 text-white drop-shadow-md" strokeWidth={3} />
                  )}
                </button>
              ))}
            </div>
          </div>

        </div>
      </SheetContent>
    </Sheet>
  );
}

// Helper Card Component
function OptionCard({ active, onClick, label, children }: { active: boolean, onClick: () => void, label: string, children: React.ReactNode }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-2xl border-2 p-4 flex flex-col gap-3 transition-all duration-200 group overflow-hidden",
        active 
          ? "border-primary bg-primary/5 dark:bg-primary/10" 
          : "border-border bg-card hover:border-primary/30"
      )}
    >
      <div className="flex justify-between items-center w-full">
          <span className={cn("font-bold text-sm", active ? "text-primary" : "text-foreground")}>
            {label}
          </span>
          {/* Radio Indicator */}
          <div className={cn(
            "h-4 w-4 rounded-full border flex items-center justify-center transition-colors",
            active ? "border-primary bg-primary" : "border-muted-foreground/30"
          )}>
            {active && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
          </div>
      </div>
      
      <div className="opacity-90 pointer-events-none">
        {children}
      </div>
    </div>
  );
}

// Helper: Accurate Hex to HSL Converter
function hexToHsl(hex: string) {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse r, g, b
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  r /= 255; g /= 255; b /= 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  // Return space-separated values for Tailwind (H S% L%)
  return `${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`;
}