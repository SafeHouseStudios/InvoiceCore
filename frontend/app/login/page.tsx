"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useRouter } from 'next/navigation';
import { Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      
      // Save token to LocalStorage
      localStorage.setItem('token', res.data.token);
      
      // Redirect to dashboard
      router.push('/');
      
    } catch (err: any) {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <Card className="w-[350px]">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
             <div className="bg-slate-100 p-3 rounded-full">
                <Lock className="w-6 h-6 text-slate-900" />
             </div>
          </div>
          <CardTitle>InvoiceCore</CardTitle>
          <CardDescription>Enter your credentials to access</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email" 
                placeholder="admin@invoicecore.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input 
                type="password" 
                placeholder="••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
            
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            
            <Button type="submit" className="w-full bg-slate-900">Login</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}