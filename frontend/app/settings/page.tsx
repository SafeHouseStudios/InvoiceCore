"use client";

import React, { useEffect, useState } from 'react';
import api from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Loader2, Building2, Wallet, Upload, Download, AlertTriangle, Globe } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  
  // Profile State
  const [profile, setProfile] = useState({
    company_name: '',
    address: '',
    state_code: '',
    gstin: '',
    phone: '',
    email: '',
    currency: 'INR', // Default Currency
    bank_details: {
        bank_name: '',
        ac_no: '',
        ifsc: ''
    }
  });

  // Load Settings on Mount
  useEffect(() => {
    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings/company');
            if (res.data) {
                // Merge with default state to prevent undefined errors
                setProfile(prev => ({
                    ...prev,
                    ...res.data,
                    // Ensure nested objects exist
                    bank_details: { ...prev.bank_details, ...(res.data.bank_details || {}) },
                    currency: res.data.currency || 'INR'
                }));
            }
        } catch (err) {
            console.error("Failed to load settings", err);
        }
    };
    fetchSettings();
  }, []);

  // --- Handlers ---

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleBankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({
        ...profile,
        bank_details: {
            ...profile.bank_details,
            [e.target.name]: e.target.value
        }
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/settings/company', profile);
      alert("Settings updated successfully!");
    } catch (error) {
      alert("Failed to save settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackupDownload = async () => {
    try {
        const response = await api.get('/backup/export', { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoicecore-backup-${new Date().toISOString().slice(0,10)}.iec`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (e) {
        console.error(e);
        alert("Download failed");
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("WARNING: This will merge/overwrite data in your database. Continue?")) {
        e.target.value = ""; // Reset input
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsBackupLoading(true);
    try {
        await api.post('/backup/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert("Restore Successful! The system will now reload.");
        window.location.reload();
    } catch (err) {
        console.error(err);
        alert("Restore Failed. Please check if the file is a valid .iec backup.");
    } finally {
        setIsBackupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 space-y-6">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">System Settings</h1>
          <p className="text-slate-500">Manage your company profile and configurations</p>
        </div>
        <Button onClick={handleSave} disabled={loading} className="bg-slate-900 hover:bg-slate-800">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-white border">
          <TabsTrigger value="general" className="data-[state=active]:bg-slate-100">
             <Building2 className="w-4 h-4 mr-2" /> General
          </TabsTrigger>
          <TabsTrigger value="bank" className="data-[state=active]:bg-slate-100">
             <Wallet className="w-4 h-4 mr-2" /> Bank Details
          </TabsTrigger>
          <TabsTrigger value="backup" className="data-[state=active]:bg-slate-100 text-blue-600">
             <Upload className="w-4 h-4 mr-2" /> Backup & Restore
          </TabsTrigger>
        </TabsList>

        {/* --- TAB 1: GENERAL INFO --- */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
              <CardDescription>These details will appear on your PDF invoices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input name="company_name" value={profile.company_name} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label>GSTIN</Label>
                  <Input name="gstin" value={profile.gstin} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address (Full)</Label>
                <Input name="address" value={profile.address} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>State Code (Owner)</Label>
                  <Input name="state_code" type="number" placeholder="e.g., 19" value={profile.state_code} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input name="phone" value={profile.phone} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input name="email" value={profile.email} onChange={handleChange} />
                </div>
              </div>

              {/* Currency Selector */}
              <div className="pt-4 border-t">
                  <div className="w-1/3 space-y-2">
                    <Label className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-slate-500" /> Default Currency
                    </Label>
                    <select 
                        name="currency" 
                        value={profile.currency} 
                        onChange={handleChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <option value="INR">INR (₹) - Indian Rupee</option>
                        <option value="USD">USD ($) - US Dollar</option>
                        <option value="EUR">EUR (€) - Euro</option>
                        <option value="GBP">GBP (£) - British Pound</option>
                        <option value="AED">AED (د.إ) - UAE Dirham</option>
                    </select>
                  </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 2: BANK DETAILS --- */}
        <TabsContent value="bank">
          <Card>
            <CardHeader>
              <CardTitle>Banking Information</CardTitle>
              <CardDescription>Optional: Displayed on invoices for wire transfers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input name="bank_name" value={profile.bank_details.bank_name} onChange={handleBankChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input name="ac_no" value={profile.bank_details.ac_no} onChange={handleBankChange} />
                </div>
                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  <Input name="ifsc" value={profile.bank_details.ifsc} onChange={handleBankChange} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 3: BACKUP --- */}
        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Export your data to a .iec file or restore from a backup.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                <div>
                  <h3 className="font-medium text-slate-900">Export Data</h3>
                  <p className="text-sm text-slate-500">Download a full backup of clients, invoices, and settings.</p>
                </div>
                <Button variant="outline" onClick={handleBackupDownload}>
                  <Download className="w-4 h-4 mr-2" /> Download .iec
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-red-50 border-red-100">
                <div className="w-2/3">
                  <h3 className="font-medium text-red-900 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" /> Import Data
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    Restore from a .iec backup file. <br/>
                    <strong>Warning:</strong> This will merge data. Existing records with same IDs will be updated.
                  </p>
                </div>
                <div className="w-1/3 flex justify-end">
                    {isBackupLoading ? (
                        <Button disabled variant="destructive">
                            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Restoring...
                        </Button>
                    ) : (
                        <div className="relative">
                            <input 
                                type="file" 
                                accept=".iec" 
                                onChange={handleRestore}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Button variant="destructive">
                                <Upload className="w-4 h-4 mr-2" /> Restore Backup
                            </Button>
                        </div>
                    )}
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}