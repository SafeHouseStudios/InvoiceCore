"use client";

import React, { useEffect, useState } from 'react';
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Plus, MoreHorizontal, CheckCircle, Send, FileEdit, 
  Loader2, Mail, Download, Pencil, Eye
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useRouter } from 'next/navigation';

interface Invoice {
  id: number;
  invoice_number: string;
  issue_date: string;
  grand_total: string;
  status: string;
  client: {
    company_name: string;
    email?: string;
  };
}

export default function InvoiceListPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await api.get('/invoices');
        setInvoices(res.data);
      } catch (err) {
        console.error("Failed to load invoices", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      setInvoices(prev => prev.map(inv => 
        inv.id === id ? { ...inv, status: newStatus } : inv
      ));
      await api.patch(`/invoices/${id}/status`, { status: newStatus });
    } catch (e) {
      alert("Failed to update status");
    }
  };

  const handleDownloadPdf = async (id: number, invoiceNumber: string) => {
    try {
      setActionId(id);
      const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const safeName = invoiceNumber.replace(/\//g, '-');
      link.setAttribute('download', `invoice-${safeName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert("Failed to download PDF");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground">Manage your billing history</p>
        </div>
        <Link href="/invoices/new">
          <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25">
            <Plus className="w-4 h-4 mr-2" /> Create New
          </Button>
        </Link>
      </div>

      <Card className="shadow-horizon border-none bg-card">
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-10 text-center text-muted-foreground flex justify-center">
                <Loader2 className="animate-spin mr-2" /> Loading records...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 && (
                   <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No invoices found.</TableCell></TableRow>
                )}
                
                {invoices.map((inv) => (
                  <TableRow key={inv.id} className="group hover:bg-muted/50 transition-colors">
                    <TableCell className="font-bold text-foreground font-mono">{inv.invoice_number}</TableCell>
                    <TableCell className="text-muted-foreground font-medium">{inv.client?.company_name}</TableCell>
                    <TableCell>{format(new Date(inv.issue_date), "dd MMM yyyy")}</TableCell>
                    <TableCell className="font-bold text-foreground">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(inv.grand_total))}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border
                        ${inv.status === 'PAID' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : ''}
                        ${inv.status === 'SENT' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' : ''}
                        ${inv.status === 'DRAFT' ? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' : ''}
                      `}>
                        {inv.status}
                      </span>
                    </TableCell>
                    
                    {/* --- ACTION BUTTONS --- */}
                    <TableCell className="text-right">
                       <div className="flex justify-end items-center gap-2">
                           
                           {/* 1. Download PDF */}
                           <Button 
                             variant="ghost" size="icon" 
                             className="h-8 w-8 hover:text-primary hover:bg-primary/10 rounded-full"
                             title="Download PDF"
                             onClick={() => handleDownloadPdf(inv.id, inv.invoice_number)}
                             disabled={actionId === inv.id}
                           >
                             {actionId === inv.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4" />}
                           </Button>

                           {/* 2. Edit Invoice */}
                           <Button 
                             variant="ghost" size="icon"
                             className="h-8 w-8 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                             title="Edit Invoice"
                             onClick={() => router.push(`/invoices/${inv.id}`)} // Redirect to Edit Page
                           >
                             <Pencil className="w-4 h-4" />
                           </Button>

                           {/* 3. More Actions Dropdown */}
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted rounded-full">
                                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleStatusChange(inv.id, 'PAID')}>
                                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" /> Mark Paid
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(inv.id, 'SENT')}>
                                    <Send className="w-4 h-4 mr-2 text-blue-600" /> Mark Sent
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(inv.id, 'DRAFT')}>
                                    <FileEdit className="w-4 h-4 mr-2 text-slate-500" /> Mark Draft
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                           </DropdownMenu>
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}