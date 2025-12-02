"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Loader2 } from "lucide-react";

export function TeamSettings() {
  const [users, setUsers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadUsers(); }, []);
  const loadUsers = () => api.get('/users').then(res => setUsers(res.data));

  const createUser = async () => {
    if(!newUser.email || !newUser.password) return alert("Required");
    setLoading(true);
    try { await api.post('/users', newUser); setNewUser({email:'', password:''}); loadUsers(); alert("Created"); } 
    catch(e) { alert("Failed"); } finally { setLoading(false); }
  };

  const deleteUser = async (id: number) => {
    if(!confirm("Delete?")) return;
    try { await api.delete(`/users/${id}`); loadUsers(); } catch(e) { alert("Failed"); }
  };

  return (
    <Card className="shadow-horizon border-none bg-card">
        <CardHeader><CardTitle>User Management</CardTitle></CardHeader>
        <CardContent>
            <div className="flex gap-4 mb-6 items-end border-b pb-6">
                <div className="space-y-2 flex-1"><Label>New User Email</Label><Input value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} /></div>
                <div className="space-y-2 flex-1"><Label>Password</Label><Input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} /></div>
                <Button onClick={createUser} disabled={loading}>{loading ? <Loader2 className="animate-spin"/> : "Create"}</Button>
            </div>
            <Table>
                <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>2FA</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                <TableBody>
                    {users.map(u => (
                        <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.email}</TableCell>
                            <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                            <TableCell>{u.two_factor_enabled ? <Badge className="bg-green-100 text-green-700">Enabled</Badge> : <Badge variant="secondary">Disabled</Badge>}</TableCell>
                            <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => deleteUser(u.id)}><Trash2 className="w-4 h-4 text-red-500"/></Button></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
  );
}