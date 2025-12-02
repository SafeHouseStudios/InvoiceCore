"use client";

import React, { useEffect, useState } from 'react';
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Loader2, MoreHorizontal, Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation'; // <--- Import Router

export default function ClientListPage() {
  const router = useRouter(); // <--- Initialize Router
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients');
      setClients(res.data);
    } catch (err) {
      console.error("Failed to load clients", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure? This will delete the client and unlink their invoices.")) return;
    try {
        await api.delete(`/clients/${id}`);
        fetchClients(); // Refresh list
    } catch (e) {
        alert("Failed to delete client");
    }
  };

  const filteredClients = clients.filter(c => 
    c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8 space-y-6">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500">Manage your customer database</p>
        </div>
        <Link href="/clients/new">
          <Button className="bg-slate-900 hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-2" /> Add Client
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>All Clients</CardTitle>
            <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                    placeholder="Search clients..." 
                    className="pl-8" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-10 text-center text-slate-400 flex justify-center">
                <Loader2 className="animate-spin mr-2" /> Loading records...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Tax ID / GSTIN</TableHead>
                  <TableHead>State / Location</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 && (
                   <TableRow>
                     <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                        No clients found.
                     </TableCell>
                   </TableRow>
                )}
                
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium text-slate-900">
                        {client.company_name}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">
                        {client.tax_id || "N/A"}
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center text-slate-600">
                            <MapPin className="w-3 h-3 mr-1" />
                            {client.state_code === 99 ? "International" : `${client.state_code} - India`}
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col gap-1 text-xs text-slate-500">
                            {client.email && <span className="flex items-center"><Mail className="w-3 h-3 mr-1"/> {client.email}</span>}
                            {client.phone && <span className="flex items-center"><Phone className="w-3 h-3 mr-1"/> {client.phone}</span>}
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}`)}>Edit Details</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(client.id)}>Delete</DropdownMenuItem>
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