"use client";

import React, { useState, useEffect } from 'react';
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from 'next/navigation';
import Link from "next/link";

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState<any[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    company_name: '',
    tax_id: '',
    state_code: '', // Vital for GST Logic
    country: 'India',
    email: '',
    phone: '',
    address_street: '',
    address_city: '',
    address_zip: ''
  });

  // 1. Fetch States on Load
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await api.get('/utils/states');
        setStates(res.data);
      } catch (err) {
        console.error("Failed to load states", err);
      }
    };
    fetchStates();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.company_name) {
      alert("Company Name is required.");
      return;
    }
    if (!formData.state_code) {
      alert("State Selection is mandatory for Tax Calculation.");
      return;
    }

    setLoading(true);
    try {
      await api.post('/clients', formData);
      alert("Client created successfully!");
      router.back(); // Go back to previous page (Invoice or List)
    } catch (error) {
      console.error(error);
      alert("Failed to create client. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/invoices/new">
             <Button variant="outline" size="icon" title="Go Back">
                <ArrowLeft className="w-4 h-4" />
             </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Add New Client</h1>
            <p className="text-sm text-slate-500">Enter client details for tax calculation</p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={loading} className="bg-slate-900 hover:bg-slate-800">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Client
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left: Company Details */}
        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
            <CardDescription>Legal information for Invoicing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input 
                name="company_name" 
                placeholder="e.g. Acme Corp" 
                value={formData.company_name}
                onChange={handleChange} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>GSTIN / Tax ID</Label>
                <Input 
                    name="tax_id" 
                    placeholder="27ABCDE1234F1Z5" 
                    value={formData.tax_id}
                    onChange={handleChange} 
                />
              </div>
              <div className="space-y-2">
                <Label>State (Place of Supply) *</Label>
                <select 
                  name="state_code" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onChange={handleChange}
                  value={formData.state_code}
                >
                  <option value="">Select State...</option>
                  {states.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.code} - {state.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Country</Label>
              <Input name="country" defaultValue="India" onChange={handleChange} />
            </div>
          </CardContent>
        </Card>

        {/* Right: Contact & Address */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Info</CardTitle>
            <CardDescription>Billing address and communication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    name="email" 
                    type="email" 
                    placeholder="accounts@client.com"
                    value={formData.email}
                    onChange={handleChange} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input 
                    name="phone" 
                    type="tel" 
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange} 
                  />
                </div>
             </div>
             
             <div className="pt-4 border-t mt-4">
               <Label className="mb-3 block text-slate-500 font-semibold">Billing Address</Label>
               <div className="space-y-3">
                 <Input 
                    name="address_street" 
                    placeholder="Street Address / Area" 
                    value={formData.address_street}
                    onChange={handleChange} 
                 />
                 <div className="grid grid-cols-2 gap-4">
                   <Input 
                        name="address_city" 
                        placeholder="City" 
                        value={formData.address_city}
                        onChange={handleChange} 
                    />
                   <Input 
                        name="address_zip" 
                        placeholder="Pincode" 
                        value={formData.address_zip}
                        onChange={handleChange} 
                    />
                 </div>
               </div>
             </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}