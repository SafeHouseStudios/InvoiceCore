// frontend/app/quotations/new/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Save, Loader2, PlusCircle } from "lucide-react";
import { QuotationItemsTable, QuoteItem } from "./quotation-items";
import api from "@/lib/api"; 
import Link from "next/link";
import { useRouter } from 'next/navigation';

export default function NewQuotationPage() {
  const router = useRouter();

  // --- State ---
  const [issueDate, setIssueDate] = useState<Date | undefined>(new Date());
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [items, setItems] = useState<QuoteItem[]>([
    { id: 1, description: "", hsn: "", quantity: 1, rate: 0, amount: 0 }
  ]);
  const [subtotal, setSubtotal] = useState(0);
  const [taxData, setTaxData] = useState({
    taxType: "NONE", gstRate: 0, breakdown: { cgst: 0, sgst: 0, igst: 0 }
  });
  const [grandTotal, setGrandTotal] = useState(0);

  // Quote Specific Fields
  const [remarks, setRemarks] = useState("");
  const [contractTerms, setContractTerms] = useState("");

  // --- Data Fetching ---
  useEffect(() => {
    api.get('/clients').then(res => setClients(res.data)).catch(console.error);
  }, []);

  // --- Calculations (Same as Invoice logic) ---
  useEffect(() => {
    const newSubtotal = items.reduce((sum, item) => sum + item.amount, 0);
    setSubtotal(newSubtotal);
  }, [items]);

  useEffect(() => {
    const fetchTaxLogic = async () => {
      if (!selectedClientId) return;
      const client = clients.find(c => c.id.toString() === selectedClientId);
      if (!client) return;

      setIsCalculating(true);
      try {
        const response = await api.post('/invoices/calculate-tax', {
          clientStateCode: client.state_code,
          clientCountry: client.country
        });
        const backendTax = response.data; 
        
        setTaxData({
            ...backendTax,
            breakdown: {
                cgst: (subtotal * backendTax.breakdown.cgst) / 100,
                sgst: (subtotal * backendTax.breakdown.sgst) / 100,
                igst: (subtotal * backendTax.breakdown.igst) / 100,
            }
        });
      } catch (error) {
        console.error(error);
      } finally {
        setIsCalculating(false);
      }
    };
    fetchTaxLogic();
  }, [selectedClientId, subtotal, clients]);

  useEffect(() => {
    const totalTax = taxData.breakdown.cgst + taxData.breakdown.sgst + taxData.breakdown.igst;
    setGrandTotal(subtotal + totalTax);
  }, [subtotal, taxData]);

  // --- Save Handler ---
  const handleSave = async () => {
    if (!selectedClientId) return alert("Select a client");
    if (items.length === 0 || subtotal === 0) return alert("Add items to quote");

    try {
      setIsSaving(true);
      const payload = {
        clientId: Number(selectedClientId),
        issueDate: issueDate?.toISOString(),
        expiryDate: expiryDate?.toISOString(),
        items: items,
        subtotal: subtotal,
        grandTotal: grandTotal,
        remarks: remarks,
        contractTerms: contractTerms,
      };

      const response = await api.post('/quotations', payload);
      alert(`Success! Quotation ${response.data.quotation_number} Created`);
      router.push('/quotations');

    } catch (error: any) {
      console.error(error);
      alert("Failed to create quotation");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">New Quotation</h1>
            <p className="text-sm text-slate-500">Create a proposal for a client</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-slate-900 hover:bg-slate-800">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Quote
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Settings Column */}
        <Card className="md:col-span-1 shadow-sm">
          <CardContent className="p-6 space-y-4">
            
            {/* Quote # (Read Only) */}
            <div className="space-y-2">
              <Label>Quote #</Label>
              <Input value="Auto-generated" disabled className="bg-slate-50" />
            </div>

            {/* Dates */}
            <div className="space-y-2 flex flex-col">
              <Label>Issue Date</Label>
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
            
            <div className="space-y-2 flex flex-col">
              <Label>Valid Until</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className="w-full pl-3 text-left font-normal">
                    {expiryDate ? format(expiryDate, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={expiryDate} onSelect={setExpiryDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

          </CardContent>
        </Card>

        {/* Client & Items Column */}
        <Card className="md:col-span-2 shadow-sm">
          <CardContent className="p-6 space-y-6">
            
            {/* Client Select */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Client</Label>
                <Link href="/clients/new" className="text-xs text-blue-600 hover:underline flex items-center">
                    <PlusCircle className="w-3 h-3 mr-1" /> New Client
                </Link>
              </div>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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

            {/* Items Table */}
            <QuotationItemsTable items={items} setItems={setItems} />

            {/* Contract & Remarks */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Contract Terms / Scope</Label>
                    <Textarea 
                        placeholder="Define scope of work..."
                        value={contractTerms}
                        onChange={(e) => setContractTerms(e.target.value)}
                        className="h-20"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Internal Remarks (Optional)</Label>
                    <Textarea 
                        placeholder="Notes..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="h-20"
                    />
                </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end pt-4 border-t">
                <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Subtotal</span>
                        <span>{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>Tax ({taxData.taxType})</span>
                        <span>{(grandTotal - subtotal).toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                        <span>Total Quote</span>
                        <span>₹{grandTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}