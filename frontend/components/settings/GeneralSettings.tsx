"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface GeneralSettingsProps {
  profile: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSave: () => void;
  loading: boolean;
}

export function GeneralSettings({ profile, handleChange, handleSave, loading }: GeneralSettingsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Form */}
      <div className="lg:col-span-2">
        <Card className="shadow-horizon border-none bg-card">
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
            <CardDescription>Legal info for invoices.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input name="company_name" value={profile.company_name} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>GSTIN / Tax ID</Label>
                <Input name="gstin" value={profile.gstin} onChange={handleChange} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea name="address" value={profile.address} onChange={handleChange} className="min-h-[80px]" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label>State Code</Label>
                <Input type="number" name="state_code" value={profile.state_code} onChange={handleChange} />
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
            <div className="pt-4 flex justify-end">
              <Button onClick={handleSave} disabled={loading} className="bg-primary text-white min-w-[120px]">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Right: Help */}
      <div className="lg:col-span-1">
        <Card className="shadow-horizon border-none bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">Tax Setup</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Your <strong>State Code</strong> determines tax type:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Same State = CGST + SGST</li>
              <li>Different State = IGST</li>
              <li>International = 0% Tax</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}