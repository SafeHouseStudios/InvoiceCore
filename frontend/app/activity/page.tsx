"use client";

import React, { useEffect, useState } from 'react';
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Activity, Loader2, User, Clock, Monitor } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/activity');
        setLogs(res.data);
      } catch (e) {
        console.error("Failed to load activity logs");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getActionColor = (action: string) => {
      if (action.includes("LOGIN")) return "bg-blue-100 text-blue-700 border-blue-200";
      if (action.includes("CREATE")) return "bg-green-100 text-green-700 border-green-200";
      if (action.includes("DELETE")) return "bg-red-100 text-red-700 border-red-200";
      if (action.includes("UPDATE")) return "bg-amber-100 text-amber-700 border-amber-200";
      return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-full"><Activity className="w-6 h-6 text-primary" /></div>
        <div>
            <h1 className="text-2xl font-bold text-foreground">Activity Log</h1>
            <p className="text-muted-foreground">Audit trail of system usage.</p>
        </div>
      </div>

      <Card className="shadow-horizon border-none bg-card">
        <CardHeader>
            <CardTitle>Recent Actions</CardTitle>
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="p-10 text-center flex justify-center text-muted-foreground"><Loader2 className="animate-spin mr-2"/> Loading logs...</div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">User</TableHead>
                            <TableHead className="w-[150px]">Action</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-[150px] text-right">Time</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.length === 0 && (
                            <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No activity recorded yet.</TableCell></TableRow>
                        )}
                        {logs.map((log) => (
                            <TableRow key={log.id} className="hover:bg-muted/50 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-xs">{log.user.email}</span>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Monitor className="w-3 h-3"/> {log.ip_address || 'Unknown IP'}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${getActionColor(log.action)}`}>
                                        {log.action}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm text-foreground">{log.description}</div>
                                    {log.entity_type && (
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            Ref: {log.entity_type} #{log.entity_id}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground" title={new Date(log.created_at).toLocaleString()}>
                                        <Clock className="w-3 h-3" />
                                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
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