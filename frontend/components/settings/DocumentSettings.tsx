"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function DocumentSettings() {
  const [settings, setSettings] = useState<any>({});
  const [nextInvoiceSeq, setNextInvoiceSeq] = useState("");
  const [nextQuoteSeq, setNextQuoteSeq] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/settings/documents').then(res => setSettings(res.data || {}));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const saveSettings = async () => {
    setLoading(true);
    try { await api.put('/settings/documents', settings); alert("Saved!"); } 
    catch (e) { alert("Failed"); } finally { setLoading(false); }
  };

  const updateSeq = async (type: string, val: string) => {
     if(!val) return;
     try { await api.put('/settings/sequence', { type, next_number: val }); alert("Sequence Updated!"); } 
     catch (e) { alert("Failed"); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
       <ConfigCard title="Invoice Configuration">
          <div className="space-y-2"><Label>Number Format</Label><Input name="invoice_format" value={settings.invoice_format || ''} onChange={handleChange} /></div>
          <div className="space-y-2"><Label>Document Label</Label><Input name="invoice_label" value={settings.invoice_label || ''} onChange={handleChange} /></div>
          <div className="pt-4 border-t space-y-2">
             <Label className="text-xs text-muted-foreground">Set Next Sequence Number</Label>
             <div className="flex gap-2"><Input value={nextInvoiceSeq} onChange={e => setNextInvoiceSeq(e.target.value)} placeholder="e.g. 101" /><Button variant="outline" onClick={() => updateSeq('INVOICE', nextInvoiceSeq)}>Update</Button></div>
          </div>
       </ConfigCard>

       <ConfigCard title="Quotation Configuration">
          <div className="space-y-2"><Label>Number Format</Label><Input name="quotation_format" value={settings.quotation_format || ''} onChange={handleChange} /></div>
          <div className="space-y-2"><Label>Document Label</Label><Input name="quotation_label" value={settings.quotation_label || ''} onChange={handleChange} /></div>
          <div className="pt-4 border-t space-y-2">
             <Label className="text-xs text-muted-foreground">Set Next Sequence Number</Label>
             <div className="flex gap-2"><Input value={nextQuoteSeq} onChange={e => setNextQuoteSeq(e.target.value)} placeholder="e.g. 50" /><Button variant="outline" onClick={() => updateSeq('QUOTATION', nextQuoteSeq)}>Update</Button></div>
          </div>
       </ConfigCard>

       <div className="lg:col-span-2 flex justify-end">
          <Button onClick={saveSettings} disabled={loading} className="bg-primary text-white">Save Configurations</Button>
       </div>
    </div>
  );
}

function ConfigCard({ title, children }: any) {
    return (
        <Card className="shadow-horizon border-none bg-card">
            <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
            <CardContent className="space-y-4">{children}</CardContent>
        </Card>
    )
}