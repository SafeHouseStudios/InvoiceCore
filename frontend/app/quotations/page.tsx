// frontend/app/quotations/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, FileText, Loader2, MoreHorizontal } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-slate-50 p-8 space-y-6">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quotations</h1>
          <p className="text-slate-500">Manage estimates and proposals</p>
        </div>
        <Link href="/quotations/new">
          <Button className="bg-slate-900 hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-2" /> Create Quote
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Quotations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-10 text-center text-slate-400 flex justify-center">
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
                     <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                        No quotations found.
                     </TableCell>
                   </TableRow>
                )}
                
                {quotes.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium font-mono text-slate-700">{q.quotation_number}</TableCell>
                    <TableCell>{q.client?.company_name || "Unknown"}</TableCell>
                    <TableCell>{format(new Date(q.issue_date), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(q.grand_total))}
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                        {q.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Convert to Invoice</DropdownMenuItem>
                            <DropdownMenuItem>Download PDF</DropdownMenuItem>
                          </DropdownMenuContent>
                       </DropdownMenu>
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