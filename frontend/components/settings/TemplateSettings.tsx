"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Code, Eye } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import DOMPurify from "dompurify";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TemplateSettings() {
  const [invoiceHtml, setInvoiceHtml] = useState("");
  const [loading, setLoading] = useState(false);

  // Load existing template
  useEffect(() => {
    api.get('/settings/template/INVOICE').then(res => {
        if (res.data.html) setInvoiceHtml(res.data.html);
        else setInvoiceHtml(DEFAULT_TEMPLATE); // Set a default starter if empty
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    
    // 1. CLIENT-SIDE SANITIZATION
    // Note: We allow style tags here for the editor preview, backend re-sanitizes
    const clean = DOMPurify.sanitize(invoiceHtml, {
        ADD_TAGS: ['style'],
        ADD_ATTR: ['style', 'class']
    });

    try {
        await api.post('/settings/template', { html: clean, type: 'INVOICE' });
        alert("Template Saved & Secured!");
    } catch (e) {
        alert("Failed to save template");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[80vh]">
        {/* EDITOR COLUMN */}
        <Card className="shadow-horizon border-none bg-card flex flex-col h-full">
            <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                    <span>HTML Editor</span>
                    <Button size="sm" onClick={handleSave} disabled={loading} className="bg-primary text-white">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Template
                    </Button>
                </CardTitle>
                <CardDescription>Use <code>{`{{variable}}`}</code> to inject data.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden border-t border-border">
                <CodeMirror
                    value={invoiceHtml}
                    height="100%"
                    extensions={[html()]}
                    onChange={(val) => setInvoiceHtml(val)}
                    theme="dark"
                    className="h-full text-sm"
                />
            </CardContent>
        </Card>

        {/* PREVIEW COLUMN */}
        <Card className="shadow-horizon border-none bg-card flex flex-col h-full">
            <CardHeader className="pb-2">
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>How it might look (Data mocked)</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0 bg-white dark:bg-slate-900 overflow-auto border-t border-border">
                <div className="p-4">
                    {/* Dangerously Set HTML is safe here because we control the input */}
                    <div 
                        className="invoice-preview origin-top scale-75 w-[210mm] h-[297mm] bg-white text-black shadow-lg mx-auto p-10"
                        dangerouslySetInnerHTML={{ __html: invoiceHtml }}
                    />
                </div>
            </CardContent>
        </Card>
    </div>
  );
}

const DEFAULT_TEMPLATE = `
<html>
<head>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; }
    h1 { color: #4318FF; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <div class="header">
    <div>
        <h1>{{company_name}}</h1>
        <p>{{company_address}}</p>
    </div>
    <div style="text-align: right;">
        <h2>INVOICE</h2>
        <p># {{invoice_number}}</p>
        <p>Date: {{issue_date}}</p>
    </div>
  </div>

  <div style="margin-top: 20px;">
    <strong>Bill To:</strong><br>
    {{client_name}}<br>
    {{client_address}}
  </div>

  <table>
    <thead>
        <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Amount</th>
        </tr>
    </thead>
    <tbody>
        {{#items}}
        <tr>
            <td>{{description}}</td>
            <td>{{quantity}}</td>
            <td>{{rate}}</td>
            <td>{{amount}}</td>
        </tr>
        {{/items}}
    </tbody>
  </table>

  <h3 style="text-align: right; margin-top: 20px;">Total: {{grand_total}}</h3>
</body>
</html>
`;