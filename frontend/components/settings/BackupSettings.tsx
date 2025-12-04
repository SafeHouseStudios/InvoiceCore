"use client";

import React, { useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, Loader2, HelpCircle, FileText } from "lucide-react";
import { useToast } from "@/components/ui/toast-context";

export function BackupSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const downloadBackup = async () => {
    try {
        const res = await api.get('/backup/export', { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `backup-${new Date().toISOString().slice(0,10)}.iec`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast("Backup download started.", "success");
    } catch(e) { 
        toast("Failed to download backup.", "error"); 
    }
  };

  const restoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !confirm("This will OVERWRITE your current data. Are you sure?")) return;
    
    const fd = new FormData(); 
    fd.append('file', file);
    
    setLoading(true);
    try { 
        await api.post('/backup/import', fd, { headers: {'Content-Type': 'multipart/form-data'} }); 
        toast("System restored successfully! Refreshing...", "success"); 
        setTimeout(() => window.location.reload(), 1500);
    } 
    catch(e) { 
        toast("Restore failed. Invalid file or server error.", "error"); 
    } finally { 
        setLoading(false); 
    }
  };

  const importCsv = async (e: React.ChangeEvent<HTMLInputElement>, url: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const fd = new FormData(); 
    fd.append('file', file);
    
    setImporting(true);
    try { 
        const res = await api.post(url, fd, { headers: {'Content-Type': 'multipart/form-data'} }); 
        toast(`Success! Imported ${res.data.imported} records.`, "success"); 
    } 
    catch(e) { 
        toast("Import failed. Check CSV format.", "error"); 
    } finally { 
        setImporting(false); 
        e.target.value = ''; 
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: ACTIONS */}
        <div className="xl:col-span-2 space-y-6">
            {/* CARD 1: SYSTEM BACKUP */}
            <Card className="shadow-horizon border-none bg-card">
                <CardHeader>
                    <CardTitle>System Backup</CardTitle>
                    <CardDescription>Full system snapshot (Encrypted .iec file)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                        <div><h4 className="font-bold text-sm">Export Data</h4></div>
                        <Button variant="outline" onClick={downloadBackup}>
                            <Download className="w-4 h-4 mr-2"/> Download
                        </Button>
                    </div>
                    <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-950/10 rounded-lg flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-sm text-red-700 dark:text-red-400">Restore Data</h4>
                            <p className="text-xs text-red-600/70 dark:text-red-400/70">Overwrites existing database</p>
                        </div>
                        <div className="relative">
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={restoreBackup} accept=".iec" />
                            <Button className="bg-red-600 hover:bg-red-700 text-white shadow-sm" disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Select File"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* CARD 2: LEGACY IMPORTS */}
            <Card className="shadow-horizon border-none bg-card">
                <CardHeader>
                    <CardTitle>Legacy Imports</CardTitle>
                    <CardDescription>Migrate data from other systems via CSV</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    
                    {/* Clients */}
                    <div className="p-4 border border-dashed rounded-lg flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <h4 className="text-sm font-medium">Import Clients</h4>
                        <div className="relative">
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => importCsv(e, '/import/clients')} accept=".csv" />
                            <Button variant="secondary" disabled={importing}>
                                <Upload className="w-4 h-4 mr-2"/> Upload CSV
                            </Button>
                        </div>
                    </div>

                    {/* Invoices */}
                    <div className="p-4 border border-dashed rounded-lg flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <h4 className="text-sm font-medium">Import Invoices</h4>
                        <div className="relative">
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => importCsv(e, '/import/invoices')} accept=".csv" />
                            <Button variant="secondary" disabled={importing}>
                                <Upload className="w-4 h-4 mr-2"/> Upload CSV
                            </Button>
                        </div>
                    </div>

                    {/* Quotations */}
                    <div className="p-4 border border-dashed rounded-lg flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <h4 className="text-sm font-medium">Import Quotations</h4>
                        <div className="relative">
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => importCsv(e, '/import/quotations')} accept=".csv" />
                            <Button variant="secondary" disabled={importing}>
                                <Upload className="w-4 h-4 mr-2"/> Upload CSV
                            </Button>
                        </div>
                    </div>

                </CardContent>
            </Card>
        </div>

        {/* RIGHT COLUMN: HELP & TIPS */}
        <div className="xl:col-span-1">
            <Card className="bg-primary/5 border-primary/10 sticky top-6">
                <CardHeader>
                    <CardTitle className="text-primary flex items-center gap-2">
                        <HelpCircle className="w-5 h-5" /> CSV Import Guide
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-6 text-muted-foreground">
                    
                    <div className="space-y-2">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500"/> Clients
                        </h4>
                        <p className="text-xs">Required CSV Headers:</p>
                        <code className="block bg-background p-3 rounded-md border text-[10px] font-mono break-all">
                            company_name, email, phone, tax_id, address_street, address_city, state_code, country
                        </code>
                        <p className="text-xs italic">Tip: Use ISO 2-digit country codes (e.g., IN, US).</p>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                            <FileText className="w-4 h-4 text-orange-500"/> Invoices
                        </h4>
                        <p className="text-xs">Required CSV Headers:</p>
                        <code className="block bg-background p-3 rounded-md border text-[10px] font-mono break-all">
                            invoice_number, issue_date (YYYY-MM-DD), due_date, client_name, total_amount, status
                        </code>
                        <p className="text-xs italic">Note: Line items cannot be imported via CSV. Only grand totals are migrated.</p>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                            <FileText className="w-4 h-4 text-purple-500"/> Quotations
                        </h4>
                         <p className="text-xs">Required CSV Headers:</p>
                        <code className="block bg-background p-3 rounded-md border text-[10px] font-mono break-all">
                            quotation_number, issue_date (YYYY-MM-DD), client_name, total_amount, status
                        </code>
                    </div>

                </CardContent>
            </Card>
        </div>

    </div>
  );
}
