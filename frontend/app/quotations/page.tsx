"use client";

import React, { useEffect, useState } from 'react';
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, FileText, Loader2, MoreHorizontal, Send, CheckCircle, XCircle, Eye, Pencil
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface Quotation {
  id: number;
  quotation_number: string;
  issue_date: string;
  grand_total: string;
  status: string;
  client: { company_name: string };
}

export default function QuotationListPage() {
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const res = await api.get('/quotations');
        setQuotes(res.data);
      } catch (err) {
        console.error("Failed to load quotations", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuotes();
  }, []);

  const handleStatusChange = async (id: number, status: string) => {
      // Ideally add API call here to update status
      alert(`Mark as ${status} (Not implemented yet)`);
  };

  return (
    <div className="p-6 space-y-6">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quotations</h1>
          <p className="text-muted-foreground">Manage estimates and proposals</p>
        </div>
        <Link href="/quotations/new">
          <Button className="bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" /> Create Quote
          </Button>
        </Link>
      </div>

      <Card className="shadow-horizon border-none bg-card">
        <CardHeader>
          <CardTitle>Recent Quotations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-10 text-center text-muted-foreground flex justify-center">
                <Loader2 className="animate-spin mr-2" /> Loading...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.length === 0 && (
                   <TableRow>
                     <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        No quotations found.
                     </TableCell>
                   </TableRow>
                )}
                
                {quotes.map((q) => (
                  <TableRow key={q.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-bold text-foreground font-mono">{q.quotation_number}</TableCell>
                    <TableCell className="font-medium text-muted-foreground">{q.client?.company_name || "Unknown"}</TableCell>
                    <TableCell>{format(new Date(q.issue_date), "dd MMM yyyy")}</TableCell>
                    <TableCell className="font-bold text-foreground">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(q.grand_total))}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border
                        ${q.status === 'ACCEPTED' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : ''}
                        ${q.status === 'SENT' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' : ''}
                        ${q.status === 'DRAFT' ? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' : ''}
                      `}>
                        {q.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex justify-end items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"><Eye className="w-4 h-4"/></Button>
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem><Pencil className="w-4 h-4 mr-2"/> Edit Quote</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(q.id, 'SENT')}><Send className="w-4 h-4 mr-2 text-blue-500"/> Mark Sent</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(q.id, 'ACCEPTED')}><CheckCircle className="w-4 h-4 mr-2 text-green-500"/> Convert to Invoice</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-500"><XCircle className="w-4 h-4 mr-2"/> Delete</DropdownMenuItem>
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