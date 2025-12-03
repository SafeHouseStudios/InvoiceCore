"use client";

import React, { useState, useEffect } from 'react';
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, Loader2, ArrowLeft } from "lucide-react";
import { useRouter, useParams } from 'next/navigation'; 
import Link from "next/link";

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams(); 
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    const loadClient = async () => {
        try {
            const res = await api.get(`/clients/${params.id}`);
            const c = res.data;
            setFormData({
                company_name: c.company_name,
                tax_id: c.tax_id,
                cin: c.cin || '', // <--- Load CIN from backend
                state_code: c.state_code,
                country: c.country,
                email: c.email,
                phone: c.phone,
                address_street: c.addresses?.billing?.street || '',
                address_city: c.addresses?.billing?.city || '',
                address_zip: c.addresses?.billing?.zip || ''
            });
        } catch (e) {
            alert("Failed to load client");
        }
    };
    if (params.id) loadClient();
  }, [params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.put(`/clients/${params.id}`, formData);
      alert("Client updated!");
      router.push('/clients');
    } catch (e) {
      alert("Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (!formData) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      <div className="flex items-center gap-4">
          <Link href="/clients"><Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <h1 className="text-2xl font-bold text-slate-900">Edit Client</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Company Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label>Company Name</Label>
                <Input name="company_name" value={formData.company_name} onChange={handleChange} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>GSTIN / Tax ID</Label>
                    <Input name="tax_id" value={formData.tax_id} onChange={handleChange} />
                </div>
                {/* NEW: CIN INPUT */}
                <div className="space-y-2">
                    <Label>CIN Number</Label>
                    <Input name="cin" value={formData.cin} onChange={handleChange} placeholder="U12345MH..." />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Country</Label><Input name="country" value={formData.country} onChange={handleChange} /></div>
                <div className="space-y-2"><Label>State Code</Label><Input name="state_code" type="number" value={formData.state_code} onChange={handleChange} /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contact & Billing</CardTitle></CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Email</Label><Input name="email" value={formData.email} onChange={handleChange} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input name="phone" value={formData.phone} onChange={handleChange} /></div>
             </div>
             <div className="space-y-3 pt-4 border-t">
                 <Label>Billing Address</Label>
                 <Input name="address_street" placeholder="Street" value={formData.address_street} onChange={handleChange} />
                 <div className="grid grid-cols-2 gap-4">
                   <Input name="address_city" placeholder="City" value={formData.address_city} onChange={handleChange} />
                   <Input name="address_zip" placeholder="Zip" value={formData.address_zip} onChange={handleChange} />
                 </div>
             </div>
             <Button onClick={handleSubmit} disabled={loading} className="w-full mt-4 bg-slate-900 hover:bg-slate-800">
                {loading ? <Loader2 className="animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2" />}
                Update Client
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}