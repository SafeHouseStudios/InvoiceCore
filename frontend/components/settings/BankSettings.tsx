"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast-context";

interface BankSettingsProps {
  disabled?: boolean;
}

export function BankSettings({ disabled }: BankSettingsProps) {
  const { toast } = useToast();
  const [banks, setBanks] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({});

  useEffect(() => { loadBanks(); }, []);
  const loadBanks = () => api.get('/banks').then(res => setBanks(res.data));

  const openDialog = (bank?: any) => {
    if (disabled) return;
    setEditingId(bank ? bank.id : null);
    setForm(bank || { label: '', currency: 'USD', is_default: false });
    setIsOpen(true);
  };

  const saveBank = async () => {
    if(!form.label || !form.account_number) return toast("Missing fields", "warning");
    try {
        if(editingId) await api.put(`/banks/${editingId}`, form);
        else await api.post('/banks', form);
        setIsOpen(false); loadBanks();
        toast("Bank Account Saved", "success");
    } catch(e) { toast("Failed to save bank", "error"); }
  };

  const deleteBank = async (id: number) => {
     if(!confirm("Delete?")) return;
     try { await api.delete(`/banks/${id}`); loadBanks(); toast("Bank deleted", "success"); } 
     catch(e) { toast("Failed", "error"); }
  };

  const setDefault = async (id: number) => {
     if (disabled) return;
     try { await api.patch(`/banks/${id}/default`); loadBanks(); toast("Default set", "success"); } 
     catch(e) { toast("Failed", "error"); }
  };

  return (
    <Card className="shadow-horizon border-none bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle>Bank Accounts</CardTitle><CardDescription>Manage accounts for invoices.</CardDescription></div>
            {!disabled && (
                <Button onClick={() => openDialog()} className="bg-primary text-white"><Plus className="w-4 h-4 mr-2"/> Add Bank</Button>
            )}
        </CardHeader>
        <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
                {banks.map(bank => (
                    <div key={bank.id} className={`p-5 rounded-xl border-2 transition-all ${bank.is_default ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/20'}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold flex items-center gap-2">{bank.label} {bank.is_default && <Badge>Default</Badge>}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{bank.bank_name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{bank.account_number} • {bank.currency}</p>
                            </div>
                            {!disabled && (
                                <Button variant="ghost" size="icon" onClick={() => openDialog(bank)}><Pencil className="w-4 h-4"/></Button>
                            )}
                        </div>
                        
                        {!disabled && (
                            <div className="mt-4 pt-3 border-t flex justify-between items-center">
                                {!bank.is_default && <Button variant="link" size="sm" className="p-0 h-auto text-primary" onClick={() => setDefault(bank.id)}>Make Default</Button>}
                                <Button variant="ghost" size="sm" className="text-red-500 ml-auto" onClick={() => deleteBank(bank.id)}><Trash2 className="w-4 h-4 mr-1"/> Delete</Button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </CardContent>
        
        {/* Dialog only renders if not disabled (though openDialog is guarded too) */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader><DialogTitle>{editingId ? "Edit" : "Add"} Account</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Label</Label><Input value={form.label} onChange={e => setForm({...form, label: e.target.value})} placeholder="Main" /></div>
                        <div className="space-y-2"><Label>Currency</Label><select className="w-full h-9 border rounded-md bg-background px-3 text-sm" value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}><option>USD</option><option>INR</option><option>EUR</option><option>GBP</option></select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Bank Name</Label><Input value={form.bank_name} onChange={e => setForm({...form, bank_name: e.target.value})} /></div>
                        <div className="space-y-2"><Label>Account #</Label><Input value={form.account_number} onChange={e => setForm({...form, account_number: e.target.value})} /></div>
                    </div>
                    <div className="space-y-2"><Label>Holder Name</Label><Input value={form.account_holder} onChange={e => setForm({...form, account_holder: e.target.value})} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>IFSC</Label><Input value={form.ifsc_code} onChange={e => setForm({...form, ifsc_code: e.target.value})} /></div>
                        <div className="space-y-2"><Label>SWIFT</Label><Input value={form.swift_code} onChange={e => setForm({...form, swift_code: e.target.value})} /></div>
                    </div>
                    <div className="space-y-2"><Label>Branch Address</Label><Textarea value={form.branch_address} onChange={e => setForm({...form, branch_address: e.target.value})} /></div>
                </div>
                <DialogFooter><Button onClick={saveBank}>Save Account</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    </Card>
  );
}