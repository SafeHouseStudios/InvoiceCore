// frontend/src/app/invoices/new/page.tsx
"use client";

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Save } from "lucide-react";

export default function NewInvoicePage() {
  // State for Form Data
  const [issueDate, setIssueDate] = useState<Date | undefined>(new Date());
  const [invoiceNumber, setInvoiceNumber] = useState("DDP/24-25/001"); // Placeholder
  
  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      
      {/* --- TOP HEADER --- */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Invoice</h1>
          <p className="text-sm text-slate-500">Create a new invoice for a client</p>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-800">
          <Save className="w-4 h-4 mr-2" />
          Save Invoice
        </Button>
      </div>

      {/* --- MAIN FORM GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left: Client Selection (Taking up 1 column) */}
        <Card className="md:col-span-1 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Client</Label>
              {/* We will replace this with a real Dropdown later */}
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <option>Select Client...</option>
                <option>Peterborough Subaru</option>
                <option>Jack McGee Chevrolet</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Center: Dates (Taking up 1 column) */}
        <Card className="md:col-span-1 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2 flex flex-col">
              <Label>Invoice Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className="w-full pl-3 text-left font-normal">
                    {issueDate ? format(issueDate, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={issueDate} onSelect={setIssueDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="text" placeholder="Net 15 / Net 30" />
            </div>
          </CardContent>
        </Card>

        {/* Right: Invoice # & PO (Taking up 1 column) */}
        <Card className="md:col-span-1 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Invoice #</Label>
              <Input 
                value={invoiceNumber} 
                onChange={(e) => setInvoiceNumber(e.target.value)} 
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>PO Number</Label>
              <Input placeholder="Optional" />
            </div>
          </CardContent>
        </Card>

      </div>
      
      {/* We will add the Line Items Table here in the next step */}
      <div className="text-center text-gray-400 py-10 border-2 border-dashed rounded-lg">
        Line Items Component Coming Soon...
      </div>

    </div>
  );
}