"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Save, Loader2, PlusCircle } from "lucide-react";
import { InvoiceItemsTable, LineItem } from "./invoice-items"; // Ensure this file exists in the same folder
import api from "@/lib/api"; 
import Link from "next/link";
import { useRouter } from 'next/navigation';

export default function NewInvoicePage() {
  const router = useRouter();

  // --- 1. State Management ---
  const [issueDate, setIssueDate] = useState<Date | undefined>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [invoiceNumber, setInvoiceNumber] = useState("DDP/24-25/XXX"); // Placeholder, backend generates real one
  
  // Clients Data
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  
  // UI States
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Line Items
  const [items, setItems] = useState<LineItem[]>([
    { 
      id: 1, 
      description: "Service Charge", 
      hsn: "",  // <--- ADD THIS LINE
      quantity: 1, 
      rate: 0, 
      amount: 0 
    }
  ]);

  // Financials
  const [subtotal, setSubtotal] = useState(0);
  const [taxData, setTaxData] = useState({
    taxType: "NONE", // 'IGST' | 'CGST_SGST' | 'NONE'
    gstRate: 0,
    breakdown: { cgst: 0, sgst: 0, igst: 0 }
  });
  const [grandTotal, setGrandTotal] = useState(0);

  // --- 2. Data Fetching & Effects ---

  // A. Fetch Clients on Load
  useEffect(() => {
    const loadClients = async () => {
      try {
        const res = await api.get('/clients');
        setClients(res.data);
      } catch (err) {
        console.error("Failed to load clients", err);
      }
    };
    loadClients();
  }, []);

  // B. Calculate Subtotal whenever items change
  useEffect(() => {
    const newSubtotal = items.reduce((sum, item) => sum + item.amount, 0);
    setSubtotal(newSubtotal);
  }, [items]);

  // C. Calculate Tax whenever Client or Subtotal changes
  useEffect(() => {
    const fetchTaxLogic = async () => {
      // Don't calculate if no client selected or empty subtotal
      if (!selectedClientId) return;

      const client = clients.find(c => c.id.toString() === selectedClientId);
      if (!client) return;

      setIsCalculating(true);
      try {
        // Ask Backend: "What tax applies to this client?"
        const response = await api.post('/invoices/calculate-tax', {
          clientStateCode: client.state_code,
          clientCountry: client.country
        });

        const backendTax = response.data; 
        
        // Calculate actual amounts based on the rate returned
        // Logic: (Subtotal * Rate) / 100
        const calculatedTax = {
            ...backendTax,
            breakdown: {
                cgst: (subtotal * backendTax.breakdown.cgst) / 100,
                sgst: (subtotal * backendTax.breakdown.sgst) / 100,
                igst: (subtotal * backendTax.breakdown.igst) / 100,
            }
        };

        setTaxData(calculatedTax);

      } catch (error) {
        console.error("Failed to calculate tax", error);
      } finally {
        setIsCalculating(false);
      }
    };

    fetchTaxLogic();
  }, [selectedClientId, subtotal, clients]);

  // D. Update Grand Total
  useEffect(() => {
    const totalTax = taxData.breakdown.cgst + taxData.breakdown.sgst + taxData.breakdown.igst;
    setGrandTotal(subtotal + totalTax);
  }, [subtotal, taxData]);


  // --- 3. Save Handler ---
  const handleSave = async () => {
    if (!selectedClientId) {
      alert("Please select a client first.");
      return;
    }
    if (items.length === 0 || subtotal === 0) {
      alert("Please add at least one item with a price.");
      return;
    }

    try {
      setIsSaving(true);
      
      const payload = {
        clientId: Number(selectedClientId),
        issueDate: issueDate?.toISOString(),
        dueDate: dueDate?.toISOString(),
        items: items,
        taxSummary: taxData,
        subtotal: subtotal,
        grandTotal: grandTotal
      };

      const response = await api.post('/invoices', payload);
      
      alert(`Success! Invoice Created: ${response.data.invoice_number}`);
      router.push('/invoices'); // Redirect to list view

    } catch (error) {
      console.error(error);
      alert("Failed to save invoice. Please check console for details.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- 4. Render ---
  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Invoice</h1>
          <p className="text-sm text-slate-500">Create a new invoice for a client</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-slate-900 hover:bg-slate-800">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {isSaving ? "Saving..." : "Save Invoice"}
        </Button>
      </div>

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Client Selection */}
        <Card className="md:col-span-1 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Client</Label>
                <Link href="/clients/new" className="text-xs text-blue-600 hover:underline flex items-center">
                    <PlusCircle className="w-3 h-3 mr-1" /> New Client
                </Link>
              </div>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
              >
                <option value="">Select Client...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.company_name} ({client.state_code})
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Date Selection */}
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
          </CardContent>
        </Card>

        {/* Invoice Info (Read Only) */}
        <Card className="md:col-span-1 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Invoice #</Label>
              <Input 
                value={invoiceNumber} 
                readOnly 
                className="font-mono bg-slate-100 text-slate-500 cursor-not-allowed" 
                title="Generated automatically upon saving"
              />
              <p className="text-[10px] text-slate-400">Auto-generated upon save</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items & Totals */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <InvoiceItemsTable items={items} setItems={setItems} />
          
          {/* --- TOTALS SECTION --- */}
          <div className="flex justify-end mt-6">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>{subtotal.toFixed(2)}</span>
              </div>

              {/* Dynamic Tax Rendering */}
              {isCalculating ? (
                <div className="flex items-center justify-end text-xs text-slate-400 py-2">
                    <Loader2 className="w-3 h-3 animate-spin mr-1" /> Calculating Tax...
                </div>
              ) : (
                <>
                  {/* Scenario 1: IGST */}
                  {taxData.taxType === 'IGST' && (
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>IGST (18%)</span>
                      <span>{taxData.breakdown.igst.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Scenario 2: CGST + SGST */}
                  {taxData.taxType === 'CGST_SGST' && (
                    <>
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>CGST (9%)</span>
                        <span>{taxData.breakdown.cgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>SGST (9%)</span>
                        <span>{taxData.breakdown.sgst.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  {/* Scenario 3: Export */}
                  {taxData.taxType === 'NONE' && selectedClientId && (
                     <div className="flex justify-between text-sm text-green-600">
                        <span>Tax (Export)</span>
                        <span>0.00</span>
                     </div>
                  )}
                </>
              )}

              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}