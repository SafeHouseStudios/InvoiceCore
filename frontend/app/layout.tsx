import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/Sidebar"; // Import the component we just made

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InvoiceCore",
  description: "Self-Hosted Invoicing System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "min-h-screen flex selection:bg-blue-100")}>
        
        {/* Use the new Sidebar component here */}
        <Sidebar />

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto max-h-screen bg-transparent relative">
            {children}
        </main>

      </body>
    </html>
  );
}